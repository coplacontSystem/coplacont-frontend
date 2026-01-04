import React from "react";
import { Button, ComboBox, Text } from "@/components";
import styles from "../MainPage.module.scss";
import type { Product, Warehouse } from "@/domains/maintainers/types";

interface KardexFiltersProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  products: Product[];
  warehouses: Warehouse[];
  isDirectLoad: boolean;
  onFilter: () => void;
}

export const KardexFilters: React.FC<KardexFiltersProps> = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedWarehouseId,
  setSelectedWarehouseId,
  selectedProductId,
  setSelectedProductId,
  products,
  warehouses,
  isDirectLoad,
  onFilter,
}) => {
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

  return (
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
          <Button size="small" onClick={onFilter}>
            Filtrar
          </Button>
        </>
      )}
    </div>
  );
};
