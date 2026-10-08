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
 loadingIcon?: React.ReactNode;
 isError?: boolean;
 errorTitle?: string;
 errorSubtitle?: string;
 emptyTitle?: string;
 emptySubtitle?: string;
 /** Alineación por columna (por defecto, izquierda). Útil para importes. */
 columnAlign?: Array<"left" | "right" | "center">;
}

export const Table: React.FC<TableProps> = ({
 headers,
 rows,
 gridTemplate,
 className,
 ariaLabel = "Tabla",
 isLoading = false,
 isError = false,
 emptyTitle,
 emptySubtitle,
 columnAlign,
}) => {
 if (isLoading) {
  return (
   <section className={`${styles.tableWrapper} ${className ?? ""}`.trim()}>
    <EmptyState variant="loading" />
   </section>
  );
 }

 if (isError) {
  return (
   <section className={`${styles.tableWrapper} ${className ?? ""}`.trim()}>
    <EmptyState variant="error" />
   </section>
  );
 }

 if (rows.length === 0) {
  return (
   <section className={`${styles.tableWrapper} ${className ?? ""}`.trim()}>
    <EmptyState
     variant="empty"
     title={emptyTitle}
     subtitle={emptySubtitle}
    />
   </section>
  );
 }

 const alignClass = (i: number) => {
  const a = columnAlign?.[i];
  return a === "right"
   ? styles.alignRight
   : a === "center"
    ? styles.alignCenter
    : "";
 };

 const renderContent = (content: React.ReactNode) =>
  typeof content === "string" || typeof content === "number" ? (
   <span className={styles.ellipsis} title={String(content)}>
    {content}
   </span>
  ) : (
   content
  );

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
        className={`${styles.cell} ${styles.headerCell} ${alignClass(i)}`.trim()}
        role="columnheader"
       >
        {renderContent(h)}
       </div>
      ))}
     </div>

     {rows.map((r) => (
      <div key={r.id} className={styles.row} role="row">
       {r.cells.map((c, i) => (
        <div
         key={i}
         className={`${styles.cell} ${alignClass(i)}`.trim()}
         role="cell"
        >
         {renderContent(c)}
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
