import type { KardexMovement, KardexDetalleSalida } from "../services/types";

export interface KardexBatch {
    cantidad: number;
    costoUnitario: number;
    costoTotal: number;
}

export interface ProcessedKardexItem {
    fecha: string;
    type: string;
    serie: string;
    numero: string;
    operationType: string;
    entrada: {
        cantidad: number;
        costoUnitario: number;
        costoTotal: number;
    };
    salida: {
        cantidad: number;
        costoUnitario: number;
        costoTotal: number;
        batches?: KardexBatch[]; // Detalles de los lotes que salieron
    };
    saldo: {
        batches: KardexBatch[];
        cantidad: number;
        costoUnitario: number; // For backward compatibility / simplified view
        costoTotal: number;
    };
}

export interface KardexTotals {
    entradas: number; // Total Value
    salidas: number;  // Total Value
}

export const parseComprobante = (nComprobante: string) => {
    if (!nComprobante || !nComprobante.includes('-')) {
        return { serie: "", numero: nComprobante || "" };
    }
    const parts = nComprobante.split('-');
    return {
        serie: parts[0] || "",
        numero: parts[1] || ""
    };
};

/**
 * Procesa los movimientos del kardex usando método PEPS (FIFO).
 * Mantiene una cola de lotes para calcular costos de salida y saldos exactos.
 */
