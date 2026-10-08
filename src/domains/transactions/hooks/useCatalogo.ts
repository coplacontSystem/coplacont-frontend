import { useMemo } from 'react';
import {
  useGetTablaDetalleByCodeQuery,
  useGetTablaDetallesQuery,
} from '../api/tablaApi';

/** Códigos SUNAT de la Tabla 12 (tipos de operación). */
export const CODIGO_OPERACION = {
  VENTA: '01',
  COMPRA: '02',
} as const;

/** Tipos de comprobante (Tabla 10) usados en compras y ventas. */
const CODIGOS_COMPROBANTE = ['01', '03', '04', '07', '08'];

/**
 * Id del tipo de operación a partir de su código. Los ids dependen del orden
 * en que se sembró el catálogo; los códigos no.
 */
export function useIdTipoOperacion(codigo: string): number | undefined {
  const { data } = useGetTablaDetalleByCodeQuery({ numeroTabla: 12, codigo });
  return data?.idTablaDetalle;
}

/** Factura, boleta, liquidación de compra y notas de crédito/débito. */
export function useTiposComprobante() {
  const { data = [] } = useGetTablaDetallesQuery(10);
  return useMemo(
    () =>
      data
        .filter((d) => CODIGOS_COMPROBANTE.includes(d.codigo))
        .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [data],
  );
}
