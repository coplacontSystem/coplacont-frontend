import React from "react";
import { Text, Button } from "@/components";
import styles from "../MainPage.module.scss";
import type { KardexMovement } from "@/domains/inventory/services/types";

interface KardexReportInfoProps {
  kardexResponse: {
    producto?: string;
    almacen?: string;
  } | null;
  kardexData: KardexMovement[];
  selectedYear: string;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const KardexReportInfo: React.FC<KardexReportInfoProps> = ({
  kardexResponse,
  kardexData,
  selectedYear,
  onExportExcel,
  onExportPDF,
}) => {
  if (!kardexData.length || !kardexResponse) {
    return null;
  }

  return (
    <div className={styles.MainPage__ReportInfo}>
      <div>
        <Text size="sm" color="neutral-primary">
          Reporte para: {kardexResponse.producto} - {kardexResponse.almacen} -
          Año {selectedYear}
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
          onClick={onExportExcel}
          disabled={!kardexData || kardexData.length === 0}
        >
          Exportar como Excel
        </Button>

        <Button
          size="small"
          variant="primary"
          onClick={onExportPDF}
          disabled={!kardexData || kardexData.length === 0}
        >
          Exportar como PDF
        </Button>
      </div>
    </div>
  );
};
