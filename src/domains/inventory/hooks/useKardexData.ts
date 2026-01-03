import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { InventoryService } from "@/domains/inventory/services/InventoryService";
import { ProductService } from "@/domains/maintainers/services";
import { WarehouseService } from "@/domains/maintainers/services";
import type { KardexMovement } from "@/domains/inventory/services/types";
import type { Product, Warehouse } from "@/domains/maintainers/types";

export const useKardexData = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>(
        new Date().getFullYear().toString()
    );
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [kardexData, setKardexData] = useState<KardexMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [kardexResponse, setKardexResponse] = useState<{
        producto?: string;
        almacen?: string;
        saldoActual: string;
        costoFinal: string;
        inventarioInicialCantidad: string;
        inventarioInicialCostoTotal: string;
        movimientos: KardexMovement[];
    } | null>(null);

    const [reportes, setReportes] = useState({
        cantidadActual: 0,
        costoUnitarioFinal: 0,
        costoTotalFinal: 0,
        costoVentasTotal: 0,
        inventarioInicialCantidad: 0,
        inventarioInicialCostoTotal: 0,
    });

    /**
     * Calcula el costo total de ventas sumando todos los movimientos de salida
     * Considera los detalles de salida cuando están disponibles
     */
    const getCostoVentasTotal = (kardexData: KardexMovement[]) => {
        let costoTotal = 0;
        kardexData.forEach((movement) => {
            if (movement.tipo === "Salida") {
                if (movement.detallesSalida && movement.detallesSalida.length > 0) {
                    movement.detallesSalida.forEach((detalle) => {
                        const calculatedDetalleCostoTotal =
                            detalle.costoTotalDeLote && detalle.costoTotalDeLote !== 0
                                ? detalle.costoTotalDeLote
                                : detalle.cantidad * detalle.costoUnitarioDeLote;
                        costoTotal += calculatedDetalleCostoTotal;
                    });
                } else {
                    const calculatedCostoTotal =
                        movement.costoTotal && movement.costoTotal !== 0
                            ? movement.costoTotal
                            : movement.cantidad * movement.costoUnitario;
                    costoTotal += calculatedCostoTotal;
                }
            }
        });
        return costoTotal;
    };

    /**
     * Carga el kardex directamente usando un ID de inventario
     */
    const fetchKardexByInventoryId = useCallback(async (inventoryId: number) => {
        try {
            setLoading(true);
            setError("");

            const response = await InventoryService.getKardexMovements(
                inventoryId,
                `${selectedYear}-01-01`,
                `${selectedYear}-12-31`
            );

            setKardexData(response.movimientos);
            setKardexResponse(response);
            setReportes({
                cantidadActual: parseFloat(response.saldoActual),
                costoUnitarioFinal:
                    parseFloat(response.saldoActual) === 0
                        ? 0
                        : parseFloat(response.costoFinal) /
                        parseFloat(response.saldoActual),
                costoTotalFinal: parseFloat(response.costoFinal),
                costoVentasTotal: getCostoVentasTotal(response.movimientos),
                inventarioInicialCantidad: parseFloat(
                    response.inventarioInicialCantidad
                ),
                inventarioInicialCostoTotal: parseFloat(
                    response.inventarioInicialCostoTotal
                ),
            });
        } catch (error) {
            console.error("Error fetching kardex by inventory ID:", error);
            setError("Error al cargar los movimientos de kardex");
            setKardexData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    // Cargar productos y almacenes al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Verificar si hay un inventoryId en la URL para carga directa
                const inventoryIdFromUrl = searchParams.get("inventoryId");

                if (inventoryIdFromUrl) {
                    // Si hay inventoryId, cargar directamente el kardex
                    await fetchKardexByInventoryId(parseInt(inventoryIdFromUrl));
                } else {
                    // Flujo normal: cargar productos y almacenes
                    const productsResponse = await ProductService.getAll();
                    setProducts(productsResponse);

                    const warehousesResponse = await WarehouseService.getAll();
                    setWarehouses(warehousesResponse);

                    // Si hay parámetros en la URL, seleccionarlos automáticamente
                    const productIdFromUrl = searchParams.get("productId");
                    const yearFromUrl = searchParams.get("year");
                    if (productIdFromUrl) {
                        setSelectedProductId(productIdFromUrl);
                    }
                    if (yearFromUrl) {
                        setSelectedYear(yearFromUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Error al cargar los datos");
            }
        };

        fetchData();
    }, [searchParams, fetchKardexByInventoryId]);

    // Cargar movimientos de kardex cuando se seleccionen producto y almacén
    useEffect(() => {
        const fetchKardexMovements = async () => {
            // Solo cargar si ambos están seleccionados
            if (!selectedProductId || !selectedWarehouseId) {
                setKardexData([]);
                setReportes({
                    cantidadActual: 0,
                    costoUnitarioFinal: 0,
                    costoTotalFinal: 0,
                    costoVentasTotal: 0,
                    inventarioInicialCantidad: 0,
                    inventarioInicialCostoTotal: 0,
                });
                return;
            }

            try {
                setLoading(true);
                setError("");
                const inventario =
                    await InventoryService.getInventoryByWarehouseAndProduct(
                        parseInt(selectedWarehouseId),
                        parseInt(selectedProductId)
                    );

                // Calcular fechas de inicio y fin basadas en el año y mes seleccionados
                let startDate: string;
                let endDate: string;

                if (selectedMonth) {
                    // Si hay un mes seleccionado, usar solo ese mes
                    const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
                    startDate = `${selectedYear}-${selectedMonth}-01`;
                    endDate = `${selectedYear}-${selectedMonth}-${daysInMonth.toString().padStart(2, '0')}`;
                } else {
                    // Si no hay mes seleccionado, usar todo el año
                    startDate = `${selectedYear}-01-01`;
                    endDate = `${selectedYear}-12-31`;
                }

                const response = await InventoryService.getKardexMovements(
                    parseInt(inventario.id),
                    startDate,
                    endDate
                );
                setKardexData(response.movimientos);
                setKardexResponse(response);
                setReportes({
                    cantidadActual: parseFloat(response.saldoActual),
                    costoUnitarioFinal:
                        parseFloat(response.saldoActual) === 0
                            ? 0
                            : parseFloat(response.costoFinal) /
                            parseFloat(response.saldoActual),
                    costoTotalFinal: parseFloat(response.costoFinal),
                    costoVentasTotal: getCostoVentasTotal(response.movimientos),
                    inventarioInicialCantidad: parseFloat(
                        response.inventarioInicialCantidad
                    ),
                    inventarioInicialCostoTotal: parseFloat(
                        response.inventarioInicialCostoTotal
                    ),
                });
            } catch (error) {
                console.error("Error fetching kardex movements:", error);
                setError("Error al cargar los movimientos de kardex");
                setKardexData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchKardexMovements();
    }, [selectedProductId, selectedWarehouseId, selectedYear, selectedMonth]);

    // Efecto para recargar kardex cuando cambia el año en modo directo
    useEffect(() => {
        const inventoryIdFromUrl = searchParams.get("inventoryId");
        if (inventoryIdFromUrl) {
            fetchKardexByInventoryId(parseInt(inventoryIdFromUrl));
        }
    }, [selectedYear, searchParams, fetchKardexByInventoryId]);

    return {
        products,
        warehouses,
        selectedProductId,
        setSelectedProductId,
        selectedWarehouseId,
        setSelectedWarehouseId,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        kardexData,
        loading,
        error,
        kardexResponse,
        reportes,
        isDirectLoad: !!searchParams.get("inventoryId")
    };
};
