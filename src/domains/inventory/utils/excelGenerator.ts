import * as XLSX from "xlsx";
import type { ProcessedKardexItem, KardexTotals } from "./kardexCalculations";
import type { IAuthUser } from "@/domains/auth/types";

interface ExcelGeneratorProps {
    processedData: ProcessedKardexItem[];
    companyInfo: IAuthUser["persona"];
    reportInfo: {
        periodo: string;
        almacen: string;
        codigoProducto: string;
        producto: string;
        inventarioInicialCantidad: number;
        inventarioInicialCostoTotal: number;
    };
    totals: KardexTotals;
    physicalTotals: KardexTotals;
    filename: string;
}

export const generateKardexExcel = ({
    processedData,
    companyInfo,
    reportInfo,
    totals,
    physicalTotals,
    filename
}: ExcelGeneratorProps) => {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // ========== FORMATO 13.1 (VALORIZADO) ==========
    const reportData = [
        // Título del formato
        ["FORMATO 13.1: \"REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO\""],
        [],
        // Información de cabecera
        ["PERIODO:", "", "", "", reportInfo.periodo],
        ["RUC:", "", "", "", companyInfo.ruc],
        ["APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:", "", "", "", companyInfo.razonSocial || companyInfo.nombreEmpresa],
        ["ESTABLECIMIENTO (1):", "", "", "", reportInfo.almacen],
        ["CÓDIGO DE LA EXISTENCIA:", "", "", "", reportInfo.codigoProducto],
        ["TIPO (TABLA 5):", "", "", "", "01"],
        ["DESCRIPCIÓN:", "", "", "", reportInfo.producto],
        ["CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):", "", "", "", "01"],
        ["MÉTODO DE VALUACIÓN:", "", "", "", "PEPS"],
        [],
        // Encabezados de la tabla
        [
            "DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR",
            "",
            "",
            "",
            "TIPO DE OPERACIÓN (TABLA 12)",
            "ENTRADAS",
            "",
            "",
            "SALIDAS",
            "",
            "",
            "SALDO FINAL",
            "",
            ""
        ],
        [
            "FECHA",
            "TIPO (TABLA 10)",
            "SERIE",
            "NÚMERO",
            "",
            "CANTIDAD",
            "COSTO UNITARIO",
            "COSTO TOTAL",
            "CANTIDAD",
            "COSTO UNITARIO",
            "COSTO TOTAL",
            "CANTIDAD",
            "COSTO UNITARIO",
            "COSTO TOTAL"
        ]
    ];

    // Calcular saldo inicial para mostrar
    const saldoCantidad = reportInfo.inventarioInicialCantidad;
    const saldoCostoTotal = reportInfo.inventarioInicialCostoTotal;
    const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

    if (saldoCantidad > 0) {
        reportData.push([
            "-",
            "",
            "-",
            "-",
            "-",
            "", // Entrada cantidad
            "", // Entrada costo unitario
            "", // Entrada costo total
            "", // Salida cantidad
            "", // Salida costo unitario
            "", // Salida costo total
            saldoCantidad.toFixed(2),
            saldoCostoUnitario.toFixed(4),
            saldoCostoTotal.toFixed(2)
        ]);
    }

    // Llenar datos procesados
    processedData.forEach((item) => {
        reportData.push([
            item.fecha,
            item.type,
            item.serie,
            item.numero,
            item.operationType,
            item.entrada.cantidad > 0 ? item.entrada.cantidad.toFixed(2) : "",
            item.entrada.costoUnitario > 0 ? item.entrada.costoUnitario.toFixed(4) : "",
            item.entrada.costoTotal > 0 ? item.entrada.costoTotal.toFixed(2) : "",
            item.salida.cantidad > 0 ? item.salida.cantidad.toFixed(2) : "",
            item.salida.costoUnitario > 0 ? item.salida.costoUnitario.toFixed(4) : "",
            item.salida.costoTotal > 0 ? item.salida.costoTotal.toFixed(2) : "",
            item.saldo.cantidad.toFixed(2),
            item.saldo.costoUnitario.toFixed(4),
            item.saldo.costoTotal.toFixed(2)
        ]);
    });

    // Agregar fila de totales
    reportData.push([
        "",
        "",
        "",
        "",
        "TOTALES",
        "",
        "",
        totals.entradas.toFixed(2),
        "",
        "",
        totals.salidas.toFixed(2),
        "",
        "",
        ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);

    // Configurar anchos de columna
    worksheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];

    // Configurar merges
    worksheet['!merges'] = [
        { s: { r: 12, c: 5 }, e: { r: 12, c: 7 } }, // ENTRADAS header
        { s: { r: 12, c: 8 }, e: { r: 12, c: 10 } }, // SALIDAS header
        { s: { r: 12, c: 11 }, e: { r: 12, c: 13 } } // SALDO FINAL header
    ];

    // Aplicar bordes
    applyThickBorders(worksheet, reportData.length, 5, 7);
    applyThickBorders(worksheet, reportData.length, 8, 10);
    applyThickBorders(worksheet, reportData.length, 11, 13);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex Valorizado");

    // ========== FORMATO 12.1 (FÍSICO) ==========
    const physicalReportData = [
        ["FORMATO 12.1: \"REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS- DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS\""],
        [],
        ["PERIODO:", "", "", "", "", "", reportInfo.periodo],
        ["RUC:", "", "", "", "", "", companyInfo.ruc],
        ["APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:", "", "", "", "", "", companyInfo.razonSocial || companyInfo.nombreEmpresa],
        ["ESTABLECIMIENTO (1):", "", "", "", "", "", reportInfo.almacen],
        ["CÓDIGO DE LA EXISTENCIA:", "", "", "", "", "", reportInfo.codigoProducto],
        ["TIPO (TABLA 5):", "", "", "", "", "", "01"],
        ["DESCRIPCIÓN:", "", "", "", "", "", reportInfo.producto],
        ["CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):", "", "", "", "", "", "01"],
        [],
        [
            "DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR",
            "",
            "",
            "",
            "TIPO DE OPERACIÓN (TABLA 12)",
            "ENTRADAS",
            "SALIDAS",
            "SALDO FINAL"
        ],
        [
            "FECHA",
            "TIPO (TABLA 10)",
            "SERIE",
            "NÚMERO",
            "",
            "",
            "",
            ""
        ]
    ];

    if (saldoCantidad > 0) {
        physicalReportData.push([
            "-",
            "",
            "-",
            "-",
            "-",
            "",
            "",
            saldoCantidad.toFixed(2)
        ]);
    }

    // Recalcular saldo físico para formato 12.1 (si fuera distinto, aqui es igual logicamente)
    // Pero processedData ya tiene el saldo linea a linea. Reutilizamos el saldo calculado.
    // IMPORTANTE: processedData tiene el saldo valorizado. Para el simplificado, solo necesitamos cantidad.
    // El saldoCantidad en processedData es correcto para ambos.

    processedData.forEach((item) => {
        physicalReportData.push([
            item.fecha,
            item.type,
            item.serie,
            item.numero,
            item.operationType,
            item.entrada.cantidad > 0 ? item.entrada.cantidad.toFixed(2) : "",
            item.salida.cantidad > 0 ? item.salida.cantidad.toFixed(2) : "",
            item.saldo.cantidad.toFixed(2)
        ]);
    });

    physicalReportData.push([
        "",
        "",
        "",
        "",
        "TOTALES",
        physicalTotals.entradas.toFixed(2),
        physicalTotals.salidas.toFixed(2),
        ""
    ]);

    const physWorksheet = XLSX.utils.aoa_to_sheet(physicalReportData);

    physWorksheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    physWorksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }
    ];

    // Bordes simples para la tabla fisica
    applySimpleBorders(physWorksheet, physicalReportData.length, 0, 7);

    XLSX.utils.book_append_sheet(workbook, physWorksheet, "Kardex Unidades Físicas");

    XLSX.writeFile(workbook, filename);
};

