import type { Category } from './ICategory';

/**
 * Interface para un producto
 */
export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  codigo: string;
  precio: string;
  tipo: 'producto' | 'servicio';
  stockMinimo: number;
  estado: boolean;
  categoria: Category;
  /** Código de producto SUNAT (CCNU) */
  codigoSunat: string | null;
  /** Tabla 5 SUNAT */
  tipoExistencia: string | null;
  /** Tabla 6 SUNAT (UN/ECE) */
  codigoUnidad: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/**
 * Interface para crear un producto
 */
export interface CreateProductPayload {
  nombre: string;
  tipo: 'producto' | 'servicio';
  descripcion?: string;
  unidadMedida: string;
  estado: boolean;
  categoriaId: number;
  codigoSunat?: string | null;
  tipoExistencia?: string | null;
  codigoUnidad?: string | null;
}

/**
 * Interface para actualizar un producto
 */
export interface UpdateProductPayload {
  descripcion?: string;
  unidadMedida?: string;
  codigo?: string;
  precio?: string;
  tipo?: 'producto' | 'servicio';
  stockMinimo?: number;
  estado?: boolean;
  categoriaId?: number;
  codigoSunat?: string | null;
  tipoExistencia?: string | null;
  codigoUnidad?: string | null;
}
