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
  MovimientoTag,
} from "@/components";
import { InventoryService } from "../../services/InventoryService";
import { ProductService } from "@/domains/maintainers/services";
import { WarehouseService } from "@/domains/maintainers/services";
import type { KardexMovement } from "../../services/types";
import type { Product, Warehouse } from "@/domains/maintainers/types";
import * as XLSX from "xlsx";
import { useAuth } from "@/domains/auth";

export const MainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
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
  const [kardexResponse, setKardexResponse] = useState<any>(null);

  const [reportes, setReportes] = useState({
    cantidadActual: 0,
    costoUnitarioFinal: 0,
    costoTotalFinal: 0,
    costoVentasTotal: 0,
    inventarioInicialCantidad: 0,
    inventarioInicialCostoTotal: 0,
  });

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
  }, [searchParams]);

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
  const fetchKardexByInventoryId = async (inventoryId: number) => {
    try {
      setLoading(true);
      setError("");

      const kardexResponse = await InventoryService.getKardexMovements(
        inventoryId,
        `${selectedYear}-01-01`,
        `${selectedYear}-12-31`
      );

      setKardexData(kardexResponse.movimientos);
      setKardexResponse(kardexResponse);
      setReportes({
        cantidadActual: parseFloat(kardexResponse.saldoActual),
        costoUnitarioFinal:
          parseFloat(kardexResponse.costoFinal) /
          parseFloat(kardexResponse.saldoActual),
        costoTotalFinal: parseFloat(kardexResponse.costoFinal),
        costoVentasTotal: getCostoVentasTotal(kardexResponse.movimientos),
        inventarioInicialCantidad: parseFloat(
          kardexResponse.inventarioInicialCantidad
        ),
        inventarioInicialCostoTotal: parseFloat(
          kardexResponse.inventarioInicialCostoTotal
        ),
      });
      console.log("Kardex movements:", kardexResponse.movimientos);
      // Debug: revisar valores específicos de los movimientos
      kardexResponse.movimientos.forEach((mov, index) => {
        console.log(`Movimiento ${index}:`, {
          fecha: mov.fecha,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          costoUnitario: mov.costoUnitario,
          costoTotal: mov.costoTotal,
          calculado: mov.cantidad * mov.costoUnitario,
        });
      });
    } catch (error) {
      console.error("Error fetching kardex by inventory ID:", error);
      setError("Error al cargar los movimientos de kardex");
      setKardexData([]);
    } finally {
      setLoading(false);
    }
  };

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
        
        const kardexResponse = await InventoryService.getKardexMovements(
          parseInt(inventario.id),
          startDate,
          endDate
        );
        setKardexData(kardexResponse.movimientos);
        setKardexResponse(kardexResponse);
        setReportes({
          cantidadActual: parseFloat(kardexResponse.saldoActual),
          costoUnitarioFinal:
            parseFloat(kardexResponse.saldoActual) === 0
              ? 0
              : parseFloat(kardexResponse.costoFinal) /
                parseFloat(kardexResponse.saldoActual),
          costoTotalFinal: parseFloat(kardexResponse.costoFinal),
          costoVentasTotal: getCostoVentasTotal(kardexResponse.movimientos),
          inventarioInicialCantidad: parseFloat(
            kardexResponse.inventarioInicialCantidad
          ),
          inventarioInicialCostoTotal: parseFloat(
            kardexResponse.inventarioInicialCostoTotal
          ),
        });
        console.log(kardexResponse.movimientos);
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
  }, [selectedYear]);

  // Generar opciones de años (últimos 10 años)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - i;
    return {
      label: year.toString(),
      value: year.toString(),
    };
  });

  // Generar opciones de meses
  const monthOptions = [
    { label: "Todo el año", value: "" },
    { label: "Enero", value: "01" },
    { label: "Febrero", value: "02" },
    { label: "Marzo", value: "03" },
    { label: "Abril", value: "04" },
    { label: "Mayo", value: "05" },
    { label: "Junio", value: "06" },
    { label: "Julio", value: "07" },
    { label: "Agosto", value: "08" },
    { label: "Septiembre", value: "09" },
    { label: "Octubre", value: "10" },
    { label: "Noviembre", value: "11" },
    { label: "Diciembre", value: "12" },
  ];

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

  const headers = [
    "Fecha",
    "Tipo de movimiento",
    "Tipo (Tabla 10)",
    "Tipo (Tabla 12)",
    "Cod de comprobante",
    "Cantidad",
    "Costo Unitario",
    "Costo Total",
    "Saldo",
  ];

  /**
   * Formatea un número para mostrar en la tabla
   */
  const formatNumber = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    const result = isNaN(num) ? "0.00" : num.toFixed(2);
    // Debug: logging del formateo
    if (value === 22.5 || num === 22.5) {
      console.log("FormatNumber debug:", { input: value, num, result });
    }
    return result;
  };

  const rows = kardexData.map((movement) => ({
    id: movement.nComprobante,
    cells: [
      movement.fecha,
      <MovimientoTag
        movimiento={movement.tipo === "Entrada" ? "Entrada" : "Salida"}
      />,
      movement.tComprob,
      movement.tOperacion,
      movement.nComprobante,
      formatNumber(movement.cantidad),
      formatNumber(movement.costoUnitario),
      formatNumber(movement.costoTotal),
      formatNumber(movement.saldo),
    ],
  }));

  const reporterHeaders = [
    "Existencias finales",
    "Costo unitario final",
    "Costo total final",
    "Costo de ventas total",
  ];

  const reporterRows = [
    {
      id: "reporter-row",
      cells: [
        reportes.cantidadActual,
        reportes.costoUnitarioFinal,
        reportes.costoTotalFinal,
        reportes.costoVentasTotal,
      ],
    },
  ];

  const gridTemplate = "1fr 1.5fr 1.2fr 1.2fr 1.5fr 1fr 1fr 1fr 1fr";
  const reporterGridTemplate = "1.5fr 1.5fr 1.5fr 1.5fr";

  /**
   * Exporta los datos del kardex a Excel (.xlsx) según el formato FORMATO 13.1
   * "REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO"
   */
  const handleExportToExcel = () => {
    if (!kardexResponse || !kardexData.length || !user?.persona) {
      return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Obtener información de la empresa del usuario autenticado
    const empresa = user.persona;
    const periodo = selectedMonth 
      ? `${selectedMonth.toUpperCase()} ${selectedYear}`
      : selectedYear;

    // Obtener el producto seleccionado para mostrar su código
    const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
    const codigoProducto = selectedProduct?.codigo || "001";

    // Función para separar serie y número del comprobante
    const parseComprobante = (nComprobante: string) => {
      if (!nComprobante || !nComprobante.includes('-')) {
        return { serie: "", numero: nComprobante || "" };
      }
      const parts = nComprobante.split('-');
      return {
        serie: parts[0] || "",
        numero: parts[1] || ""
      };
    };

    // Crear los datos del reporte según FORMATO 13.1
    const reportData = [
      // Título del formato
      ["FORMATO 13.1: \"REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO\""],
      [],
      // Información de cabecera
      ["PERIODO:", "", "", "", periodo],
      ["RUC:", "", "", "", empresa.ruc],
      ["APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:", "", "", "", empresa.razonSocial || empresa.nombreEmpresa],
      ["ESTABLECIMIENTO (1):", "", "", "", `${kardexResponse.almacen}`],
      ["CÓDIGO DE LA EXISTENCIA:", "", "", "", codigoProducto],
      ["TIPO (TABLA 5):", "", "", "", "01"],
      ["DESCRIPCIÓN:", "", "", "", kardexResponse.producto],
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

    // Calcular saldo inicial
    let saldoCantidad = parseFloat(reportes.inventarioInicialCantidad.toString());
    let saldoCostoTotal = parseFloat(reportes.inventarioInicialCostoTotal.toString());
    let saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

    // Agregar fila de saldo inicial si existe
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

    // Procesar movimientos
    kardexData.forEach((movement) => {
      const comprobante = parseComprobante(movement.nComprobante || "");
      
      if (movement.tipo === "Salida" && movement.detallesSalida && movement.detallesSalida.length > 0) {
        // Para salidas con detalles, crear una fila por cada detalle
        movement.detallesSalida.forEach((detalle) => {
          const calculatedDetalleCostoTotal = detalle.costoTotalDeLote && detalle.costoTotalDeLote !== 0
            ? detalle.costoTotalDeLote
            : detalle.cantidad * detalle.costoUnitarioDeLote;

          // Actualizar saldo
          saldoCantidad -= detalle.cantidad;
          saldoCostoTotal -= calculatedDetalleCostoTotal;
          saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

        reportData.push([
          movement.fecha,
          movement.tComprob || "",
          comprobante.serie,
          comprobante.numero,
          movement.tOperacion || "",
          "", // Entrada cantidad
          "", // Entrada costo unitario
          "", // Entrada costo total
          detalle.cantidad.toFixed(2), // Salida cantidad
          detalle.costoUnitarioDeLote.toFixed(4), // Salida costo unitario
            calculatedDetalleCostoTotal.toFixed(2), // Salida costo total
            saldoCantidad.toFixed(2),
            saldoCostoUnitario.toFixed(4),
            saldoCostoTotal.toFixed(2)
          ]);
        });
      } else {
        // Para entradas y salidas simples
        const calculatedCostoTotal = movement.costoTotal && movement.costoTotal !== 0
          ? movement.costoTotal
          : movement.cantidad * movement.costoUnitario;

        let entradaCantidad = "", entradaCostoUnitario = "", entradaCostoTotal = "";
        let salidaCantidad = "", salidaCostoUnitario = "", salidaCostoTotal = "";

        if (movement.tipo === "Entrada") {
          // Actualizar saldo para entrada
          saldoCantidad += movement.cantidad;
          saldoCostoTotal += calculatedCostoTotal;
          saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

          entradaCantidad = movement.cantidad.toFixed(2);
          entradaCostoUnitario = movement.costoUnitario.toFixed(4);
          entradaCostoTotal = calculatedCostoTotal.toFixed(2);
        } else {
          // Actualizar saldo para salida
          saldoCantidad -= movement.cantidad;
          saldoCostoTotal -= calculatedCostoTotal;
          saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

          salidaCantidad = movement.cantidad.toFixed(2);
          salidaCostoUnitario = movement.costoUnitario.toFixed(4);
          salidaCostoTotal = calculatedCostoTotal.toFixed(2);
        }

        reportData.push([
          movement.fecha,
          movement.tComprob || "",
          comprobante.serie,
          comprobante.numero,
          movement.tOperacion || "",
          entradaCantidad,
          entradaCostoUnitario,
          entradaCostoTotal,
          salidaCantidad,
          salidaCostoUnitario,
          salidaCostoTotal,
          saldoCantidad.toFixed(2),
          saldoCostoUnitario.toFixed(4),
          saldoCostoTotal.toFixed(2)
        ]);
      }
    });

    // Agregar fila de totales
    const totalEntradas = kardexData
      .filter(m => m.tipo === "Entrada")
      .reduce((sum, m) => sum + (m.costoTotal || m.cantidad * m.costoUnitario), 0);
    
    const totalSalidas = kardexData
      .filter(m => m.tipo === "Salida")
      .reduce((sum, m) => {
        if (m.detallesSalida && m.detallesSalida.length > 0) {
          return sum + m.detallesSalida.reduce((detSum, det) => 
            detSum + (det.costoTotalDeLote || det.cantidad * det.costoUnitarioDeLote), 0);
        }
        return sum + (m.costoTotal || m.cantidad * m.costoUnitario);
      }, 0);

    reportData.push([
      "",
      "",
      "",
      "",
      "TOTALES",
      "",
      "",
      totalEntradas.toFixed(2),
      "",
      "",
      totalSalidas.toFixed(2),
      "",
      "",
      ""
    ]);

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(reportData);

    // Configurar anchos de columna
    const colWidths = [
      { wch: 12 }, // Fecha
      { wch: 15 }, // Tipo
      { wch: 8 },  // Serie
      { wch: 12 }, // Número
      { wch: 15 }, // Tipo operación
      { wch: 12 }, // Entrada cantidad
      { wch: 15 }, // Entrada costo unitario
      { wch: 15 }, // Entrada costo total
      { wch: 12 }, // Salida cantidad
      { wch: 15 }, // Salida costo unitario
      { wch: 15 }, // Salida costo total
      { wch: 12 }, // Saldo cantidad
      { wch: 15 }, // Saldo costo unitario
      { wch: 15 }  // Saldo costo total
    ];
    worksheet['!cols'] = colWidths;

    // Configurar celdas combinadas para los encabezados de secciones
    const merges = [
      // ENTRADAS (columnas F, G, H - índices 5, 6, 7)
      { s: { r: 12, c: 5 }, e: { r: 12, c: 7 } },
      // SALIDAS (columnas I, J, K - índices 8, 9, 10)
      { s: { r: 12, c: 8 }, e: { r: 12, c: 10 } },
      // SALDO FINAL (columnas L, M, N - índices 11, 12, 13)
      { s: { r: 12, c: 11 }, e: { r: 12, c: 13 } }
    ];
    worksheet['!merges'] = merges;

    // Aplicar bordes gruesos a las secciones usando un enfoque que funciona con XLSX
    const startRow = 13; // Fila de encabezados de secciones (0-indexed)
    const endRow = reportData.length - 1;

    // Función para aplicar bordes gruesos a un rango
    const applyThickBorders = (startCol: number, endCol: number) => {
      // Aplicar bordes a todas las celdas del rango
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { t: 's', v: '' };
          }
          if (!worksheet[cellRef].s) {
            worksheet[cellRef].s = {};
          }
          if (!worksheet[cellRef].s.border) {
            worksheet[cellRef].s.border = {};
          }

          // Aplicar bordes exteriores gruesos
          if (col === startCol) {
            worksheet[cellRef].s.border.left = { style: "thick", color: { rgb: "000000" } };
          }
          if (col === endCol) {
            worksheet[cellRef].s.border.right = { style: "thick", color: { rgb: "000000" } };
          }
          if (row === startRow) {
            worksheet[cellRef].s.border.top = { style: "thick", color: { rgb: "000000" } };
          }
          if (row === endRow) {
            worksheet[cellRef].s.border.bottom = { style: "thick", color: { rgb: "000000" } };
          }

          // Aplicar bordes internos finos
          if (col > startCol && col < endCol) {
            worksheet[cellRef].s.border.left = { style: "thin", color: { rgb: "000000" } };
            worksheet[cellRef].s.border.right = { style: "thin", color: { rgb: "000000" } };
          }
          if (row > startRow && row < endRow) {
            worksheet[cellRef].s.border.top = { style: "thin", color: { rgb: "000000" } };
            worksheet[cellRef].s.border.bottom = { style: "thin", color: { rgb: "000000" } };
          }
        }
      }
    };

    // Aplicar bordes gruesos a cada sección
    applyThickBorders(5, 7);   // ENTRADAS (columnas F, G, H)
    applyThickBorders(8, 10);  // SALIDAS (columnas I, J, K)
    applyThickBorders(11, 13); // SALDO FINAL (columnas L, M, N)

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex Valorizado");

    // ========== CREAR SEGUNDA HOJA SIMPLIFICADA (FORMATO 12.1) ==========
    
    // Crear los datos del reporte simplificado según FORMATO 12.1
    const simplifiedReportData = [
      // Título del formato
      ["FORMATO 12.1: \"REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS- DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS\""],
      [],
      // Información de cabecera
      ["PERIODO:", "", "", "", "", "", periodo],
      ["RUC:", "", "", "", "", "", empresa.ruc],
      ["APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:", "", "", "", "", "", empresa.razonSocial || empresa.nombreEmpresa],
      ["ESTABLECIMIENTO (1):", "", "", "", "", "", `${kardexResponse.almacen}`],
      ["CÓDIGO DE LA EXISTENCIA:", "", "", "", "", "", codigoProducto],
      ["TIPO (TABLA 5):", "", "", "", "", "", "01"],
      ["DESCRIPCIÓN:", "", "", "", "", "", kardexResponse.producto],
      ["CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):", "", "", "", "", "", "01"],
      [],
      // Encabezados de la tabla simplificada
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

    // Calcular saldo inicial en cantidades
    let saldoCantidadSimplificado = parseFloat(reportes.inventarioInicialCantidad.toString());

    // Agregar fila de saldo inicial si existe
    if (saldoCantidadSimplificado > 0) {
      simplifiedReportData.push([
        "-",
        "",
        "-",
        "-",
        "-",
        "", // Entrada cantidad
        "", // Salida cantidad
        saldoCantidadSimplificado.toFixed(2) // Saldo cantidad
      ]);
    }

    // Procesar movimientos para la hoja simplificada
    kardexData.forEach((movement) => {
      const comprobante = parseComprobante(movement.nComprobante || "");
      
      if (movement.tipo === "Salida" && movement.detallesSalida && movement.detallesSalida.length > 0) {
        // Para salidas con detalles, crear una fila por cada detalle
        movement.detallesSalida.forEach((detalle) => {
          // Actualizar saldo
          saldoCantidadSimplificado -= detalle.cantidad;

          simplifiedReportData.push([
            movement.fecha,
            movement.tComprob || "",
            comprobante.serie,
            comprobante.numero,
            movement.tOperacion || "",
            "", // Entrada cantidad
            detalle.cantidad.toFixed(2), // Salida cantidad
            saldoCantidadSimplificado.toFixed(2) // Saldo cantidad
          ]);
        });
      } else {
        // Para entradas y salidas simples
        let entradaCantidad = "", salidaCantidad = "";

        if (movement.tipo === "Entrada") {
          // Actualizar saldo para entrada
          saldoCantidadSimplificado += movement.cantidad;
          entradaCantidad = movement.cantidad.toFixed(2);
        } else {
          // Actualizar saldo para salida
          saldoCantidadSimplificado -= movement.cantidad;
          salidaCantidad = movement.cantidad.toFixed(2);
        }

        simplifiedReportData.push([
          movement.fecha,
          movement.tComprob || "",
          comprobante.serie,
          comprobante.numero,
          movement.tOperacion || "",
          entradaCantidad,
          salidaCantidad,
          saldoCantidadSimplificado.toFixed(2)
        ]);
      }
    });

    // Agregar fila de totales para la hoja simplificada
    const totalEntradasCantidad = kardexData
      .filter(m => m.tipo === "Entrada")
      .reduce((sum, m) => sum + m.cantidad, 0);
    
    const totalSalidasCantidad = kardexData
      .filter(m => m.tipo === "Salida")
      .reduce((sum, m) => {
        if (m.detallesSalida && m.detallesSalida.length > 0) {
          return sum + m.detallesSalida.reduce((detSum, det) => detSum + det.cantidad, 0);
        }
        return sum + m.cantidad;
      }, 0);

    simplifiedReportData.push([
      "",
      "",
      "",
      "",
      "TOTALES",
      totalEntradasCantidad.toFixed(2),
      totalSalidasCantidad.toFixed(2),
      ""
    ]);

    // Crear la hoja de trabajo simplificada
    const simplifiedWorksheet = XLSX.utils.aoa_to_sheet(simplifiedReportData);

    // Configurar anchos de columna para la hoja simplificada
    const simplifiedColWidths = [
      { wch: 12 }, // Fecha
      { wch: 15 }, // Tipo
      { wch: 8 },  // Serie
      { wch: 12 }, // Número
      { wch: 20 }, // Tipo operación
      { wch: 15 }, // Entrada cantidad
      { wch: 15 }, // Salida cantidad
      { wch: 15 }  // Saldo cantidad
    ];
    simplifiedWorksheet['!cols'] = simplifiedColWidths;

    // Configurar celdas combinadas para los encabezados de la hoja simplificada
    const simplifiedMerges = [
      // Título principal
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      // Documento de traslado header
      { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }
    ];
    simplifiedWorksheet['!merges'] = simplifiedMerges;

    // Aplicar bordes a la hoja simplificada
    const simplifiedStartRow = 12; // Fila de encabezados (0-indexed)
    const simplifiedEndRow = simplifiedReportData.length - 1;

    // Función para aplicar bordes a la hoja simplificada
    const applySimplifiedBorders = () => {
      for (let row = simplifiedStartRow; row <= simplifiedEndRow; row++) {
        for (let col = 0; col <= 7; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!simplifiedWorksheet[cellRef]) {
            simplifiedWorksheet[cellRef] = { t: 's', v: '' };
          }
          if (!simplifiedWorksheet[cellRef].s) {
            simplifiedWorksheet[cellRef].s = {};
          }
          if (!simplifiedWorksheet[cellRef].s.border) {
            simplifiedWorksheet[cellRef].s.border = {};
          }

          // Aplicar bordes exteriores
          if (col === 0) {
            simplifiedWorksheet[cellRef].s.border.left = { style: "thick", color: { rgb: "000000" } };
          }
          if (col === 7) {
            simplifiedWorksheet[cellRef].s.border.right = { style: "thick", color: { rgb: "000000" } };
          }
          if (row === simplifiedStartRow) {
            simplifiedWorksheet[cellRef].s.border.top = { style: "thick", color: { rgb: "000000" } };
          }
          if (row === simplifiedEndRow) {
            simplifiedWorksheet[cellRef].s.border.bottom = { style: "thick", color: { rgb: "000000" } };
          }

          // Aplicar bordes internos finos
          if (col > 0 && col < 7) {
            simplifiedWorksheet[cellRef].s.border.left = { style: "thin", color: { rgb: "000000" } };
            simplifiedWorksheet[cellRef].s.border.right = { style: "thin", color: { rgb: "000000" } };
          }
          if (row > simplifiedStartRow && row < simplifiedEndRow) {
            simplifiedWorksheet[cellRef].s.border.top = { style: "thin", color: { rgb: "000000" } };
            simplifiedWorksheet[cellRef].s.border.bottom = { style: "thin", color: { rgb: "000000" } };
          }
        }
      }
    };

    // Aplicar bordes a la hoja simplificada
    applySimplifiedBorders();

    // Agregar la hoja simplificada al libro
    XLSX.utils.book_append_sheet(workbook, simplifiedWorksheet, "Kardex Unidades Físicas");

    // Generar nombre del archivo
    const producto = kardexResponse.producto || "producto";
    const almacen = kardexResponse.almacen || "almacen";
    const filename = `kardex_completo_${producto.replace(/\s+/g, "_")}_${almacen.replace(/\s+/g, "_")}_${selectedYear}${selectedMonth ? `_${selectedMonth}` : ""}.xlsx`;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);
  };

  /**
   * Exporta los datos del kardex a PDF con ambos formatos (valorizado y simplificado)
   */
  const handleExportToPDF = () => {
    if (!kardexResponse || !kardexData.length || !user?.persona) {
      return;
    }

    const empresa = user.persona;
    const periodo = selectedMonth 
      ? `${selectedMonth.toUpperCase()} ${selectedYear}`
      : selectedYear;

    const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
    const codigoProducto = selectedProduct?.codigo || "001";

    // Función auxiliar para parsear comprobante
    const parseComprobante = (tComprob: string, nComprobante: string) => {
      if (!nComprobante) return { serie: "", numero: "" };
      console.log(tComprob);
      // Si nComprobante ya contiene el formato completo (ej: "F00-000")
      const parts = nComprobante.split("-");
      
      if (parts.length >= 2) {
        return {
          serie: parts[0] || "",
          numero: parts.slice(1).join("-") || ""
        };
      }
      
      // Si no tiene guión, devolver el número completo en numero y serie vacía
      return { serie: "", numero: nComprobante };
    };

    // Crear contenido HTML para imprimir con ambos formatos
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kardex Completo - ${kardexResponse.producto} - ${kardexResponse.almacen} - ${selectedYear}</title>
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
          <p><strong>PERÍODO:</strong> ${periodo}</p>
          <p><strong>RUC:</strong> ${empresa.ruc || ""}</p>
          <p><strong>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:</strong> ${empresa.nombreEmpresa || ""}</p>
          <p><strong>ESTABLECIMIENTO (1):</strong> ${kardexResponse.almacen || ""}</p>
          <p><strong>CÓDIGO DE LA EXISTENCIA:</strong> ${codigoProducto}</p>
          <p><strong>TIPO (TABLA 5):01</strong></p>
          <p><strong>DESCRIPCIÓN:</strong> ${kardexResponse.producto || ""}</p>
          <p><strong>CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):01</strong></p>
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
            ${(() => {
              let html = '';
              
              // Saldo inicial valorizado
              const costoUnitarioInicial = reportes.inventarioInicialCantidad > 0 
                ? reportes.inventarioInicialCostoTotal / reportes.inventarioInicialCantidad 
                : 0;
              
              html += `
                <tr>
                  <td>01/01/${selectedYear}</td>
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
                  <td>${reportes.inventarioInicialCantidad}</td>
                  <td>${costoUnitarioInicial.toFixed(2)}</td>
                  <td>${reportes.inventarioInicialCostoTotal.toFixed(2)}</td>
                </tr>`;

              // Variables para el saldo acumulado valorizado
              let saldoCantidad = parseFloat(reportes.inventarioInicialCantidad.toString());
              let saldoCostoTotal = parseFloat(reportes.inventarioInicialCostoTotal.toString());

              // Procesar movimientos valorizados
              kardexData.forEach((movement) => {
                const { serie, numero } = parseComprobante(movement.tComprob, movement.nComprobante);
                
                if (movement.tipo === "Salida" && movement.detallesSalida && movement.detallesSalida.length > 0) {
                  movement.detallesSalida.forEach((detalle) => {
                    const calculatedDetalleCostoTotal = detalle.costoTotalDeLote && detalle.costoTotalDeLote !== 0
                      ? detalle.costoTotalDeLote
                      : detalle.cantidad * detalle.costoUnitarioDeLote;

                    saldoCantidad -= detalle.cantidad;
                    saldoCostoTotal -= calculatedDetalleCostoTotal;
                    
                    const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                    html += `
                      <tr>
                        <td>${movement.fecha}</td>
                        <td>${movement.tComprob || ''}</td>
                        <td>${serie}</td>
                        <td>${numero}</td>
                        <td>${movement.tOperacion || ''}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${detalle.cantidad}</td>
                        <td>${detalle.costoUnitarioDeLote.toFixed(2)}</td>
                        <td>${calculatedDetalleCostoTotal.toFixed(2)}</td>
                        <td>${saldoCantidad}</td>
                        <td>${saldoCostoUnitario.toFixed(2)}</td>
                        <td>${saldoCostoTotal.toFixed(2)}</td>
                      </tr>`;
                  });
                } else {
                  const calculatedCostoTotal = movement.costoTotal && movement.costoTotal !== 0
                    ? movement.costoTotal
                    : movement.cantidad * movement.costoUnitario;

                  if (movement.tipo === "Entrada") {
                    saldoCantidad += movement.cantidad;
                    saldoCostoTotal += calculatedCostoTotal;
                    
                    const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                    html += `
                      <tr>
                        <td>${movement.fecha}</td>
                        <td>${movement.tComprob || ''}</td>
                        <td>${serie}</td>
                        <td>${numero}</td>
                        <td>${movement.tOperacion || ''}</td>
                        <td>${movement.cantidad}</td>
                        <td>${movement.costoUnitario.toFixed(2)}</td>
                        <td>${calculatedCostoTotal.toFixed(2)}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${saldoCantidad}</td>
                        <td>${saldoCostoUnitario.toFixed(2)}</td>
                        <td>${saldoCostoTotal.toFixed(2)}</td>
                      </tr>`;
                  } else {
                    saldoCantidad -= movement.cantidad;
                    saldoCostoTotal -= calculatedCostoTotal;
                    
                    const saldoCostoUnitario = saldoCantidad > 0 ? saldoCostoTotal / saldoCantidad : 0;

                    html += `
                      <tr>
                        <td>${movement.fecha}</td>
                        <td>${movement.tComprob || ''}</td>
                        <td>${serie}</td>
                        <td>${numero}</td>
                        <td>${movement.tOperacion || ''}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${movement.cantidad}</td>
                        <td>${movement.costoUnitario.toFixed(2)}</td>
                        <td>${calculatedCostoTotal.toFixed(2)}</td>
                        <td>${saldoCantidad}</td>
                        <td>${saldoCostoUnitario.toFixed(2)}</td>
                        <td>${saldoCostoTotal.toFixed(2)}</td>
                      </tr>`;
                  }
                }
              });

              // Totales valorizado
              let totalEntradas = 0;
              let totalSalidas = 0;
              
              kardexData.forEach((movement) => {
                if (movement.tipo === "Entrada") {
                  totalEntradas += movement.cantidad;
                } else if (movement.detallesSalida && movement.detallesSalida.length > 0) {
                  movement.detallesSalida.forEach((detalle) => {
                    totalSalidas += detalle.cantidad;
                  });
                } else {
                  totalSalidas += movement.cantidad;
                }
              });

              html += `
                <tr style="font-weight: bold;">
                  <td>TOTALES</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>${totalEntradas}</td>
                  <td></td>
                  <td></td>
                  <td>${totalSalidas}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>`;

              return html;
            })()}
          </tbody>
        </table>

        <!-- FORMATO 12.1 - KARDEX UNIDADES FÍSICAS -->
        <div class="page-break">
          <h1>FORMATO 12.1: "REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS - DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS"</h1>
          
          <div class="info">
            <p><strong>PERÍODO:</strong> ${periodo}</p>
            <p><strong>RUC:</strong> ${empresa.ruc || ""}</p>
            <p><strong>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL:</strong> ${empresa.nombreEmpresa || ""}</p>
            <p><strong>ESTABLECIMIENTO (1):</strong> ${kardexResponse.almacen || ""}</p>
            <p><strong>CÓDIGO DE LA EXISTENCIA:</strong> ${codigoProducto}</p>
            <p><strong>TIPO (TABLA 5):</strong>01</p>
            <p><strong>DESCRIPCIÓN:</strong> ${kardexResponse.producto || ""}</p>
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
              ${(() => {
                let html = '';
                
                // Saldo inicial simplificado
                html += `
                  <tr>
                    <td>01/01/${selectedYear}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>SALDO INICIAL</td>
                    <td></td>
                    <td></td>
                    <td>${reportes.inventarioInicialCantidad}</td>
                  </tr>`;

                // Variables para el saldo acumulado simplificado
                let saldoCantidadSimple = parseFloat(reportes.inventarioInicialCantidad.toString());

                // Procesar movimientos simplificados
                kardexData.forEach((movement) => {
                  const { serie, numero } = parseComprobante(movement.tComprob, movement.nComprobante);
                  
                  if (movement.tipo === "Salida" && movement.detallesSalida && movement.detallesSalida.length > 0) {
                    movement.detallesSalida.forEach((detalle) => {
                      saldoCantidadSimple -= detalle.cantidad;
                      html += `
                        <tr>
                          <td>${movement.fecha}</td>
                          <td>${movement.tComprob || ''}</td>
                          <td>${serie}</td>
                          <td>${numero}</td>
                          <td>${movement.tOperacion || ''}</td>
                          <td></td>
                          <td>${detalle.cantidad}</td>
                          <td>${saldoCantidadSimple}</td>
                        </tr>`;
                    });
                  } else {
                    if (movement.tipo === "Entrada") {
                      saldoCantidadSimple += movement.cantidad;
                      html += `
                        <tr>
                          <td>${movement.fecha}</td>
                          <td>${movement.tComprob || ''}</td>
                          <td>${serie}</td>
                          <td>${numero}</td>
                          <td>${movement.tOperacion || ''}</td>
                          <td>${movement.cantidad}</td>
                          <td></td>
                          <td>${saldoCantidadSimple}</td>
                        </tr>`;
                    } else {
                      saldoCantidadSimple -= movement.cantidad;
                      html += `
                        <tr>
                          <td>${movement.fecha}</td>
                          <td>${movement.tComprob || ''}</td>
                          <td>${serie}</td>
                          <td>${numero}</td>
                          <td>${movement.tOperacion || ''}</td>
                          <td></td>
                          <td>${movement.cantidad}</td>
                          <td>${saldoCantidadSimple}</td>
                        </tr>`;
                    }
                  }
                });

                // Totales simplificado
                let totalEntradas = 0;
                let totalSalidas = 0;
                
                kardexData.forEach((movement) => {
                  if (movement.tipo === "Entrada") {
                    totalEntradas += movement.cantidad;
                  } else if (movement.detallesSalida && movement.detallesSalida.length > 0) {
                    movement.detallesSalida.forEach((detalle) => {
                      totalSalidas += detalle.cantidad;
                    });
                  } else {
                    totalSalidas += movement.cantidad;
                  }
                });

                html += `
                  <tr style="font-weight: bold;">
                    <td>TOTALES</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>${totalEntradas}</td>
                    <td>${totalSalidas}</td>
                    <td></td>
                  </tr>`;

                return html;
              })()}
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

  // Verificar si hay inventoryId en la URL para ocultar filtros
  const inventoryIdFromUrl = searchParams.get("inventoryId");
  const isDirectLoad = !!inventoryIdFromUrl;

  return (
    <PageLayout
      title="Kardex"
      subtitle="Muestra el detalle de movimientos y saldos del producto seleccionado."
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
              Mes
            </Text>
            <ComboBox
              options={monthOptions}
              size="xs"
              variant="createSale"
              value={selectedMonth}
              onChange={(v) => setSelectedMonth(v as string)}
              placeholder="Seleccionar mes"
            />
          </div>
          {!isDirectLoad && (
            <>
              <div className={styles.MainPage__Filter}>
                <Text size="xs" color="neutral-primary">
                  Almacen
                </Text>
                <ComboBox
                  options={warehouseOptions}
                  size="xs"
                  variant="createSale"
                  value={selectedWarehouseId}
                  onChange={(v) => setSelectedWarehouseId(v as string)}
                  placeholder="Seleccionar almacen"
                />
              </div>
              <div className={styles.MainPage__Filter}>
                <Text size="xs" color="neutral-primary">
                  Producto
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
            </>
          )}
        </div>

        <Divider />
        {kardexData.length > 0 && kardexResponse && (
          <div className={styles.MainPage__ReportInfo}>
            <div>
              <Text size="sm" color="neutral-primary">
                Reporte para: {kardexResponse.producto} -{" "}
                {kardexResponse.almacen} - Año {selectedYear}
              </Text>
              <Text size="xs" color="neutral-secondary">
                Generado el: {new Date().toLocaleDateString()}
              </Text>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.25rem",
              }}
            >
              <Button
                size="small"
                variant="primary"
                onClick={handleExportToExcel}
                disabled={!kardexData || kardexData.length === 0}
              >
                Exportar como Excel
              </Button>

              <Button
                size="small"
                variant="primary"
                onClick={handleExportToPDF}
                disabled={!kardexData || kardexData.length === 0}
              >
                Exportar como PDF
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.MainPage__Error}>
            <Text size="xs" color="danger">
              {error}
            </Text>
          </div>
        )}

        <Table
          headers={reporterHeaders}
          rows={reporterRows}
          gridTemplate={reporterGridTemplate}
        />
      </section>

      <Divider />

      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Text size="sm" color="neutral-primary">
            Cargando movimientos de kardex...
          </Text>
        </div>
      ) : (
        <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />
      )}
    </PageLayout>
  );
};