// Start row for headers (0-indexed)
const HEADER_ROW_START = 13;

function applyThickBorders(worksheet: XLSX.WorkSheet, totalRows: number, startCol: number, endCol: number) {
    const endRow = totalRows - 1;
    const startRow = HEADER_ROW_START;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
            if (!worksheet[cellRef].s.border) worksheet[cellRef].s.border = {};

            const border = worksheet[cellRef].s.border;

            // Bordes exteriores gruesos
            if (col === startCol) border.left = { style: "thick", color: { rgb: "000000" } };
            if (col === endCol) border.right = { style: "thick", color: { rgb: "000000" } };
            if (row === startRow) border.top = { style: "thick", color: { rgb: "000000" } };
            if (row === endRow) border.bottom = { style: "thick", color: { rgb: "000000" } };

            // Bordes interiores finos
            if (col > startCol && col < endCol) {
                border.left = { style: "thin" };
                border.right = { style: "thin" };
            }
            if (row > startRow && row < endRow) {
                border.top = { style: "thin" };
                border.bottom = { style: "thin" };
            }
        }
    }
}

function applySimpleBorders(worksheet: XLSX.WorkSheet, totalRows: number, startCol: number, endCol: number) {
    const endRow = totalRows - 1;
    const startRow = 12; // Start for simplified report

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
            if (!worksheet[cellRef].s.border) worksheet[cellRef].s.border = {};

            const border = worksheet[cellRef].s.border;

            if (col === 0) border.left = { style: "thick", color: { rgb: "000000" } };
            if (col === 7) border.right = { style: "thick", color: { rgb: "000000" } };
            if (row === startRow) border.top = { style: "thick", color: { rgb: "000000" } };
            if (row === endRow) border.bottom = { style: "thick", color: { rgb: "000000" } };

            if (col > 0 && col < 7) {
                border.left = { style: "thin" };
                border.right = { style: "thin" };
            }
            if (row > startRow && row < endRow) {
                border.top = { style: "thin" };
                border.bottom = { style: "thin" };
            }
        }
    }
}
