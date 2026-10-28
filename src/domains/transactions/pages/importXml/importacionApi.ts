import { apiSlice } from '@/store/api/apiSlice';

export type Operacion = 'compra' | 'venta';
export type TipoCpe = '01' | '03' | '07' | '08';

export interface ParteCpe {
  tipoDocumento: string | null;
  numeroDocumento: string;
  razonSocial: string;
  direccion: string | null;
}

export type Sugerencia =
  | {
      tipo: 'producto';
      idProducto: number;
      nombre: string;
      codigo: string | null;
      unidadMedida: string;
      factor: number;
      origen: 'equivalencia' | 'codigo' | 'gtin' | 'nombre';
      segura: boolean;
    }
  | {
      tipo: 'servicio';
      codigoCuenta: string;
      idArea: number | null;
      origen: 'equivalencia';
      segura: true;
    };

export interface LineaPrevia {
  orden: number;
  cantidad: number;
  unidad: string;
  descripcion: string;
  codigoVendedor: string | null;
  codigoGtin: string | null;
  valorUnitario: number;
  subtotal: number;
  igv: number;
  isc: number;
  gratuita: boolean;
  afectacionIgv: string | null;
  clave: string;
  sugerencia: Sugerencia | null;
}

export interface ArchivoPrevio {
  nombre: string;
  /** Fila del TXT; 0 en un XML */
  indice: number;
  origen: 'xml' | 'txt';
  /** El archivo trae el detalle (XML); si no, se escribe o se registra sin él */
  conDetalle: boolean;
  valido: boolean;
  errores: string[];
  avisos: string[];
  operacion: Operacion | null;
  documento: {
    tipoComprobante: TipoCpe;
    serie: string;
    numero: string;
    fechaEmision: string;
    fechaVencimiento: string | null;
    moneda: string;
    emisor: ParteCpe;
    receptor: ParteCpe;
    totales: {
      gravada: number;
      exonerada: number;
      inafecta: number;
      igv: number;
      isc: number;
      otrosTributos: number;
      total: number;
    };
    formaPago: 'contado' | 'credito' | null;
  } | null;
  contraparte: {
    tipoDocumento: string | null;
    numeroDocumento: string;
    razonSocial: string;
    idEntidad: number | null;
  } | null;
  afectado: { serieNumero: string; idComprobante: number | null; enEstaCarga: boolean } | null;
  tipoCambio: number | null;
  lineas: LineaPrevia[];
}

export interface ArchivoXml {
  nombre: string;
  contenido: string;
}

export interface ResolucionLinea {
  orden: number;
  tipo: 'producto' | 'servicio';
  idProducto?: number;
  nuevoProducto?: { nombre: string; idCategoria: number; unidadMedida: string; codigo?: string };
  factor?: number;
  codigoCuenta?: string;
  idArea?: number;
  recordar?: boolean;
}

export interface LineaManual {
  tipo: 'producto' | 'servicio';
  idProducto?: number;
  nuevoProducto?: { nombre: string; idCategoria: number; unidadMedida: string };
  codigoCuenta?: string;
  idArea?: number;
  descripcion?: string;
  cantidad: number;
  valor: number;
  afectacionIgv: '10' | '20' | '30';
}

export interface RegistrarItem {
  archivo: ArchivoXml;
  indice: number;
  idAlmacen?: number;
  tipoCambio?: number;
  lineas?: ResolucionLinea[];
  lineasManuales?: LineaManual[];
  sinDetalle?: boolean;
}

export interface ResultadoRegistro {
  nombre: string;
  ok: boolean;
  error?: string;
  idComprobante?: number;
  correlativo?: string;
  serieNumero?: string;
}

export interface AreaContable {
  id: number;
  nombre: string;
  cuentaDestino: string | null;
  nombreCuentaDestino: string | null;
  activa: boolean;
}

export const importacionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    previsualizarXml: builder.mutation<ArchivoPrevio[], { archivos: ArchivoXml[] }>({
      query: (body) => ({ url: '/importacion/cpe/previsualizar', method: 'POST', body }),
    }),
    registrarComprobante: builder.mutation<ResultadoRegistro, RegistrarItem>({
      query: (body) => ({ url: '/importacion/registrar-uno', method: 'POST', body }),
      invalidatesTags: [
        'Purchases',
        'Sales',
        'Transactions',
        'Products',
        'Inventory',
        'InventoryLots',
        'Kardex',
        'Entities',
        'Clients',
        'Suppliers',
      ],
    }),
    getAreasContables: builder.query<AreaContable[], void>({
      query: () => '/areas',
    }),
  }),
});

export const { usePrevisualizarXmlMutation, useRegistrarComprobanteMutation, useGetAreasContablesQuery } =
  importacionApi;

/** Contenido de un archivo en base64 (respeta la codificación original del XML) */
export async function aBase64(archivo: File): Promise<string> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}
