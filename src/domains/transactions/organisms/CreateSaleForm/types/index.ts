import {
  TipoVentaEnum,
  TipoProductoVentaEnum,
  TipoComprobanteEnum,
  MonedaEnum,
  UnidadMedidaEnum,
} from "../enums";

import type {
  TipoVentaType,
  TipoProductoVentaType,
  TipoComprobanteType,
  MonedaType,
  ProductoType,
  UnidadMedidaType,
} from "../enums";

/**
 * Interfaz para los items del detalle de la venta
 */
export interface DetalleVentaItem {
  id: string;
  producto: ProductoType;
  descripcion: string;
  unidadMedida: UnidadMedidaType;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  baseGravado: number;
  igv: number;
  isv: number;
  total: number;
  idInventario: number;
}

// Agregar estado para el tipo de cambio como string
export interface CreateSaleFormState {
  correlativo: string;
  cliente: string | "";
  tipoVenta: TipoVentaType | "";
  tipoProductoVenta: TipoProductoVentaType | "";
  tipoComprobante: TipoComprobanteType | "";
  fechaEmision: string;
  moneda: MonedaType | "";
  tipoCambio: string;
  serie: string;
  numero: string;
  fechaVencimiento: string;
  idComprobanteAfecto?: string;
}


const tipoVentaOptions = [
  { value: TipoVentaEnum.CONTADO, label: "Contado" },
  { value: TipoVentaEnum.CREDITO, label: "Crédito" },
];

const tipoProductoVentaOptions = [
  { value: TipoProductoVentaEnum.MERCADERIA, label: "Mercadería" },
  //{ value: TipoProductoVentaEnum.SERVICIOS, label: "Servicios" },
];

const tipoComprobanteOptions = [
  { value: TipoComprobanteEnum.FACTURA, label: "Factura" },
  { value: TipoComprobanteEnum.BOLETA, label: "Boleta" },
  { value: TipoComprobanteEnum.NOTA_SALIDA, label: "Nota de Salida" },
  //{ value: TipoComprobanteEnum.NOTA_CREDITO, label: "Nota de Crédito" },
  //{ value: TipoComprobanteEnum.NOTA_DEBITO, label: "Nota de Débito" },
];

const monedaOptions = [
  { value: MonedaEnum.SOL, label: "Sol" },
 // { value: MonedaEnum.DOLAR, label: "Dólar" },
];

const unidadMedidaOptions = [
  { value: UnidadMedidaEnum.UNIDAD, label: "Unidad" },
  { value: UnidadMedidaEnum.KILOGRAMO, label: "Kilogramo" },
  { value: UnidadMedidaEnum.METRO, label: "Metro" },
  { value: UnidadMedidaEnum.LITRO, label: "Litro" },
  { value: UnidadMedidaEnum.CAJA, label: "Caja" },
];

export { tipoVentaOptions, tipoProductoVentaOptions, tipoComprobanteOptions, monedaOptions, unidadMedidaOptions }
