import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetProductsQuery } from "@/domains/maintainers/api/productApi";
import { useGetWarehousesQuery } from "@/domains/maintainers/api/warehouseApi";
import { useGetInventoryByWarehouseAndProductQuery, useGetKardexMovementsQuery } from "../api/inventoryApi";
import type { KardexMovement } from "../services/types";
import type { MetodoValoracion } from "@/domains/settings/types";
import { ConfigurationService } from "@/domains/settings/services/ConfigurationService";

export const useKardexData = () => {
    const [searchParams] = useSearchParams();
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>(
        new Date().getFullYear().toString()
    );
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Estado del método de valoración
    const [valuationMethod, setValuationMethod] = useState<MetodoValoracion>('promedio');

    // Fetch configuration settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const config = await ConfigurationService.getConfiguration();
                if (config && config.metodoValoracion) {
                    console.log("Fetched valuation method:", config.metodoValoracion);
                    setValuationMethod(config.metodoValoracion);
                }
            } catch (err) {
                console.error("Failed to fetch configuration settings:", err);
            }
        };
        fetchSettings();
    }, []);

    // RTK Query hooks para productos y almacenes
    const { data: products = [] } = useGetProductsQuery();
    const { data: warehouses = [] } = useGetWarehousesQuery();

    // Detectar si es carga directa por inventoryId
    const inventoryIdFromUrl = searchParams.get("inventoryId");
    const isDirectLoad = !!inventoryIdFromUrl;

    const [fetchParams, setFetchParams] = useState<{
        inventoryId: number;
        startDate: string;
        endDate: string;
    } | null>(null);

    // Query para obtener inventario por almacén y producto
    const { data: inventoryItem } = useGetInventoryByWarehouseAndProductQuery(
        { idAlmacen: parseInt(selectedWarehouseId), idProducto: parseInt(selectedProductId) },
        { skip: !selectedWarehouseId || !selectedProductId || isDirectLoad }
    );

    // Calcular fechas
    const { startDate, endDate } = useMemo(() => {
        if (selectedMonth) {
            const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
            return {
                startDate: `${selectedYear}-${selectedMonth}-01`,
                endDate: `${selectedYear}-${selectedMonth}-${daysInMonth.toString().padStart(2, '0')}`
            };
        }
        return {
            startDate: `${selectedYear}-01-01`,
            endDate: `${selectedYear}-12-31`
        };
    }, [selectedYear, selectedMonth]);

    // Determinar el ID de inventario a usar
    const effectiveInventoryId = useMemo(() => {
        if (isDirectLoad && inventoryIdFromUrl) {
            return parseInt(inventoryIdFromUrl);
        }
        if (fetchParams?.inventoryId) {
            return fetchParams.inventoryId;
        }
        return null;
    }, [isDirectLoad, inventoryIdFromUrl, fetchParams]);

    // Query para obtener movimientos de kardex
    const { data: kardexResponse, isLoading: loading, isError } = useGetKardexMovementsQuery(
        {
            idInventario: effectiveInventoryId!,
            fechaInicio: fetchParams?.startDate || startDate,
            fechaFin: fetchParams?.endDate || endDate
        },
        { skip: !effectiveInventoryId }
    );

    // Datos derivados del kardex
    const kardexData = kardexResponse?.movimientos ?? [];

    /**
     * Calcula el costo total de ventas sumando todos los movimientos de salida
     */
    const getCostoVentasTotal = useCallback((movements: KardexMovement[]) => {
        let costoTotal = 0;
        movements.forEach((movement) => {
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
    }, []);

    // Calcular reportes desde la respuesta
    const reportes = useMemo(() => {
        if (!kardexResponse) {
            return {
                cantidadActual: 0,
                costoUnitarioFinal: 0,
                costoTotalFinal: 0,
                costoVentasTotal: 0,
                inventarioInicialCantidad: 0,
                inventarioInicialCostoTotal: 0,
            };
        }

        const saldoActual = parseFloat(kardexResponse.saldoActual);
        const costoFinal = parseFloat(kardexResponse.costoFinal);

        return {
            cantidadActual: saldoActual,
            costoUnitarioFinal: saldoActual === 0 ? 0 : costoFinal / saldoActual,
            costoTotalFinal: costoFinal,
            costoVentasTotal: getCostoVentasTotal(kardexResponse.movimientos),
            inventarioInicialCantidad: parseFloat(kardexResponse.inventarioInicialCantidad),
            inventarioInicialCostoTotal: parseFloat(kardexResponse.inventarioInicialCostoTotal),
        };
    }, [kardexResponse, getCostoVentasTotal]);

    // Función para triggear fetch manual
    const fetchKardex = useCallback(() => {
        if (!selectedProductId || !selectedWarehouseId) {
            setError("Selecciona un producto y un almacén");
            return;
        }

        if (inventoryItem?.id) {
            setFetchParams({
                inventoryId: parseInt(String(inventoryItem.id)),
                startDate,
                endDate
            });
        }
    }, [selectedProductId, selectedWarehouseId, inventoryItem, startDate, endDate]);

    // Efecto para manejar parámetros de URL
    useEffect(() => {
        const productIdFromUrl = searchParams.get("productId");
        const yearFromUrl = searchParams.get("year");

        if (productIdFromUrl) {
            setSelectedProductId(productIdFromUrl);
        }
        if (yearFromUrl) {
            setSelectedYear(yearFromUrl);
        }
    }, [searchParams]);

    // Manejar errores
    useEffect(() => {
        if (isError) {
            setError("Error al cargar los movimientos de kardex");
        } else {
            setError(null);
        }
    }, [isError]);

    // Formato de respuesta compatible con el componente
    const formattedKardexResponse = useMemo((): {
        producto?: string;
        almacen?: string;
        saldoActual: string;
        costoFinal: string;
        inventarioInicialCantidad: string;
        inventarioInicialCostoTotal: string;
        movimientos: KardexMovement[];
    } | null => {
        if (!kardexResponse) return null;
        return {
            producto: kardexResponse.producto,
            almacen: kardexResponse.almacen,
            saldoActual: kardexResponse.saldoActual,
            costoFinal: kardexResponse.costoFinal,
            inventarioInicialCantidad: kardexResponse.inventarioInicialCantidad,
            inventarioInicialCostoTotal: kardexResponse.inventarioInicialCostoTotal,
            movimientos: kardexResponse.movimientos,
        };
    }, [kardexResponse]);

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
        isError,
        kardexResponse: formattedKardexResponse,
        reportes,
        isDirectLoad,
        valuationMethod,
        fetchKardex,
    };
};
