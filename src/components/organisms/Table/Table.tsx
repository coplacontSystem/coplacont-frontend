import React from "react";
import styles from "./Table.module.scss";
import { EmptyState } from "@/components/molecules/EmptyState";

export type TableRow = {
  id: number | string;
  cells: React.ReactNode[];
};

export interface TableProps {
  headers: React.ReactNode[];
  rows: TableRow[];
  gridTemplate?: string; // CSS grid-template-columns string
  className?: string;
  ariaLabel?: string;
  isLoading?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const Table: React.FC<TableProps> = ({
  headers,
  rows,
  gridTemplate,
  className,
  ariaLabel = "Tabla",
  isLoading = false,
  loadingText,
  emptyTitle,
  emptySubtitle,
}) => {
  if (isLoading) {
    return <EmptyState variant="loading" title={loadingText} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState variant="empty" title={emptyTitle} subtitle={emptySubtitle} />
    );
  }

  const styleProps:
    | (React.CSSProperties & { ["--grid-template"]?: string })
    | undefined = gridTemplate
    ? { ["--grid-template"]: gridTemplate }
    : undefined;

  return (
    <section className={`${styles.tableWrapper} ${className ?? ""}`.trim()}>
      <div className={styles.scrollableContent}>
        <div
          className={styles.table}
          role="table"
          aria-label={ariaLabel}
          style={styleProps}
        >
          <div className={`${styles.row} ${styles.header}`} role="row">
            {headers.map((h, i) => (
              <div
                key={i}
                className={`${styles.cell} ${styles.headerCell}`}
                role="columnheader"
              >
                {h}
              </div>
            ))}
          </div>

          {rows.map((r) => (
            <div key={r.id} className={styles.row} role="row">
              {r.cells.map((c, i) => (
                <div key={i} className={styles.cell} role="cell">
                  {c}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Table;
