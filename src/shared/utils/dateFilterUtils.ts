import type { ComboBoxOption } from '@/components';

/**
 * Lista completa de meses
 */
const allMonths: ComboBoxOption[] = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

/**
 * Genera las opciones de año dinámicamente
 * Desde el año de inicio hasta el año actual
 * @param startYear - Año inicial (default: 2000)
 */
export const getYearOptions = (startYear: number = 2000): ComboBoxOption[] => {
    const currentYear = new Date().getFullYear();

    return Array.from(
        { length: currentYear - startYear + 1 },
        (_, i) => startYear + i
    )
        .map(y => ({ value: String(y), label: String(y) }))
        .reverse();
};

/**
 * Genera las opciones de mes dinámicamente
 * - Si el año seleccionado es menor al actual: todos los meses
 * - Si el año seleccionado es el actual: solo hasta el mes actual
 * - Si no hay año seleccionado: todos los meses
 * @param selectedYear - Año seleccionado (opcional)
 */
export const getMonthOptions = (selectedYear?: string): ComboBoxOption[] => {
    if (!selectedYear) {
        return allMonths;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() es 0-indexed

    const yearNum = parseInt(selectedYear, 10);

    // Si el año seleccionado es menor al actual, mostrar todos los meses
    if (yearNum < currentYear) {
        return allMonths;
    }

    // Si es el año actual, mostrar solo hasta el mes actual
    if (yearNum === currentYear) {
        return allMonths.slice(0, currentMonth);
    }

    // Si es un año futuro (no debería pasar), no mostrar meses
    return [];
};

/**
 * Obtiene todos los meses disponibles
 */
export const getAllMonths = (): ComboBoxOption[] => allMonths;
