import { getMonthOptions, getYearOptions } from "@/shared";

export const documentTypeOptions = [
  { value: "", label: "Todos los tipos" },
  { value: "factura", label: "Factura" },
  { value: "boleta", label: "Boleta" },
  { value: "nota_credito", label: "Nota de Crédito" },
  { value: "nota_debito", label: "Nota de Débito" },
  { value: "recibo", label: "Recibo" },
  { value: "comprobante_pago", label: "Comprobante de Pago" },
];

export const filterTypeOptions = [
  { value: "mes-anio", label: "Mes y Año" },
  { value: "rango-fechas", label: "Rango de Fechas" },
];

export const monthOptions = getMonthOptions();
export const yearOptions = getYearOptions();

