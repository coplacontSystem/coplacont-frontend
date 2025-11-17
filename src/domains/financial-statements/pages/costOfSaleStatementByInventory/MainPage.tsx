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
import { ProductService } from "@/domains/maintainers/services";
import { WarehouseService } from "@/domains/maintainers/services";
import type { CostOfSalesStatementByInventory } from "../../services/CostOfSalesStatement";
import type { Product, Warehouse } from "@/domains/maintainers/types";
import { downloadFile } from "@/shared/utils/downloadUtils";
import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

export const MainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [costOfSalesData, setCostOfSalesData] =
    useState<CostOfSalesStatementByInventory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Cargar productos y almacenes al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await ProductService.getAll();
        setProducts(productsResponse);

        const warehousesResponse = await WarehouseService.getAll();
        setWarehouses(warehousesResponse);

        // Si hay parámetros en la URL, seleccionarlos automáticamente
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
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error al cargar los datos");
      }
    };

    fetchData();
  }, [searchParams]);

  /**
   * Carga el reporte de costo de ventas por inventario
   */
  const fetchCostOfSalesStatement = async () => {
    if (!selectedYear) {
      setError("Debe seleccionar al menos un año");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const requestParams: import("../../api/financialStatementsApi").CostOfSalesParams = {
        año: parseInt(selectedYear, 10),
        idAlmacen: selectedWarehouseId ? parseInt(selectedWarehouseId, 10) : 0,
        idProducto: selectedProductId ? parseInt(selectedProductId, 10) : 0,
      };

      const response =
        await CostOfSalesStatementService.getCostOfSalesStatementByInventory(
          requestParams
        );

      setCostOfSalesData(response);
      console.log("Cost of sales by inventory data:", response);
    } catch (error) {
      console.error(
        "Error fetching cost of sales statement by inventory:",
        error
      );
      setError("Error al cargar el reporte de costo de ventas por inventario");
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

  // Rows para la tabla de resumen
  const summaryRows = costOfSalesData
    ? [
        {
          id: "summary",
          cells: [
            `S/ ${costOfSalesData.sumatorias.totalEntradasAnual}`,
            `S/ ${costOfSalesData.sumatorias.totalSalidasAnual}`,
            `S/ ${costOfSalesData.sumatorias.totalInventarioFinalAnual}`,
          ],
        },
      ]
    : [];

  // Headers para la tabla de datos de inventario
  const inventoryHeaders = [
    "Producto - Almacén",
    "Entradas Totales",
    "Salidas Totales",
    "Inventario Final",
  ];

  // Rows para la tabla de datos de inventario
  const inventoryRows = costOfSalesData
    ? costOfSalesData.datosInventarios.map((dato, index) => ({
        id: index.toString(),
        cells: [
          dato.nombreProductoAlmacen,
          `S/ ${dato.entradasTotales}`,
          `S/ ${dato.salidasTotales}`,
          `S/ ${dato.inventarioFinal}`,
        ],
      }))
    : [];

  const summaryGridTemplate = "1fr 1fr 1fr";
  const inventoryGridTemplate = "2fr 1fr 1fr 1fr";

  /**
   * Exporta los datos del estado de costo de ventas por inventario a CSV
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
    const filename = `estado_costo_ventas_inventario_${costOfSalesData.año}.csv`;

    downloadFile(blob, filename);
  };

  /**
   * Exporta los datos del estado de costo de ventas por inventario a Excel (.xlsx)
   */
  const handleExportToExcel = () => {
    if (!costOfSalesData) {
      return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Crear hoja de resumen
    const summaryData = [
      ['ESTADO DE COSTO DE VENTAS POR INVENTARIO'],
      [],
      ['Año:', costOfSalesData.año],
      ['Fecha de Generación:', new Date(costOfSalesData.fechaGeneracion).toLocaleDateString()],
      [],
      ['RESUMEN ANUAL'],
      ['Total Entradas Anual', 'Total Salidas Anual', 'Inventario Final Anual', 'Cantidad Inventarios'],
      [
        `S/ ${costOfSalesData.sumatorias.totalEntradasAnual}`,
        `S/ ${costOfSalesData.sumatorias.totalSalidasAnual}`,
        `S/ ${costOfSalesData.sumatorias.totalInventarioFinalAnual}`,
        costOfSalesData.sumatorias.cantidadInventarios
      ]
    ];

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');

    // Crear hoja de datos de inventarios
    const inventoryData = [
      ['DATOS DE INVENTARIOS'],
      [],
      ['Producto - Almacén', 'Entradas Totales', 'Salidas Totales', 'Inventario Final'],
      ...costOfSalesData.datosInventarios.map(dato => [
        dato.nombreProductoAlmacen,
        `S/ ${dato.entradasTotales}`,
        `S/ ${dato.salidasTotales}`,
        `S/ ${dato.inventarioFinal}`
      ])
    ];

    const inventoryWorksheet = XLSX.utils.aoa_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(workbook, inventoryWorksheet, 'Inventarios');

    // Generar nombre del archivo
    const filename = `estado_costo_ventas_inventario_${costOfSalesData.año}.xlsx`;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);
  };

  /**
   * Exporta los datos del estado de costo de ventas por inventario a PDF (usando ventana de impresión)
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
        <title>Estado de Costo de Ventas por Inventario - ${costOfSalesData.año}</title>
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
        <h1>ESTADO DE COSTO DE VENTAS POR INVENTARIO</h1>
        
        <div class="info">
          <p><strong>Año:</strong> ${costOfSalesData.año}</p>
          <p><strong>Fecha de Generación:</strong> ${new Date(costOfSalesData.fechaGeneracion).toLocaleDateString()}</p>
        </div>
        
        <h2>RESUMEN ANUAL</h2>
        <table>
          <thead>
            <tr>
              <th>Total Entradas Anual</th>
              <th>Total Salidas Anual</th>
              <th>Inventario Final Anual</th>
              <th>Cantidad Inventarios</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S/ ${costOfSalesData.sumatorias.totalEntradasAnual}</td>
              <td>S/ ${costOfSalesData.sumatorias.totalSalidasAnual}</td>
              <td>S/ ${costOfSalesData.sumatorias.totalInventarioFinalAnual}</td>
              <td>${costOfSalesData.sumatorias.cantidadInventarios}</td>
            </tr>
          </tbody>
        </table>
        
        <h2>DATOS DE INVENTARIOS</h2>
        <table>
          <thead>
            <tr>
              <th>Producto - Almacén</th>
              <th>Entradas Totales</th>
              <th>Salidas Totales</th>
              <th>Inventario Final</th>
            </tr>
          </thead>
          <tbody>
            ${costOfSalesData.datosInventarios.map(dato => `
              <tr>
                <td>${dato.nombreProductoAlmacen}</td>
                <td>S/ ${dato.entradasTotales}</td>
                <td>S/ ${dato.salidasTotales}</td>
                <td>S/ ${dato.inventarioFinal}</td>
              </tr>
            `).join('')}
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
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert('Por favor, permite las ventanas emergentes para generar el PDF');
    }
  };

  /**
   * Genera el contenido CSV para el estado de costo de ventas por inventario
   */
  const generateCostOfSalesCSV = (
    data: CostOfSalesStatementByInventory
  ): string => {
    const lines: string[] = [];

    // Información del reporte
    lines.push("ESTADO DE COSTO DE VENTAS POR INVENTARIO");
    lines.push("");
    lines.push(`Año:,${data.año}`);
    lines.push(
      `Fecha de Generación:,${new Date(
        data.fechaGeneracion
      ).toLocaleDateString()}`
    );
    lines.push("");

    // Resumen anual
    lines.push("RESUMEN ANUAL");
    lines.push(
      "Total Entradas Anual,Total Salidas Anual,Inventario Final Anual,Cantidad Inventarios"
    );
    lines.push(
      `S/ ${data.sumatorias.totalEntradasAnual},S/ ${data.sumatorias.totalSalidasAnual},S/ ${data.sumatorias.totalInventarioFinalAnual},${data.sumatorias.cantidadInventarios}`
    );
    lines.push("");

    // Datos de inventarios
    lines.push("DATOS DE INVENTARIOS");
    lines.push(
      "Producto - Almacén,Entradas Totales,Salidas Totales,Inventario Final"
    );

    data.datosInventarios.forEach((dato) => {
      lines.push(
        `${dato.nombreProductoAlmacen},S/ ${dato.entradasTotales},S/ ${dato.salidasTotales},S/ ${dato.inventarioFinal}`
      );
    });

    return lines.join("\n");
  };

  return (
    <PageLayout
      title="Estado consolidado de costo de venta"
      subtitle="Reporte detallado del costo de ventas por inventario, producto, almacén y año."
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
                Reporte de Inventarios - Año {costOfSalesData.año}
              </Text>
              <Text size="xs" color="neutral-secondary">
                Generado el:{" "}
                {new Date(costOfSalesData.fechaGeneracion).toLocaleDateString()}
              </Text>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.25rem'}}>
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
            Cargando reporte de costo de ventas por inventario...
          </Text>
        </div>
      ) : costOfSalesData ? (
        <div className={styles.MainPage__MonthlySection}>
          <Text size="md" color="neutral-primary">
            Datos de Inventarios
          </Text>
          <Table
            headers={inventoryHeaders}
            rows={inventoryRows}
            gridTemplate={inventoryGridTemplate}
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
