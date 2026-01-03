import type { KardexMovement, KardexDetalleSalida } from "../services/types";

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
    };
    saldo: {
        cantidad: number;
        costoUnitario: number;
        costoTotal: number;
    };
}

export interface KardexTotals {
    entradas: number;
    salidas: number;
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
 * Procesa los movimientos del kardex y calcula los saldos línea a línea.
 * Expande las salidas con detalles en múltiples filas.
 */
export const calculateKardexBalances = (
    kardexData: KardexMovement[],
    initialInventory: { cantidad: number; costoTotal: number }
): ProcessedKardexItem[] => {
    const processedData: ProcessedKardexItem[] = [];

    let saldoCantidad = initialInventory.cantidad;
    let saldoCostoTotal = initialInventory.costoTotal;

    kardexData.forEach((movement) => {
        const { serie, numero } = parseComprobante(movement.nComprobante || "");

        if (movement.tipo === "Salida" && movement.detallesSalida && movement.detallesSalida.length > 0) {
            // Para salidas con detalles, crear una fila por cada detalle
            movement.detallesSalida.forEach((detalle: KardexDetalleSalida) => {
                const calculatedDetalleCostoTotal = detalle.costoTotalDeLote && detalle.costoTotalDeLote !== 0
                    ? detalle.costoTotalDeLote
                    : detalle.cantidad * detalle.costoUnitarioDeLote;

                // Actualizar saldo
                saldoCantidad -= detalle.cantidad;
                saldoCostoTotal -= calculatedDetalleCostoTotal;
                const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                processedData.push({
                    fecha: movement.fecha,
                    type: movement.tComprob || "",
                    serie,
                    numero,
                    operationType: movement.tOperacion || "",
                    entrada: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                    salida: {
                        cantidad: detalle.cantidad,
                        costoUnitario: detalle.costoUnitarioDeLote,
                        costoTotal: calculatedDetalleCostoTotal
                    },
                    saldo: {
                        cantidad: saldoCantidad,
                        costoUnitario: saldoCostoUnitario,
                        costoTotal: saldoCostoTotal
                    }
                });
            });
        } else {
            // Para entradas y salidas simples
            const calculatedCostoTotal = movement.costoTotal && movement.costoTotal !== 0
                ? movement.costoTotal
                : movement.cantidad * movement.costoUnitario;

            if (movement.tipo === "Entrada") {
                saldoCantidad += movement.cantidad;
                saldoCostoTotal += calculatedCostoTotal;
                const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                processedData.push({
                    fecha: movement.fecha,
                    type: movement.tComprob || "",
                    serie,
                    numero,
                    operationType: movement.tOperacion || "",
                    entrada: {
                        cantidad: movement.cantidad,
                        costoUnitario: movement.costoUnitario,
                        costoTotal: calculatedCostoTotal
                    },
                    salida: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                    saldo: {
                        cantidad: saldoCantidad,
                        costoUnitario: saldoCostoUnitario,
                        costoTotal: saldoCostoTotal
                    }
                });
            } else {
                saldoCantidad -= movement.cantidad;
                saldoCostoTotal -= calculatedCostoTotal;
                const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                processedData.push({
                    fecha: movement.fecha,
                    type: movement.tComprob || "",
                    serie,
                    numero,
                    operationType: movement.tOperacion || "",
                    entrada: { cantidad: 0, costoUnitario: 0, costoTotal: 0 },
                    salida: {
                        cantidad: movement.cantidad,
                        costoUnitario: movement.costoUnitario, // Should correspond to movement cost
                        costoTotal: calculatedCostoTotal
                    },
                    saldo: {
                        cantidad: saldoCantidad,
                        costoUnitario: saldoCostoUnitario,
                        costoTotal: saldoCostoTotal
                    }
                });
            }
        }
    });

    return processedData;
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
