import { useCallback, useState } from 'react';
import {
  descargarReporte,
  type FiltrosReporte,
  type FormatoReporte,
} from '../utils/reportes';

/**
 * Estado de descarga de un reporte del backend para los botones "Exportar".
 * `descargando` indica el formato en curso (para deshabilitar o mostrar carga).
 */
export const useDescargarReporte = (clave: string) => {
  const [descargando, setDescargando] = useState<FormatoReporte | null>(null);
  const [error, setError] = useState<string | null>(null);

  const descargar = useCallback(
    async (formato: FormatoReporte, filtros: FiltrosReporte = {}) => {
      setDescargando(formato);
      setError(null);
      try {
        await descargarReporte(clave, formato, filtros);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo generar el reporte');
      } finally {
        setDescargando(null);
      }
    },
    [clave],
  );

  return { descargar, descargando, error };
};
