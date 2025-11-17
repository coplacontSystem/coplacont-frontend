import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { IApiError } from '@/shared';

/**
 * Configuración base para las peticiones HTTP
 */
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
};

// Configuración de API inicializada

/**
 * Instancia de axios configurada para el proyecto
 */
export const apiClient: AxiosInstance = axios.create(API_CONFIG);

/**
 * Interceptor para agregar el token JWT a las peticiones
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar respuestas y errores globalmente
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar todos los datos de autenticación
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      localStorage.removeItem('persona');
      localStorage.removeItem('roles');
      
      // Limpiar también datos duplicados
      const duplicateKeys = ['_token', 'auth_user', 'token', 'authToken'];
      duplicateKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
   }
 );

/**
 * Función helper para manejar errores de la API
 */
export const handleApiError = (error: unknown): IApiError => {
  // Type guard para verificar si es un error de axios
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { data?: { message?: string; errors?: Record<string, string[]>; fechaEmision?: string; periodo?: { inicio: string; fin: string } }; status: number } };
    return {
      message: axiosError.response.data?.message || 'Error en el servidor',
      status: axiosError.response.status,
      errors: axiosError.response.data?.errors,
      fechaEmision: axiosError.response.data?.fechaEmision,
      periodo: axiosError.response.data?.periodo,
    };
  } else if (error && typeof error === 'object' && 'request' in error) {
    return {
      message: 'No se pudo conectar con el servidor',
      status: 0,
    };
  } else {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : 'Error inesperado';
    return {
      message: errorMessage,
      status: 0,
    };
  }
};