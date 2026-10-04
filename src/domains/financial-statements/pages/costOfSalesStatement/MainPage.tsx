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
import { useDescargarReporte } from "@/shared/hooks";
import type { FiltrosReporte, FormatoReporte } from "@/shared/utils/reportes";

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
 // Filtros con que se generó el reporte en pantalla: la exportación usa los mismos
 const [filtrosReporte, setFiltrosReporte] = useState<FiltrosReporte>({});
 const { descargar, descargando, error: errorExportacion } =
  useDescargarReporte("costo-ventas");

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
   setFiltrosReporte({
    año: requestParams.año,
    idAlmacen: requestParams.idAlmacen || undefined,
    idProducto: requestParams.idProducto || undefined,
   });
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

 /** Descarga el reporte generado en el backend (mismos datos que la pantalla). */
 const exportar = (formato: FormatoReporte) => descargar(formato, filtrosReporte);

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

    {(error || errorExportacion) && (
     <div className={styles.MainPage__Error}>
      <Text size="xs" color="danger">
       {error || errorExportacion}
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
        onClick={() => exportar("csv")}
        disabled={!costOfSalesData || descargando !== null}
       >
        {descargando === "csv" ? "Generando..." : "Exportar como CSV"}
       </Button>
       <Button
        size="small"
        variant="primary"
        onClick={() => exportar("xlsx")}
        disabled={!costOfSalesData || descargando !== null}
       >
        {descargando === "xlsx" ? "Generando..." : "Exportar como Excel"}
       </Button>

       <Button
        size="small"
        variant="primary"
        onClick={() => exportar("pdf")}
        disabled={!costOfSalesData || descargando !== null}
       >
        {descargando === "pdf" ? "Generando..." : "Exportar como PDF"}
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
