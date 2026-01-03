import type { Product, Warehouse } from "@/domains/maintainers/types";

/**
 * Interface para un lote de inventario
 */
export interface Lote {
  id: string;
  numero: string;
  fechaVencimiento?: string;
  cantidad: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/**
 * Interface para un item de inventario
 */
export interface InventoryItem {
  id: string;
  stockActual: string;
  almacen: Warehouse;
  producto: Product;
  fechaCreacion: string;
  fechaActualizacion: string;
  lotes: Lote[];
}

/**
 * Interface para la respuesta de inventario
 */
export interface InventoryResponse {
  success: boolean;
  message: string;
  data: InventoryItem[];
}

/**
 * Interface para un movimiento de kardex
 */
export interface KardexDetalleSalida {
  id: number;
  idLote: number;
  costoUnitarioDeLote: number;
  cantidad: number;
  costoTotalDeLote: number;
}

export interface KardexMovement {
  fecha: string;
  tipo: string;
  tOperacion: string;
  tComprob: string;
  nComprobante: string;
  cantidad: number;
  saldo: number;
  costoUnitario: number;
  costoTotal: number;
  detallesSalida?: KardexDetalleSalida[];
}

/**
 * Interface para la respuesta completa del kardex
 */
export interface KardexResponse {
  producto: string;
  almacen: string;
  movimientos: KardexMovement[];
  cantidadActual: string;
  saldoActual: string;
  costoFinal: string;
  inventarioInicialCantidad: string;
  inventarioInicialCostoTotal: string;
}

export interface InitialInventoryResponse {
  lote: {
    id: number;
    fechaIngreso: string;
    cantidadInicial: number;
    costoUnitario: number;
  } | null;
  movimiento: {
    id: number;
    fecha: string;
    numeroDocumento: string;
  } | null;
  detalle: {
    id: number;
    cantidad: number;
  } | null;
}
