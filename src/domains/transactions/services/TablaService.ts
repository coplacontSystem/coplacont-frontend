import { handleApiError } from "@/shared";
import { tablaApi } from "../api/tablaApi";
import type { TablaResponse, TablaDetalleResponse } from "./types";

/**
 * Servicio de tablas maestras
 * Maneja todas las operaciones relacionadas con las tablas maestras y sus detalles
 */
export class TablaService {
  /**
   * Obtiene todas las tablas maestras
   * @returns Promise con la lista de tablas
   */
  static async getAllTablas(): Promise<TablaResponse[]> {
    try {
      const response = await tablaApi.getAllTablas();
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene una tabla por su número
   * @param numeroTabla - Número de la tabla
   * @returns Promise con los datos de la tabla
   */
  static async getTablaByNumber(numeroTabla: number): Promise<TablaResponse> {
    try {
      const response = await tablaApi.getTablaByNumber(numeroTabla);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene los detalles de una tabla por su número
   * @param numeroTabla - Número de la tabla
   * @returns Promise con la lista de detalles
   */
  static async getTablaDetalles(numeroTabla: number): Promise<TablaDetalleResponse[]> {
    try {
      const response = await tablaApi.getTablaDetalles(numeroTabla);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene un detalle específico por código y número de tabla
   * @param numeroTabla - Número de la tabla
   * @param codigo - Código del detalle
   * @returns Promise con el detalle específico
   */
  static async getTablaDetalleByCode(numeroTabla: number, codigo: string): Promise<TablaDetalleResponse> {
    try {
      const response = await tablaApi.getTablaDetalleByCode(numeroTabla, codigo);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene los tipos de comprobante (tabla 10)
   * @returns Promise con la lista de tipos de comprobante
   */
  static async getTiposComprobante(): Promise<TablaDetalleResponse[]> {
    return this.getTablaDetalles(10);
  }

  /**
   * Obtiene los tipos de operación (tabla 12)
   * @returns Promise con la lista de tipos de operación
   */
  static async getTiposOperacion(): Promise<TablaDetalleResponse[]> {
    return this.getTablaDetalles(12);
  }

  /**
   * Obtiene los detalles de tablas por sus IDs
   * @param ids - Coma separada lista de IDs
   * @returns Promise con la lista de detalles
   */
  static async getTablasByIds(ids: string): Promise<TablaDetalleResponse[]> {
    try {
      const response = await tablaApi.getTablasByIds(ids);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}