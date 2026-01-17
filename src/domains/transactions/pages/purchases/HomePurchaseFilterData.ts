import type { ComboBoxOption } from '@/components';
import { getYearOptions, getMonthOptions } from '@/shared';

export const filterTypeOptions: ComboBoxOption[] = [
  { value: 'mes-anio', label: 'Mes/Año' },
  { value: 'rango-fechas', label: 'Rango de fechas' },
];

// Re-exportar funciones de shared para compatibilidad
export { getYearOptions, getMonthOptions };

export const documentTypeOptions: ComboBoxOption[] = [
  { value: 'factura', label: 'Factura' },
  { value: 'boleta', label: 'Boleta' },
  //{ value: 'nota-credito', label: 'Nota de crédito' },
  //{ value: 'nota-debito', label: 'Nota de débito' },
];

export const sunatStatusOptions: ComboBoxOption[] = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'rechazado', label: 'Rechazado' },
];