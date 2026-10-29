import { downloadFile } from './downloadUtils';

/**
 * Descarga de reportes generados en el backend (GET /api/reportes/:clave).
 * El backend arma el archivo (XLSX, CSV o PDF) con los mismos datos que muestra
 * la pantalla; aquí solo se pide y se guarda.
 */

export type FormatoReporte = 'xlsx' | 'csv' | 'pdf';

export type FiltrosReporte = Record<string, string | number | boolean | undefined | null>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/** Nombre del archivo desde Content-Disposition (o uno por defecto). */
function nombreDeArchivo(cabecera: string | null, porDefecto: string): string {
  const coincidencia = cabecera?.match(/filename="?([^";]+)"?/i);
  return coincidencia?.[1] ?? porDefecto;
}

/** Mensaje legible de una respuesta de error del backend. */
async function mensajeDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo = await respuesta.json();
    const mensaje = cuerpo?.message;
    if (Array.isArray(mensaje)) return mensaje.join('. ');
    if (typeof mensaje === 'string') return mensaje;
  } catch {
    // Respuesta sin JSON
  }
  return `No se pudo generar el reporte (error ${respuesta.status})`;
}

/**
 * Genera el reporte `clave` en el backend y lo descarga.
 * Lanza un Error con el mensaje del backend si falla.
 */
export async function descargarReporte(
  clave: string,
  formato: FormatoReporte,
  filtros: FiltrosReporte = {},
): Promise<void> {
  const parametros = new URLSearchParams({ formato });
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      parametros.set(nombre, String(valor));
    }
  }

  const token = localStorage.getItem('jwt');
  const respuesta = await fetch(
    `${API_BASE_URL}/reportes/${encodeURIComponent(clave)}?${parametros}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!respuesta.ok) {
    throw new Error(await mensajeDeError(respuesta));
  }

  downloadFile(
    await respuesta.blob(),
    nombreDeArchivo(respuesta.headers.get('Content-Disposition'), `${clave}.${formato}`),
  );
}

/**
 * Descarga un archivo de cualquier ruta del backend (p. ej. el TXT del PLE)
 * con el nombre que indica el servidor.
 */
export async function descargarArchivo(
  ruta: string,
  parametros: FiltrosReporte,
  porDefecto: string,
): Promise<void> {
  const query = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(nombre, String(valor));
  }
  const token = localStorage.getItem('jwt');
  const respuesta = await fetch(`${API_BASE_URL}${ruta}?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!respuesta.ok) throw new Error(await mensajeDeError(respuesta));
  downloadFile(
    await respuesta.blob(),
    nombreDeArchivo(respuesta.headers.get('Content-Disposition'), porDefecto),
  );
}
