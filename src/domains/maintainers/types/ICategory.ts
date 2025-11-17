/**
 * Interface para la categoría de un producto
 */
export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'producto' | 'servicio';
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/**
 * Payload para crear una categoría
 */
export type CreateCategoryPayload = Pick<Category, 'nombre' | 'descripcion'|'tipo'> & {
  id?: number;
};

/**
 * Payload para actualizar una categoría
 */
export type UpdateCategoryPayload = Pick<Category, 'nombre' | 'descripcion'|'tipo'> & {
  estado?: boolean;
};
