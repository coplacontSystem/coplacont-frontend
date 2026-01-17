import { getMonthOptions, getYearOptions } from "@/shared";

export const filterTypeOptions = [
    { value: "mes-anio", label: "Mes/Año" },
    { value: "rango-fechas", label: "Rango de Fechas" },
];

export const operationTypeOptions = [
    { value: "", label: "Todos los tipos" },
    { value: "entrada", label: "Entrada" },
    { value: "salida", label: "Salida" },
    { value: "transferencia", label: "Transferencia" },
];

// Re-exportar funciones de shared para compatibilidad
export { getYearOptions, getMonthOptions };