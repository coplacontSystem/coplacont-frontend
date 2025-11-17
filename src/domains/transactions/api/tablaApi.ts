import { apiClient } from "../../../shared/services/apiService";

export const TABLA_ENDPOINTS = {
    GET_ALL_TABLAS: '/tablas',
    GET_TABLA_BY_NUMBER: '/tablas',
    GET_TABLA_DETALLES: '/tablas',
    GET_TABLA_DETALLE_BY_CODE: '/tablas',
} as const;

export const tablaApi = {
    getAllTablas: () => apiClient.get(TABLA_ENDPOINTS.GET_ALL_TABLAS),
    getTablaByNumber: (numeroTabla: number) => apiClient.get(`${TABLA_ENDPOINTS.GET_TABLA_BY_NUMBER}/${numeroTabla}`),
    getTablaDetalles: (numeroTabla: number) => apiClient.get(`${TABLA_ENDPOINTS.GET_TABLA_DETALLES}/${numeroTabla}/detalles`),
    getTablaDetalleByCode: (numeroTabla: number, codigo: string) => apiClient.get(`${TABLA_ENDPOINTS.GET_TABLA_DETALLE_BY_CODE}/${numeroTabla}/detalles/${codigo}`),
    getTablasByIds: (ids: string) => apiClient.get(`${TABLA_ENDPOINTS.GET_TABLA_DETALLES}/detalles/by-ids?ids=${ids}`),
} as const;

export type TablaApi = typeof tablaApi;