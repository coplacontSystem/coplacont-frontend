import type { Entidad } from "@/domains/maintainers/services";

export interface SaleDetail {
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  descripcion: string;
}

export interface RegisterSalePayload {
  correlativo: string;
  idPersona: number;
  idTipoOperacion: number;
  idTipoComprobante: number;
  fechaEmision: string;
  moneda: string;
  tipoCambio: number;
  serie: string;
  numero: string;
  fechaVencimiento?: string; // Opcional
  detalles: SaleDetail[];
}

export interface RegisterPurchasePayload {
  correlativo: string;
  idPersona: number;
  idTipoOperacion: number;
  idTipoComprobante: number;
  fechaEmision: string;
  moneda: string;
  tipoCambio: number;
  serie: string;
  numero: string;
  fechaVencimiento?: string;
  idComprobanteAfecto?: number;
  detalles: SaleDetail[];
}

export interface RegisterOperationPayload {
  correlativo: string;
  idPersona: number;
  idTipoOperacion: number;
  idTipoComprobante: number;
  fechaEmision: string;
  moneda: string;
  tipoCambio: number;
  serie: string;
  numero: string;
  fechaVencimiento?: string; // Opcional
  total: number;
  descripcion: string;
}

export interface TransactionTotals {
  idTotal: number;
  totalGravada: string;
  totalExonerada: string;
  totalInafecta: string;
  totalIgv: string;
  totalIsc: string;
  totalGeneral: string;
}

export interface Transaction {
  idComprobante: number;
  correlativo: string;
  // Tipo de operación devuelto por el backend como objeto de tabla detalle
  tipoOperacion: TablaDetalleResponse;
  // Tipo de comprobante devuelto como objeto; puede ser string en endpoints antiguos
  tipoComprobante: string | TablaDetalleResponse;
  fechaEmision: string;
  moneda: string;
  tipoCambio: string;
  serie: string;
  numero: string;
  // Puede ser null cuando no aplica
  fechaVencimiento: string | null;
  // Puede ser null si la operación no tiene totales
  totales: TransactionTotals | null;
  detalles: Detail[];
  entidad: Entidad;
  persona: Persona;
}

export interface Persona {
  id: number;
  razonSocial: string;
  telefono: string;
  direccion: string;
}

export interface Detail{
  cantidad: string;
  descripcion: string;
  idDetalle: number;
  igv: string;
  isc: string;
  precioUnitario: string;
  total: string;
  subtotal: string;
  unidadMedida: string;
}

export interface SalesApiResponse {
  success: boolean;
  message: string;
  data: Transaction[];
}

export interface PurchasesApiResponse {
  success: boolean;
  message: string;
  data: Transaction[];
}

export interface TablaDetalleResponse {
  idTablaDetalle: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface TablaResponse {
  idTabla: number;
  numeroTabla: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: TablaDetalleResponse[];
}
