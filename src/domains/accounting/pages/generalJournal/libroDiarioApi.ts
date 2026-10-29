import { apiSlice } from '@/store/api/apiSlice';

export interface LineaDiario {
  orden: number;
  codigoCuenta: string;
  nombreCuenta: string;
  glosa: string | null;
  debe: number;
  haber: number;
}

export interface AsientoDiario {
  id: number;
  numero: number;
  fecha: string;
  glosa: string;
  referencia: string | null;
  origen: 'manual' | 'compra' | 'venta';
  lineas: LineaDiario[];
}

export interface LibroDiario {
  año: number;
  mes: number;
  asientos: AsientoDiario[];
  totalDebe: number;
  totalHaber: number;
  cuentas: { codigo: string; nombre: string }[];
}

export const libroDiarioApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getLibroDiario: b.query<LibroDiario, { año: number; mes: number }>({
      query: (params) => ({ url: '/libros/diario', params }),
      providesTags: [{ type: 'Asientos', id: 'LIST' }],
    }),
  }),
});

export const { useGetLibroDiarioQuery } = libroDiarioApi;
