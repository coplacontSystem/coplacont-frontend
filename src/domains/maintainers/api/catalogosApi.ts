import { apiSlice } from '@/store/api/apiSlice';

export interface CodigoCcnu {
  codigo: string;
  nombre: string;
  nivel: number;
  codigoPadre: string | null;
}

export interface CodigoSunat {
  codigo: string;
  nombre: string;
}

/** Catálogos de SUNAT: CCNU (código de producto), Tabla 5 y Tabla 6 */
export const catalogosApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    buscarCcnu: builder.query<CodigoCcnu[], string>({
      query: (q) => ({ url: '/catalogos/ccnu', params: { q } }),
      keepUnusedDataFor: 300,
    }),
    getCodigoCcnu: builder.query<CodigoCcnu & { ruta: CodigoCcnu[] }, string>({
      query: (codigo) => `/catalogos/ccnu/${codigo}`,
      keepUnusedDataFor: 3600,
    }),
    getTiposExistencia: builder.query<CodigoSunat[], void>({
      query: () => '/catalogos/tipos-existencia',
      keepUnusedDataFor: 3600,
    }),
    getUnidadesSunat: builder.query<(CodigoSunat & { corto: string })[], void>({
      query: () => '/catalogos/unidades',
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useBuscarCcnuQuery,
  useGetCodigoCcnuQuery,
  useGetTiposExistenciaQuery,
  useGetUnidadesSunatQuery,
} = catalogosApi;
