import React from "react";
import { Text, Button } from "@/components";
import styles from "../MainPage.module.scss";
import type { KardexMovement } from "@/domains/inventory/services/types";
import type { FormatoReporte } from "@/shared/utils/reportes";

interface KardexReportInfoProps {
  kardexResponse: {
    producto?: string;
    almacen?: string;
  } | null;
  kardexData: KardexMovement[];
  selectedYear: string;
  /** Descarga el kardex (formatos SUNAT 13.1 y 12.1) generado en el backend. */
  onExport: (formato: FormatoReporte) => void;
  /** Formato que se está generando, para deshabilitar los botones. */
  descargando: FormatoReporte | null;
  errorExportacion: string | null;
}

const FORMATOS: { formato: FormatoReporte; texto: string }[] = [
  { formato: "xlsx", texto: "Excel" },
  { formato: "pdf", texto: "PDF" },
  { formato: "csv", texto: "CSV" },
];

export const KardexReportInfo: React.FC<KardexReportInfoProps> = ({
  kardexResponse,
  kardexData,
  selectedYear,
  onExport,
  descargando,
  errorExportacion,
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

      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.25rem",
          }}
        >
          {FORMATOS.map(({ formato, texto }) => (
            <Button
              key={formato}
              size="small"
              variant="primary"
              onClick={() => onExport(formato)}
              disabled={kardexData.length === 0 || descargando !== null}
            >
              {descargando === formato ? "Generando..." : `Exportar como ${texto}`}
            </Button>
          ))}
        </div>
        {errorExportacion && (
          <Text size="xs" color="danger">
            {errorExportacion}
          </Text>
        )}
      </div>
    </div>
  );
};
