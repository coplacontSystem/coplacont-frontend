import { apiSlice } from '@/store/api/apiSlice';
import type { TablaResponse, TablaDetalleResponse } from '../services/types';

export const TABLA_ENDPOINTS = {
    GET_ALL_TABLAS: '/tablas',
    GET_TABLA_BY_NUMBER: '/tablas',
    GET_TABLA_DETALLES: '/tablas',
    GET_TABLA_DETALLE_BY_CODE: '/tablas',
} as const;

export const tablaRtkApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllTablas: builder.query<TablaResponse[], void>({
            query: () => '/tablas',
            providesTags: [{ type: 'Tablas', id: 'LIST' }],
        }),

        getTablaByNumber: builder.query<TablaResponse, number>({
            query: (numeroTabla) => `/tablas/${numeroTabla}`,
            providesTags: (_result, _error, numeroTabla) => [{ type: 'Tablas', id: numeroTabla }],
        }),

        getTablaDetalles: builder.query<TablaDetalleResponse[], number>({
            query: (numeroTabla) => `/tablas/${numeroTabla}/detalles`,
            providesTags: (_result, _error, numeroTabla) => [{ type: 'Tablas', id: `detalles-${numeroTabla}` }],
        }),

        getTablaDetalleByCode: builder.query<TablaDetalleResponse, { numeroTabla: number; codigo: string }>({
            query: ({ numeroTabla, codigo }) => `/tablas/${numeroTabla}/detalles/${codigo}`,
        }),

        getTablasByIds: builder.query<TablaDetalleResponse[], string>({
            query: (ids) => `/tablas/detalles/by-ids?ids=${ids}`,
        }),
    }),
});

export const {
    useGetAllTablasQuery,
    useGetTablaByNumberQuery,
    useGetTablaDetallesQuery,
    useGetTablaDetalleByCodeQuery,
    useGetTablasByIdsQuery,
} = tablaRtkApi;

export const tablaApi = {
    getAllTablas: tablaRtkApi.endpoints.getAllTablas,
    getTablaByNumber: tablaRtkApi.endpoints.getTablaByNumber,
    getTablaDetalles: tablaRtkApi.endpoints.getTablaDetalles,
    getTablaDetalleByCode: tablaRtkApi.endpoints.getTablaDetalleByCode,
    getTablasByIds: tablaRtkApi.endpoints.getTablasByIds,
} as const;

export type TablaApi = typeof tablaApi;