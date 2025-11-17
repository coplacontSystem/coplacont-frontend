import React from 'react';
import styles from './Table.module.scss';
import { Text } from '@/components/atoms';
import { NoDataIcon } from '@/components/atoms';

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
}

export const Table: React.FC<TableProps> = ({ headers, rows, gridTemplate, className, ariaLabel = 'Tabla' }) => {
  if (rows.length === 0) {
    return <EmptyState />;
  }

  const styleProps: (React.CSSProperties & { ['--grid-template']?: string }) | undefined =
    gridTemplate ? { ['--grid-template']: gridTemplate } : undefined;

  return (
    <section className={`${styles.tableWrapper} ${className ?? ''}`.trim()}>
      <div className={styles.scrollableContent}>
        <div
          className={styles.table}
          role="table"
          aria-label={ariaLabel}
          style={styleProps}
        >
          <div className={`${styles.row} ${styles.header}`} role="row">
            {headers.map((h, i) => (
              <div key={i} className={`${styles.cell} ${styles.headerCell}`} role="columnheader">
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

/**
 * Component to show when there are no categories
 */
export const EmptyState: React.FC = () => {
  const title = "Sin datos"
  const subtitle = "No se encontraron registros para mostrar"

  return (

    <section className={styles.tableWrapper}>
    <div className={styles.emptyState}>
      <div className={styles.emptyState__icon}>
        <NoDataIcon />
      </div>
      <Text
        size="xl" 
        color="info" 
        weight={500}
        className={styles.emptyState__title}
      >
        {title}
      </Text>
      <Text
        size="md" 
        color="info"
        className={styles.emptyState__subtitle}
      >
        {subtitle}
      </Text>
    </div>
    </section>
  );
};