import React from "react";
import styles from "./FilterBar.module.scss";
import { Button } from "@/components/atoms";

interface FilterBarProps {
  onFilter: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  className?: string;
  filterLabel?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilter,
  onClear,
  children,
  className = "",
  filterLabel = "Filtrar",
}) => {
  const childCount = React.Children.count(children);
  const totalColumns = childCount + 1;

  return (
    <div
      className={`${styles.filterBar} ${className}`}
      style={{ "--filter-cols": totalColumns } as React.CSSProperties}
    >
      {children}
      <div className={styles.filterBar__actions}>
        <Button size="small" onClick={onFilter}>
          {filterLabel}
        </Button>
        {onClear && (
          <Button size="small" variant="secondary" onClick={onClear}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
};
