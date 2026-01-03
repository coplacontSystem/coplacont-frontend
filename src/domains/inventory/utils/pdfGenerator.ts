import type { ProcessedKardexItem, KardexTotals } from "./kardexCalculations";
import type { IAuthUser } from "@/domains/auth/types";

interface PDFGeneratorProps {
    processedData: ProcessedKardexItem[];
    companyInfo: IAuthUser["persona"];
    reportInfo: {
        periodo: string;
        almacen: string;
        codigoProducto: string;
        producto: string;
        inventarioInicialCantidad: number;
        inventarioInicialCostoTotal: number;
        year: string;
        metodoValuacion: string;
    };
    totals: KardexTotals;
    physicalTotals: KardexTotals;
}

export const generateKardexPDF = ({
    processedData,
    companyInfo,
    reportInfo,
    totals,
    physicalTotals
}: PDFGeneratorProps) => {
    const costoUnitarioInicial = reportInfo.inventarioInicialCantidad > 0
        ? reportInfo.inventarioInicialCostoTotal / reportInfo.inventarioInicialCantidad
        : 0;

    // Filas del cuerpo para Formato 13.1 (Valorizado)
    const rowsValorizado = processedData.map(item => {
        const batches = item.saldo.batches;
        const hasBatches = batches && batches.length > 0;
        const firstBatch = hasBatches ? batches[0] : null;

        let html = `
    <tr>
      <td>${item.fecha}</td>
      <td>${item.type}</td>
      <td>${item.serie}</td>
      <td>${item.numero}</td>
      <td>${item.operationType}</td>
      
      <td>${item.entrada.cantidad > 0 ? item.entrada.cantidad.toFixed(2) : ""}</td>
      <td>${item.entrada.costoUnitario > 0 ? item.entrada.costoUnitario.toFixed(4) : ""}</td>
      <td>${item.entrada.costoTotal > 0 ? item.entrada.costoTotal.toFixed(2) : ""}</td>
      
      <td>${item.salida.cantidad > 0 ? item.salida.cantidad.toFixed(2) : ""}</td>
      <td>${item.salida.costoUnitario > 0 ? item.salida.costoUnitario.toFixed(4) : ""}</td>
      <td>${item.salida.costoTotal > 0 ? item.salida.costoTotal.toFixed(2) : ""}</td>
      
      <td>${firstBatch ? firstBatch.cantidad.toFixed(2) : "0.00"}</td>
      <td>${firstBatch ? firstBatch.costoUnitario.toFixed(4) : "0.0000"}</td>
      <td>${firstBatch ? firstBatch.costoTotal.toFixed(2) : "0.00"}</td>
    </tr>
  `;

        // Add extra rows for remaining batches
        if (hasBatches && batches.length > 1) {
            for (let i = 1; i < batches.length; i++) {
                const batch = batches[i];
                html += `
        <tr>
          <td></td><td></td><td></td><td></td><td></td>
          <td></td><td></td><td></td>
          <td></td><td></td><td></td>
          <td>${batch.cantidad.toFixed(2)}</td>
          <td>${batch.costoUnitario.toFixed(4)}</td>
          <td>${batch.costoTotal.toFixed(2)}</td>
        </tr>`;
            }
        }
        return html;
    }).join("");

    // Filas del cuerpo para Formato 12.1 (Físico)
    const rowsFisico = processedData.map(item => {
        const batches = item.saldo.batches;
        const hasBatches = batches && batches.length > 0;
        const firstBatch = hasBatches ? batches[0] : null;

        let html = `
    <tr>
      <td>${item.fecha}</td>
      <td>${item.type}</td>
      <td>${item.serie}</td>
      <td>${item.numero}</td>
      <td>${item.operationType}</td>
      
      <td>${item.entrada.cantidad > 0 ? item.entrada.cantidad.toFixed(2) : ""}</td>
      
      <td>${item.salida.cantidad > 0 ? item.salida.cantidad.toFixed(2) : ""}</td>
      
      <td>${firstBatch ? firstBatch.cantidad.toFixed(2) : "0.00"}</td>
    </tr>
  `;

        // Add extra rows for remaining batches
        if (hasBatches && batches.length > 1) {
            for (let i = 1; i < batches.length; i++) {
                const batch = batches[i];
                html += `
        <tr>
          <td></td><td></td><td></td><td></td><td></td>
          <td></td><td></td>
          <td>${batch.cantidad.toFixed(2)}</td>
        </tr>`;
            }
        }
        return html;
    }).join("");


    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kardex Completo - ${reportInfo.producto} - ${reportInfo.almacen} - ${reportInfo.year}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 10px; }
        h1 { text-align: center; margin-bottom: 20px; font-size: 14px; }
        h2 { margin-bottom: 15px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .info { margin-bottom: 15px; }
        .info p { margin: 2px 0; font-size: 9px; }
        .page-break { page-break-before: always; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <!-- FORMATO 13.1 - KARDEX VALORIZADO -->
      <h1>FORMATO 13.1: "REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO"</h1>
      
      <div class="info">
        <p><strong>PERÍODO:</strong> ${reportInfo.periodo}</p>
        <p><strong>RUC:</strong> ${companyInfo.ruc || ""}</p>
        <p><strong>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:</strong> ${companyInfo.nombreEmpresa || ""}</p>
        <p><strong>ESTABLECIMIENTO (1):</strong> ${reportInfo.almacen || ""}</p>
        <p><strong>CÓDIGO DE LA EXISTENCIA:</strong> ${reportInfo.codigoProducto}</p>
        <p><strong>TIPO (TABLA 5):01</strong></p>
        <p><strong>DESCRIPCIÓN:</strong> ${reportInfo.producto || ""}</p>
        <p><strong>CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):01</strong></p>
        <p><strong>MÉTODO DE VALUACIÓN:</strong> ${reportInfo.metodoValuacion}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2">FECHA</th>
            <th colspan="3">DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR</th>
            <th rowspan="2">TIPO DE OPERACIÓN (TABLA 12)</th>
            <th colspan="3">ENTRADAS</th>
            <th colspan="3">SALIDAS</th>
            <th colspan="3">SALDO FINAL</th>
          </tr>
          <tr>
            <th>TIPO (TABLA 10)</th>
            <th>SERIE</th>
            <th>NÚMERO</th>
            <th>CANTIDAD</th>
            <th>COSTO UNITARIO</th>
            <th>COSTO TOTAL</th>
            <th>CANTIDAD</th>
            <th>COSTO UNITARIO</th>
            <th>COSTO TOTAL</th>
            <th>CANTIDAD</th>
            <th>COSTO UNITARIO</th>
            <th>COSTO TOTAL</th>
          </tr>
        </thead>
        <tbody>
           ${reportInfo.inventarioInicialCantidad > 0 ? `
              <tr>
                <td>01/01/${reportInfo.year}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>SALDO INICIAL</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>${reportInfo.inventarioInicialCantidad}</td>
                <td>${costoUnitarioInicial.toFixed(2)}</td>
                <td>${reportInfo.inventarioInicialCostoTotal.toFixed(2)}</td>
              </tr>
          ` : ''}

          ${rowsValorizado}
          
          <tr style="font-weight: bold;">
            <td>TOTALES</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${totals.entradas.toFixed(2)}</td>
            <td></td>
            <td></td>
            <td>${totals.salidas.toFixed(2)}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- FORMATO 12.1 - KARDEX UNIDADES FÍSICAS -->
      <div class="page-break">
        <h1>FORMATO 12.1: "REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS - DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS"</h1>
        
        <div class="info">
          <p><strong>PERÍODO:</strong> ${reportInfo.periodo}</p>
          <p><strong>RUC:</strong> ${companyInfo.ruc || ""}</p>
          <p><strong>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:</strong> ${companyInfo.nombreEmpresa || ""}</p>
          <p><strong>ESTABLECIMIENTO (1):</strong> ${reportInfo.almacen || ""}</p>
          <p><strong>CÓDIGO DE LA EXISTENCIA:</strong> ${reportInfo.codigoProducto}</p>
          <p><strong>TIPO (TABLA 5):</strong>01</p>
          <p><strong>DESCRIPCIÓN:</strong> ${reportInfo.producto || ""}</p>
          <p><strong>CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):01</strong></p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th rowspan="2">FECHA</th>
              <th colspan="3">DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR</th>
              <th rowspan="2">TIPO DE OPERACIÓN (TABLA 12)</th>
              <th rowspan="2">ENTRADAS</th>
              <th rowspan="2">SALIDAS</th>
              <th rowspan="2">SALDO FINAL</th>
            </tr>
            <tr>
              <th>TIPO (TABLA 10)</th>
              <th>SERIE</th>
              <th>NÚMERO</th>
            </tr>
          </thead>
          <tbody>
             ${reportInfo.inventarioInicialCantidad > 0 ? `
                <tr>
                  <td>01/01/${reportInfo.year}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>SALDO INICIAL</td>
                  <td></td>
                  <td></td>
                  <td>${reportInfo.inventarioInicialCantidad}</td>
                </tr>
            ` : ''}

            ${rowsFisico}

            <tr style="font-weight: bold;">
              <td>TOTALES</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>${physicalTotals.entradas.toFixed(2)}</td>
              <td>${physicalTotals.salidas.toFixed(2)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

    // Abrir nueva ventana e imprimir
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
};
