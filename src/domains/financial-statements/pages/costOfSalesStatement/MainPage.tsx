import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./MainPage.module.scss";
import {
 PageLayout,
 Table,
 ComboBox,
 Text,
 Divider,
 Button,
} from "@/components";
import { CostOfSalesStatementService } from "../../services/CostOfSalesStatement";
import { useGetProductsQuery } from "@/domains/maintainers/api/productApi/api";
import { useGetWarehousesQuery } from "@/domains/maintainers/api/warehouseApi/api";
import type { CostOfSalesStatement } from "../../services/CostOfSalesStatement";
import { downloadFile } from "@/shared/utils/downloadUtils";
import * as XLSX from "xlsx";

export const MainPage: React.FC = () => {
 const [searchParams] = useSearchParams();
 // RTK Query hooks
 const { data: products = [] } = useGetProductsQuery();
 const { data: warehouses = [] } = useGetWarehousesQuery();

 // Cargar parámetros de URL al montar
 const [selectedProductId, setSelectedProductId] = useState<string>("");
 const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
 const [selectedYear, setSelectedYear] = useState<string>(
  new Date().getFullYear().toString(),
 );
 const [costOfSalesData, setCostOfSalesData] =
  useState<CostOfSalesStatement | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string>("");

 useEffect(() => {
  const productIdFromUrl = searchParams.get("productId");
  const warehouseIdFromUrl = searchParams.get("warehouseId");
  const yearFromUrl = searchParams.get("year");

  if (productIdFromUrl) {
   setSelectedProductId(productIdFromUrl);
  }
  if (warehouseIdFromUrl) {
   setSelectedWarehouseId(warehouseIdFromUrl);
  }
  if (yearFromUrl) {
   setSelectedYear(yearFromUrl);
  }
 }, [searchParams]);

 /**
  * Carga el reporte de costo de ventas
  */
 const fetchCostOfSalesStatement = async () => {
  if (!selectedYear) {
   setError("Debe seleccionar al menos un año");
   return;
  }

  try {
   setLoading(true);
   setError("");

   const requestParams: import("../../api/financialStatementsApi").CostOfSalesParams =
    {
     año: parseInt(selectedYear, 10),
     idAlmacen: selectedWarehouseId ? parseInt(selectedWarehouseId, 10) : 0,
     idProducto: selectedProductId ? parseInt(selectedProductId, 10) : 0,
    };

   const response =
    await CostOfSalesStatementService.getCostOfSalesStatement(requestParams);

   setCostOfSalesData(response);
   console.log("Cost of sales data:", response);
  } catch (error) {
   console.error("Error fetching cost of sales statement:", error);
   setError("Error al cargar el reporte de costo de ventas");
   setCostOfSalesData(null);
  } finally {
   setLoading(false);
  }
 };

 /**
  * Maneja la generación del reporte al presionar el botón
  */
 const handleGenerateReport = () => {
  fetchCostOfSalesStatement();
 };

 // Opciones para el ComboBox de productos
 const productOptions = [
  { label: "Seleccionar producto", value: "" },
  ...products.map((product) => ({
   label: `${product.codigo} - ${product.nombre}`,
   value: product.id.toString(),
  })),
 ];

 // Opciones para el ComboBox de almacenes
 const warehouseOptions = [
  { label: "Seleccionar almacén", value: "" },
  ...warehouses.map((warehouse) => ({
   label: `${warehouse.id} - ${warehouse.nombre}`,
   value: warehouse.id.toString(),
  })),
 ];

 // Generar opciones de años (últimos 10 años)
 const currentYear = new Date().getFullYear();
 const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const year = currentYear - i;
  return {
   label: year.toString(),
   value: year.toString(),
  };
 });

 // Headers para la tabla de totales
 const summaryHeaders = [
  "Total Compras Anual",
  "Total Salidas Anual",
  "Inventario Final Anual",
 ];

 // Rows para la tabla de totales
 const summaryRows = costOfSalesData
  ? [
     {
      id: "summary-row",
      cells: [
       `S/ ${costOfSalesData.sumatorias.totalComprasAnual}`,
       `S/ ${costOfSalesData.sumatorias.totalSalidasAnual}`,
       `S/ ${costOfSalesData.sumatorias.inventarioFinalAnual}`,
      ],
     },
    ]
  : [];

 // Headers para la tabla de datos mensuales
 const monthlyHeaders = [
  "Mes",
  "Compras Totales",
  "Salidas Totales",
  "Inventario Final",
 ];

 // Rows para la tabla de datos mensuales
 const monthlyRows = costOfSalesData
  ? costOfSalesData.datosMensuales.map((dato, index) => ({
     id: index.toString(),
     cells: [
      dato.nombreMes,
      `S/ ${dato.comprasTotales}`,
      `S/ ${dato.salidasTotales}`,
      `S/ ${dato.inventarioFinal}`,
     ],
    }))
  : [];

 const summaryGridTemplate = "1fr 1fr 1fr";
 const monthlyGridTemplate = "1fr 1fr 1fr 1fr";

 /**
  * Exporta los datos del estado de costo de ventas a CSV
  */
 const handleExportToCSV = () => {
  if (!costOfSalesData) {
   return;
  }

  // Crear contenido CSV
  const csvContent = generateCostOfSalesCSV(costOfSalesData);

  // Agregar BOM para UTF-8 para mejor compatibilidad con Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
   type: "text/csv;charset=utf-8;",
  });

  // Generar nombre del archivo
  const producto = costOfSalesData.producto || "producto";
  const almacen = costOfSalesData.almacen || "almacen";
  const filename = `estado_costo_ventas_${producto.replace(/\s+/g, "_")}_${almacen.replace(/\s+/g, "_")}_${costOfSalesData.año}.csv`;

  downloadFile(blob, filename);
 };

 /**
  * Exporta los datos del estado de costo de ventas a Excel (.xlsx)
  */
 const handleExportToExcel = () => {
  if (!costOfSalesData) {
   return;
  }

  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Crear hoja de resumen
  const summaryData = [
   ["ESTADO DE COSTO DE VENTAS"],
   [],
   ["Producto:", costOfSalesData.producto],
   ["Almacén:", costOfSalesData.almacen],
   ["Año:", costOfSalesData.año],
   [
    "Fecha de Generación:",
    new Date(costOfSalesData.fechaGeneracion).toLocaleDateString(),
   ],
   [],
   ["RESUMEN ANUAL"],
   ["Total Compras Anual", "Total Salidas Anual", "Inventario Final Anual"],
   [
    `S/ ${costOfSalesData.sumatorias.totalComprasAnual}`,
    `S/ ${costOfSalesData.sumatorias.totalSalidasAnual}`,
    `S/ ${costOfSalesData.sumatorias.inventarioFinalAnual}`,
   ],
  ];

  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumen");

  // Crear hoja de datos mensuales
  const monthlyData = [
   ["DATOS MENSUALES"],
   [],
   ["Mes", "Compras Totales", "Salidas Totales", "Inventario Final"],
   ...costOfSalesData.datosMensuales.map((dato) => [
    dato.nombreMes,
    `S/ ${dato.comprasTotales}`,
    `S/ ${dato.salidasTotales}`,
    `S/ ${dato.inventarioFinal}`,
   ]),
  ];

  const monthlyWorksheet = XLSX.utils.aoa_to_sheet(monthlyData);
  XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, "Datos Mensuales");

  // Generar nombre del archivo
  const producto = costOfSalesData.producto || "producto";
  const almacen = costOfSalesData.almacen || "almacen";
  const filename = `estado_costo_ventas_${producto.replace(/\s+/g, "_")}_${almacen.replace(/\s+/g, "_")}_${costOfSalesData.año}.xlsx`;

  // Escribir el archivo
  XLSX.writeFile(workbook, filename);
 };

 /**
  * Exporta los datos del estado de costo de ventas a PDF (usando ventana de impresión)
  */
 const handleExportToPDF = () => {
  if (!costOfSalesData) {
   return;
  }

  // Crear contenido HTML para imprimir
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Estado de Costo de Ventas - ${costOfSalesData.producto} - ${costOfSalesData.almacen} - ${costOfSalesData.año}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          h2 { margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .info { margin-bottom: 20px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>ESTADO DE COSTO DE VENTAS</h1>
        
        <div class="info">
          <p><strong>Producto:</strong> ${costOfSalesData.producto}</p>
          <p><strong>Almacén:</strong> ${costOfSalesData.almacen}</p>
          <p><strong>Año:</strong> ${costOfSalesData.año}</p>
          <p><strong>Fecha de Generación:</strong> ${new Date(costOfSalesData.fechaGeneracion).toLocaleDateString()}</p>
        </div>
        
        <h2>RESUMEN ANUAL</h2>
        <table>
          <thead>
            <tr>
              <th>Total Compras Anual</th>
              <th>Total Salidas Anual</th>
              <th>Inventario Final Anual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S/ ${costOfSalesData.sumatorias.totalComprasAnual}</td>
              <td>S/ ${costOfSalesData.sumatorias.totalSalidasAnual}</td>
              <td>S/ ${costOfSalesData.sumatorias.inventarioFinalAnual}</td>
            </tr>
          </tbody>
        </table>
        
        <h2>DATOS MENSUALES</h2>
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th>Compras Totales</th>
              <th>Salidas Totales</th>
              <th>Inventario Final</th>
            </tr>
          </thead>
          <tbody>
            ${costOfSalesData.datosMensuales
             .map(
              (dato) => `
              <tr>
                <td>${dato.nombreMes}</td>
                <td>S/ ${dato.comprasTotales}</td>
                <td>S/ ${dato.salidasTotales}</td>
                <td>S/ ${dato.inventarioFinal}</td>
              </tr>
            `,
             )
             .join("")}
          </tbody>
        </table>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir / Guardar como PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Cerrar</button>
        </div>
      </body>
      </html>
    `;

  // Abrir nueva ventana con el contenido
  const printWindow = window.open("", "_blank");
  if (printWindow) {
   printWindow.document.write(htmlContent);
   printWindow.document.close();
   printWindow.focus();
  } else {
   alert("Por favor, permite las ventanas emergentes para generar el PDF");
  }
 };

 /**
  * Genera el contenido CSV para el estado de costo de ventas
  */
 const generateCostOfSalesCSV = (data: CostOfSalesStatement): string => {
  const lines: string[] = [];

  // Información del reporte
  lines.push("ESTADO DE COSTO DE VENTAS");
  lines.push("");
  lines.push(`Producto:,${data.producto}`);
  lines.push(`Almacén:,${data.almacen}`);
  lines.push(`Año:,${data.año}`);
  lines.push(
   `Fecha de Generación:,${new Date(data.fechaGeneracion).toLocaleDateString()}`,
  );
  lines.push("");

  // Resumen anual
  lines.push("RESUMEN ANUAL");
  lines.push("Total Compras Anual,Total Salidas Anual,Inventario Final Anual");
  lines.push(
   `S/ ${data.sumatorias.totalComprasAnual},S/ ${data.sumatorias.totalSalidasAnual},S/ ${data.sumatorias.inventarioFinalAnual}`,
  );
  lines.push("");

  // Datos mensuales
  lines.push("DATOS MENSUALES");
  lines.push("Mes,Compras Totales,Salidas Totales,Inventario Final");

  data.datosMensuales.forEach((dato) => {
   lines.push(
    `${dato.nombreMes},S/ ${dato.comprasTotales},S/ ${dato.salidasTotales},S/ ${dato.inventarioFinal}`,
   );
  });

  return lines.join("\n");
 };

 return (
  <PageLayout
   title="Estado de Costo de Ventas"
   subtitle="Reporte detallado del costo de ventas por producto, almacén y año."
  >
   <section className={styles.MainPage}>
    <div className={styles.MainPage__FilterContainer}>
     <div className={styles.MainPage__Filter}>
      <Text size="xs" color="neutral-primary">
       Año
      </Text>
      <ComboBox
       options={yearOptions}
       size="xs"
       variant="createSale"
       value={selectedYear}
       onChange={(v) => setSelectedYear(v as string)}
       placeholder="Seleccionar año"
      />
     </div>
     <div className={styles.MainPage__Filter}>
      <Text size="xs" color="neutral-primary">
       Almacén (Opcional)
      </Text>
      <ComboBox
       options={warehouseOptions}
       size="xs"
       variant="createSale"
       value={selectedWarehouseId}
       onChange={(v) => setSelectedWarehouseId(v as string)}
       placeholder="Seleccionar almacén"
      />
     </div>
     <div className={styles.MainPage__Filter}>
      <Text size="xs" color="neutral-primary">
       Producto (Opcional)
      </Text>
      <ComboBox
       options={productOptions}
       size="xs"
       variant="createSale"
       value={selectedProductId}
       onChange={(v) => setSelectedProductId(v as string)}
       placeholder="Seleccionar producto"
      />
     </div>
     <Button
      size="small"
      variant="primary"
      onClick={handleGenerateReport}
      disabled={!selectedYear}
     >
      Generar Reporte
     </Button>
    </div>

    {error && (
     <div className={styles.MainPage__Error}>
      <Text size="xs" color="danger">
       {error}
      </Text>
     </div>
    )}

    <Divider />

    {costOfSalesData && (
     <div className={styles.MainPage__ReportInfo}>
      <div>
       <Text size="sm" color="neutral-primary">
        Reporte para: {costOfSalesData.producto} - {costOfSalesData.almacen} -
        Año {costOfSalesData.año}
       </Text>
       <Text size="xs" color="neutral-secondary">
        Generado el:{" "}
        {new Date(costOfSalesData.fechaGeneracion).toLocaleDateString()}
       </Text>
      </div>

      <div
       style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0.25rem",
       }}
      >
       <Button
        size="small"
        variant="primary"
        onClick={handleExportToCSV}
        disabled={!costOfSalesData}
       >
        Exportar como CSV
       </Button>
       <Button
        size="small"
        variant="primary"
        onClick={handleExportToExcel}
        disabled={!costOfSalesData}
       >
        Exportar como Excel
       </Button>

       <Button
        size="small"
        variant="primary"
        onClick={handleExportToPDF}
        disabled={!costOfSalesData}
       >
        Exportar como PDF
       </Button>
      </div>
     </div>
    )}

    {/* Tabla de totales */}
    {costOfSalesData && (
     <div className={styles.MainPage__SummarySection}>
      <Text size="md" color="neutral-primary">
       Resumen Anual
      </Text>
      <Table
       headers={summaryHeaders}
       rows={summaryRows}
       gridTemplate={summaryGridTemplate}
      />
     </div>
    )}
   </section>

   <Divider />

   {loading ? (
    <div style={{ padding: "20px", textAlign: "center" }}>
     <Text size="sm" color="neutral-primary">
      Cargando reporte de costo de ventas...
     </Text>
    </div>
   ) : costOfSalesData ? (
    <div className={styles.MainPage__MonthlySection}>
     <Text size="md" color="neutral-primary">
      Datos Mensuales
     </Text>
     <Table
      headers={monthlyHeaders}
      rows={monthlyRows}
      gridTemplate={monthlyGridTemplate}
     />
    </div>
   ) : !costOfSalesData ? (
    <div style={{ padding: "20px", textAlign: "center" }}>
     <Text size="sm" color="neutral-secondary">
      Seleccione un año y presione "Generar Reporte" para ver los datos.
     </Text>
    </div>
   ) : (
    <div style={{ padding: "20px", textAlign: "center" }}>
     <Text size="sm" color="neutral-secondary">
      No se encontraron datos para los filtros seleccionados.
     </Text>
    </div>
   )}
  </PageLayout>
 );
};
