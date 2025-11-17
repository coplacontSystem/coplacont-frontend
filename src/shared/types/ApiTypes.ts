/**
 * Tipos para las respuestas de la API
 */
export interface IApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Tipos para los errores de la API
 */
export interface IApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
  fechaEmision?: string;
  periodo?: { inicio: string; fin: string };
}
