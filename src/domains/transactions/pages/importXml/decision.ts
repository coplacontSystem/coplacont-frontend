import type { CuentaElegida } from '../manualJournalEntries/CuentaSelector';
import type { ArchivoPrevio, LineaPrevia } from './importacionApi';

/** A dónde va una línea: un producto (existente o nuevo) o un gasto/ingreso */
export interface Destino {
  tipo: 'producto' | 'servicio';
  modo: 'existente' | 'nuevo';
  idProducto: number | null;
  nombre: string;
  idCategoria: number | null;
  unidad: string;
  cuenta: CuentaElegida | null;
  idArea: number | null;
  /** Del XML, para el producto nuevo: código SUNAT (CCNU) y unidad UN/ECE */
  codigoSunat?: string | null;
  codigoUnidad?: string | null;
}

/** Línea del XML: su destino, el factor y de dónde salió la sugerencia */
export interface Decision extends Destino {
  factor: string;
  origen: string | null;
  /** Las sugerencias por nombre parecido se confirman a mano */
  confirmada: boolean;
}

/** Línea escrita a mano (el TXT no trae detalle) */
export interface LineaEscrita extends Destino {
  clave: number;
  cantidad: string;
  valor: string;
  afectacion: '10' | '20' | '30';
}

export const TIPO: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota de crédito',
  '08': 'Nota de débito',
};

export const AFECTACION: Record<LineaEscrita['afectacion'], string> = {
  '10': 'Gravado',
  '20': 'Exonerado',
  '30': 'Inafecto',
};

const UNIDAD: Record<string, string> = {
  NIU: 'unidad',
  KGM: 'kg',
  GRM: 'gramo',
  BX: 'caja',
  PK: 'paquete',
  DZN: 'docena',
  LTR: 'litro',
  GLL: 'galón',
  MTR: 'metro',
  TNE: 'tonelada',
};

export const ORIGEN: Record<string, string> = {
  equivalencia: 'Recordado',
  codigo: 'Por código',
  gtin: 'Por código de barras',
  nombre: 'Nombre parecido: confírmalo',
  ccnu: 'Mismo código SUNAT: confírmalo',
  plantilla: 'Cuenta de la plantilla',
};

/** Identifica un comprobante de la cola: archivo + fila del TXT */
export const claveItem = (a: Pick<ArchivoPrevio, 'nombre' | 'indice'>) => `${a.nombre}#${a.indice}`;

/** Las decisiones de líneas XML se comparten por emisor y artículo */
export const claveDecision = (a: ArchivoPrevio, l: LineaPrevia) =>
  `${a.documento?.emisor.numeroDocumento}|${l.clave}`;

export const destinoVacio = (nombre = '', tipo: Destino['tipo'] = 'producto'): Destino => ({
  tipo,
  modo: 'existente',
  idProducto: null,
  nombre,
  idCategoria: null,
  unidad: 'unidad',
  cuenta: null,
  idArea: null,
});

export function decisionInicial(l: LineaPrevia): Decision {
  const d: Decision = {
    ...destinoVacio(l.descripcion.slice(0, 255), l.unidad === 'ZZ' ? 'servicio' : 'producto'),
    unidad: UNIDAD[l.unidad] ?? 'unidad',
    codigoSunat: l.codigoSunat,
    codigoUnidad: l.unidad,
    factor: '1',
    origen: null,
    confirmada: true,
  };
  const s = l.sugerencia;
  if (s?.tipo === 'producto') {
    return { ...d, tipo: 'producto', idProducto: s.idProducto, factor: String(s.factor), origen: s.origen, confirmada: s.segura };
  }
  if (s?.tipo === 'servicio') {
    return { ...d, tipo: 'servicio', cuenta: { codigo: s.codigoCuenta, nombre: '' }, idArea: s.idArea, origen: s.origen };
  }
  return d;
}

/** Qué le falta al destino ('' si está completo) */
export function faltaDestino(d: Destino): string {
  if (d.tipo === 'servicio') return d.cuenta ? '' : 'Elige la cuenta';
  if (d.modo === 'nuevo') {
    if (d.nombre.trim().length < 3) return 'Nombre del producto';
    return d.idCategoria ? '' : 'Elige la categoría';
  }
  return d.idProducto ? '' : 'Elige el producto';
}

export function pendiente(d: Decision | undefined): string {
  if (!d) return 'Decide qué es';
  if (d.tipo === 'producto' && !(Number(d.factor) > 0)) return 'Factor inválido';
  return faltaDestino(d) || (d.tipo === 'producto' && !d.confirmada ? 'Confirma la sugerencia' : '');
}

export function faltaLinea(l: LineaEscrita): string {
  if (!(Number(l.cantidad) > 0)) return 'Cantidad';
  if (l.valor === '' || !(Number(l.valor) >= 0)) return 'Importe';
  return faltaDestino(l);
}

/** Parte que va al servidor: producto o cuenta, sin estado de pantalla */
export function destinoPayload(d: Destino) {
  if (d.tipo === 'servicio') {
    return { tipo: 'servicio' as const, codigoCuenta: d.cuenta!.codigo, idArea: d.idArea ?? undefined };
  }
  return d.modo === 'nuevo'
    ? {
        tipo: 'producto' as const,
        nuevoProducto: {
          nombre: d.nombre.trim(),
          idCategoria: d.idCategoria!,
          unidadMedida: d.unidad,
          codigoSunat: d.codigoSunat ?? undefined,
          codigoUnidad: d.codigoUnidad ?? undefined,
        },
      }
    : { tipo: 'producto' as const, idProducto: d.idProducto! };
}

export const numero = (v: string) => v.replace(',', '.').replace(/[^\d.]/g, '');

/** Unidad en que se cuenta el producto del destino */
export const unidadDestino = (d: Destino, productos: { id: number; unidadMedida: string }[]) =>
  d.modo === 'nuevo' ? d.unidad : (productos.find((p) => p.id === d.idProducto)?.unidadMedida ?? 'und.');

const centimos = (v: string) => Math.round((Number(v) || 0) * 100);

/** Bases del comprobante que deben cuadrar con las líneas escritas */
export function cuadreManual(
  lineas: LineaEscrita[],
  totales: { gravada: number; exonerada: number; inafecta: number },
) {
  const suma = (a: LineaEscrita['afectacion']) =>
    lineas.filter((l) => l.afectacion === a).reduce((s, l) => s + centimos(l.valor), 0);
  return (
    [
      ['10', suma('10'), Math.round(totales.gravada * 100)],
      ['20', suma('20'), Math.round(totales.exonerada * 100)],
      ['30', suma('30'), Math.round(totales.inafecta * 100)],
    ] as const
  )
    .filter(([, tiene, debe]) => tiene || debe)
    .map(([afectacion, tiene, debe]) => ({ afectacion, tiene, debe, ok: Math.abs(tiene - debe) <= 5 }));
}

let siguiente = 1;
export const nuevaClave = () => siguiente++;

/** Una línea por cada base del comprobante, para empezar */
export function lineasIniciales(totales: { gravada: number; exonerada: number; inafecta: number }): LineaEscrita[] {
  const bases = [
    ['10', totales.gravada],
    ['20', totales.exonerada],
    ['30', totales.inafecta],
  ] as const;
  return bases
    .filter(([, v]) => v > 0)
    .map(([afectacion, v]) => ({
      ...destinoVacio(),
      clave: nuevaClave(),
      cantidad: '1',
      valor: v.toFixed(2),
      afectacion,
    }));
}