export const calculateFIFO = (
    kardexData: KardexMovement[],
    initialInventory: { cantidad: number; costoTotal: number }
): ProcessedKardexItem[] => {
    const processedData: ProcessedKardexItem[] = [];

    // Inicializar cola de lotes con el inventario inicial
    // Asumimos que el inventario inicial es un único lote
    let inventoryQueue: KardexBatch[] = [];

    if (initialInventory.cantidad > 0) {
        inventoryQueue.push({
            cantidad: initialInventory.cantidad,
            costoUnitario: initialInventory.costoTotal / initialInventory.cantidad,
            costoTotal: initialInventory.costoTotal
        });
    }

    kardexData.forEach((movement) => {
        const { serie, numero } = parseComprobante(movement.nComprobante || "");

        if (movement.tipo === "Entrada") {
            // --- LÓGICA DE ENTRADA (PEPS) ---
            // Cada entrada crea un nuevo lote al final de la cola
            const costoTotalEntrada = movement.costoTotal && movement.costoTotal !== 0
                ? movement.costoTotal
                : movement.cantidad * movement.costoUnitario;

            const nuevoLote: KardexBatch = {
                cantidad: movement.cantidad,
                costoUnitario: movement.costoUnitario,
                costoTotal: costoTotalEntrada
            };

            inventoryQueue.push(nuevoLote);

            // Calcular totales del saldo actual
            const saldoCantidad = inventoryQueue.reduce((acc, batch) => acc + batch.cantidad, 0);
            const saldoCostoTotal = inventoryQueue.reduce((acc, batch) => acc + batch.costoTotal, 0);

            processedData.push({
                fecha: movement.fecha,
                type: movement.tComprob || "",
                serie,
                numero,
                operationType: movement.tOperacion || "",
                entrada: {
                    cantidad: movement.cantidad,
                    costoUnitario: movement.costoUnitario,
                    costoTotal: costoTotalEntrada
                },
                salida: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                saldo: {
                    batches: JSON.parse(JSON.stringify(inventoryQueue)), // Snapshot profundo
                    cantidad: saldoCantidad,
                    costoUnitario: saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0, // Promedio referencial
                    costoTotal: saldoCostoTotal
                }
            });

        } else if (movement.tipo === "Salida") {
            // --- LÓGICA DE SALIDA (PEPS) ---
            // Consumir lotes desde el inicio de la cola y registrar el desglose

            let cantidadPorSacar = movement.cantidad;
            let costoTotalSalida = 0;
            const exitBatches: KardexBatch[] = [];
            const balanceBatchesForDisplay: KardexBatch[] = [];

            // Copiamos la cola actual para iterar y reconstruir la nueva cola
            const originalQueue = JSON.parse(JSON.stringify(inventoryQueue));
            const newInventoryQueue: KardexBatch[] = [];

            for (const batch of originalQueue) {
                if (cantidadPorSacar > 0) {
                    if (batch.cantidad > cantidadPorSacar) {
                        // El lote alcanza de sobra (Consumo parcial)
                        const costoSalidaParcial = cantidadPorSacar * batch.costoUnitario;

                        // Registrar salida
                        exitBatches.push({
                            cantidad: cantidadPorSacar,
                            costoUnitario: batch.costoUnitario,
                            costoTotal: costoSalidaParcial
                        });

                        costoTotalSalida += costoSalidaParcial;

                        // El remanente se mantiene en el inventario y en el display
                        const remanenteBatch = {
                            cantidad: batch.cantidad - cantidadPorSacar,
                            costoUnitario: batch.costoUnitario,
                            costoTotal: batch.costoTotal - costoSalidaParcial
                        };

                        balanceBatchesForDisplay.push(remanenteBatch);
                        newInventoryQueue.push(remanenteBatch);

                        cantidadPorSacar = 0;
                    } else {
                        // El lote se agota exacto o falta más (Consumo total del lote)
                        const cantidadSacada = batch.cantidad;
                        const costoSalidaParcial = batch.costoTotal; // Total exacto

                        // Registrar salida
                        exitBatches.push({
                            cantidad: cantidadSacada,
                            costoUnitario: batch.costoUnitario,
                            costoTotal: costoSalidaParcial
                        });

                        costoTotalSalida += costoSalidaParcial;
                        cantidadPorSacar -= cantidadSacada;

                        // En el display, mostramos el lote como agotado (0) para mantener alineación visual
                        // IMPORTANTE: Se muestra con cantidad 0
                        balanceBatchesForDisplay.push({
                            cantidad: 0,
                            costoUnitario: batch.costoUnitario,
                            costoTotal: 0
                        });

                        // NO lo agregamos a newInventoryQueue
                    }
                } else {
                    // Ya terminamos de sacar, este lote queda intacto
                    balanceBatchesForDisplay.push(batch);
                    newInventoryQueue.push(batch);
                }
            }

            // Actualizar la cola real
            inventoryQueue = newInventoryQueue;

            // Calcular totales del saldo actual (usando la cola real)
            const saldoCantidad = inventoryQueue.reduce((acc, batch) => acc + batch.cantidad, 0);
            const saldoCostoTotal = inventoryQueue.reduce((acc, batch) => acc + batch.costoTotal, 0);

            // Costo unitario promedio de la salida (referencial)
            const costoUnitarioSalidaPromedio = movement.cantidad > 0 ? costoTotalSalida / movement.cantidad : 0;

            processedData.push({
                fecha: movement.fecha,
                type: movement.tComprob || "",
                serie,
                numero,
                operationType: movement.tOperacion || "",
                entrada: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                salida: {
                    cantidad: movement.cantidad,
                    costoUnitario: costoUnitarioSalidaPromedio,
                    costoTotal: costoTotalSalida,
                    batches: exitBatches // Agregamos el detalle
                },
                saldo: {
                    batches: balanceBatchesForDisplay, // Usamos la versión con ceros para visualización
                    cantidad: saldoCantidad,
                    costoUnitario: saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0,
                    costoTotal: saldoCostoTotal
                }
            });
        }
    });

    return processedData;
};

/**
 * Procesa los movimientos del kardex usando método PROMEDIO PONDERADO.
 * Recalcula el costo unitario promedio en cada entrada.
 */
