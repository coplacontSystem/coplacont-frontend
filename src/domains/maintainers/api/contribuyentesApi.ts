import { apiSlice } from '@/store/api/apiSlice';

/** Datos de un RUC (SUNAT) o DNI (RENIEC) devueltos por el backend */
export interface Contribuyente {
  tipo: 'RUC' | 'DNI';
  numero: string;
  encontrado: boolean;
  razonSocial?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  direccion?: string;
  estado?: string;
  condicion?: string;
  fuente: 'consulta' | 'cache' | 'sin-servicio';
  avisos: string[];
}

export const contribuyentesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    consultarContribuyente: builder.query<Contribuyente, string>({
      query: (numero) => `/contribuyentes/${numero}`,
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useLazyConsultarContribuyenteQuery } = contribuyentesApi;
