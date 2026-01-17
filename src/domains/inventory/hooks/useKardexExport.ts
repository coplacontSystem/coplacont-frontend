import { useCallback } from "react";
import type { KardexMovement } from "../services/types";
import type { Product } from "@/domains/maintainers/types";
import type { IAuthUser } from "@/domains/auth/types";
import type { MetodoValoracion } from "@/domains/settings/types";
import { calculateKardexBalances, calculateTotals, calculatePhysicalTotals } from "../utils/kardexCalculations";
import { generateKardexExcel } from "../utils/excelGenerator";
import { generateKardexPDF } from "../utils/pdfGenerator";

interface UseKardexExportProps {
    kardexData: KardexMovement[];
    kardexResponse: {
        producto?: string;
        almacen?: string;
        inventarioInicialCantidad: string;
        inventarioInicialCostoTotal: string;
    } | null;
    user: IAuthUser | null;
    selectedYear: string;
    selectedMonth: string;
    products: Product[];
    selectedProductId: string;
    reportes: {
        inventarioInicialCantidad: number;
        inventarioInicialCostoTotal: number;
    };
    valuationMethod: MetodoValoracion;
}

export const useKardexExport = ({
    kardexData,
    kardexResponse,
    user,
    selectedYear,
    selectedMonth,
    products,
    selectedProductId,
    reportes,
    valuationMethod
}: UseKardexExportProps) => {

    // DEBUG: Check what we receive
    console.log("useKardexExport valuationMethod:", valuationMethod);
    console.log("useKardexExport type:", typeof valuationMethod);


    const getCommonData = useCallback(() => {
        if (!kardexResponse || !kardexData.length || !user?.persona) {
            return null;
        }

        const empresa = user.persona;
        const periodo = selectedMonth
            ? `${selectedMonth.toUpperCase()} ${selectedYear}`
            : selectedYear;

        const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
        const codigoProducto = selectedProduct?.codigo || "001";

        const methodStr = (valuationMethod as string).toLowerCase();
        const isFifo = methodStr === 'fifo' || methodStr === 'peps' || methodStr.includes('peps');

        const processedData = calculateKardexBalances(kardexData, {
            cantidad: reportes.inventarioInicialCantidad,
            costoTotal: reportes.inventarioInicialCostoTotal
        }, isFifo ? 'PEPS' : 'promedio');

        const totals = calculateTotals(kardexData);
        const physicalTotals = calculatePhysicalTotals(kardexData);

        const methodLabel = isFifo ? 'PEPS' : 'PROMEDIO';

        return {
            processedData,
            companyInfo: empresa,
            totals,
            physicalTotals,
            reportInfo: {
                periodo,
                almacen: `${kardexResponse.almacen}`,
                codigoProducto,
                producto: kardexResponse.producto || "",
                inventarioInicialCantidad: reportes.inventarioInicialCantidad,
                inventarioInicialCostoTotal: reportes.inventarioInicialCostoTotal,
                year: selectedYear,
                metodoValuacion: methodLabel
            },
            filename: `kardex_completo_${(kardexResponse.producto || "producto").replace(/\s+/g, "_")}_${(kardexResponse.almacen || "almacen").replace(/\s+/g, "_")}_${selectedYear}${selectedMonth ? `_${selectedMonth}` : ""}.xlsx`
        };
    }, [kardexData, kardexResponse, user, selectedYear, selectedMonth, products, selectedProductId, reportes, valuationMethod]);


    /**
     * Exporta los datos del kardex a Excel (.xlsx) según el formato FORMATO 13.1 y 12.1
     */
    const handleExportToExcel = useCallback(() => {
        const data = getCommonData();
        if (!data) return;

        generateKardexExcel({
            processedData: data.processedData,
            companyInfo: data.companyInfo,
            reportInfo: data.reportInfo,
            totals: data.totals,
            physicalTotals: data.physicalTotals,
            filename: data.filename
        });
    }, [getCommonData]);

    /**
     * Exporta los datos del kardex a PDF con ambos formatos (valorizado y simplificado)
     */
    const handleExportToPDF = useCallback(() => {
        const data = getCommonData();
        if (!data) return;

        generateKardexPDF({
            processedData: data.processedData,
            companyInfo: data.companyInfo,
            reportInfo: data.reportInfo,
            totals: data.totals,
            physicalTotals: data.physicalTotals
        });
    }, [getCommonData]);

    return {
        handleExportToExcel,
        handleExportToPDF,
    };
};