export const calculateWeightedAverage = (
    kardexData: KardexMovement[],
    initialInventory: { cantidad: number; costoTotal: number }
): ProcessedKardexItem[] => {
    const processedData: ProcessedKardexItem[] = [];

    let saldoCantidad = initialInventory.cantidad;
    let saldoCostoTotal = initialInventory.costoTotal;

    kardexData.forEach((movement) => {
        const { serie, numero } = parseComprobante(movement.nComprobante || "");
        const saldoCostoUnitarioActual = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

        if (movement.tipo === "Entrada") {
            // --- LÓGICA DE ENTRADA (PROMEDIO) ---
            const costoTotalEntrada = movement.costoTotal && movement.costoTotal !== 0
                ? movement.costoTotal
                : movement.cantidad * movement.costoUnitario;

            // Nuevo saldo
            saldoCantidad += movement.cantidad;
            saldoCostoTotal += costoTotalEntrada;

            // El nuevo costo unitario promedio es implícitamente costoTotal / cantidad
            const nuevoCostoUnitarioPromedio = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

            // Para uniformidad con PEPS, creamos un "batch" único que representa el saldo total
            const singleBatch: KardexBatch = {
                cantidad: saldoCantidad,
                costoUnitario: nuevoCostoUnitarioPromedio,
                costoTotal: saldoCostoTotal
            };

            processedData.push({
                fecha: movement.fecha,
                type: movement.tComprob || "",
                serie,
                numero,
                operationType: movement.tOperacion || "",
                entrada: {
                    cantidad: movement.cantidad,
                    costoUnitario: movement.costoUnitario,
                    costoTotal: costoTotalEntrada
                },
                salida: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                saldo: {
                    batches: [singleBatch],
                    cantidad: saldoCantidad,
                    costoUnitario: nuevoCostoUnitarioPromedio,
                    costoTotal: saldoCostoTotal
                }
            });

        } else if (movement.tipo === "Salida") {
            // --- LÓGICA DE SALIDA (PROMEDIO) ---
            // La salida se valoriza al costo promedio actual
            const costoTotalSalida = movement.cantidad * saldoCostoUnitarioActual;

            saldoCantidad -= movement.cantidad;
            saldoCostoTotal -= costoTotalSalida;

            // El costo unitario se mantiene (teóricamente), pero recalculamos por si hay decimales residuales
            // En promedio ponderado puro, el costo unitario no cambia en la salida.
            const nuevoCostoUnitarioPromedio = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

            const singleBatch: KardexBatch = {
                cantidad: saldoCantidad,
                costoUnitario: nuevoCostoUnitarioPromedio,
                costoTotal: saldoCostoTotal
            };

            processedData.push({
                fecha: movement.fecha,
                type: movement.tComprob || "",
                serie,
                numero,
                operationType: movement.tOperacion || "",
                entrada: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                salida: {
                    cantidad: movement.cantidad,
                    costoUnitario: saldoCostoUnitarioActual,
                    costoTotal: costoTotalSalida
                },
                saldo: {
                    batches: [singleBatch],
                    cantidad: saldoCantidad,
                    costoUnitario: nuevoCostoUnitarioPromedio,
                    costoTotal: saldoCostoTotal
                }
            });
        }
    });

    return processedData;
}

/**
 * Orquestador principal que selecciona la estrategia de cálculo
 */
export const calculateKardexBalances = (
    kardexData: KardexMovement[],
    initialInventory: { cantidad: number; costoTotal: number },
    method: 'PEPS' | 'promedio' = 'PEPS'
): ProcessedKardexItem[] => {
    // Normalizar entrada por seguridad (backend retorna 'promedio', frontend usa 'PEPS' internamente a veces)
    const normalizedMethod = method.toLowerCase() === 'promedio' ? 'promedio' : 'PEPS';

    if (normalizedMethod === 'promedio') {
        return calculateWeightedAverage(kardexData, initialInventory);
    }
    return calculateFIFO(kardexData, initialInventory);
};

export const calculateTotals = (kardexData: KardexMovement[]): KardexTotals => {
    const totalEntradas = kardexData
        .filter(m => m.tipo === "Entrada")
        .reduce((sum, m) => sum + (m.costoTotal || m.cantidad * m.costoUnitario), 0);

    const totalSalidas = kardexData
        .filter(m => m.tipo === "Salida")
        .reduce((sum, m) => {
            if (m.detallesSalida && m.detallesSalida.length > 0) {
                return sum + m.detallesSalida.reduce((detSum: number, det: KardexDetalleSalida) =>
                    detSum + (det.costoTotalDeLote || det.cantidad * det.costoUnitarioDeLote), 0);
            }
            return sum + (m.costoTotal || m.cantidad * m.costoUnitario);
        }, 0);

    return { entradas: totalEntradas, salidas: totalSalidas };
};

export const calculatePhysicalTotals = (kardexData: KardexMovement[]): KardexTotals => {
    const totalEntradas = kardexData
        .filter(m => m.tipo === "Entrada")
        .reduce((sum, m) => sum + m.cantidad, 0);

    const totalSalidas = kardexData
        .filter(m => m.tipo === "Salida")
        .reduce((sum, m) => {
            if (m.detallesSalida && m.detallesSalida.length > 0) {
                return sum + m.detallesSalida.reduce((detSum: number, det: KardexDetalleSalida) => detSum + det.cantidad, 0);
            }
            return sum + m.cantidad;
        }, 0);

    return { entradas: totalEntradas, salidas: totalSalidas };
}
