import React from "react";
import styles from "./MainPage.module.scss";
import { PageLayout, Table, Divider, MovimientoTag, Text } from "@/components";
import { useAuth } from "@/domains/auth";
import { useKardexData } from "../../hooks/useKardexData";
import { useKardexExport } from "../../hooks/useKardexExport";
import { KardexFilters } from "./components/KardexFilters";
import { KardexReportInfo } from "./components/KardexReportInfo";

export const MainPage: React.FC = () => {
  const { user } = useAuth();

  const {
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
    isDirectLoad,
  } = useKardexData();

  const { handleExportToExcel, handleExportToPDF } = useKardexExport({
    kardexData,
    kardexResponse,
    user,
    selectedYear,
    selectedMonth,
    products,
    selectedProductId,
    reportes,
  });

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

  const formatNumber = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    const result = isNaN(num) ? "0.00" : num.toFixed(2);
    return result;
  };

  const rows = kardexData.map((movement) => ({
    id: movement.nComprobante,
    cells: [
      movement.fecha,
      <MovimientoTag
        key={`${movement.nComprobante}-tag`}
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

  return (
    <PageLayout
      title="Kardex"
      subtitle="Muestra el detalle de movimientos y saldos del producto seleccionado."
    >
      <section className={styles.MainPage}>
        <KardexFilters
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedWarehouseId={selectedWarehouseId}
          setSelectedWarehouseId={setSelectedWarehouseId}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          products={products}
          warehouses={warehouses}
          isDirectLoad={isDirectLoad}
        />

        <Divider />

        <KardexReportInfo
          kardexResponse={kardexResponse}
          kardexData={kardexData}
          selectedYear={selectedYear}
          onExportExcel={handleExportToExcel}
          onExportPDF={handleExportToPDF}
        />

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
