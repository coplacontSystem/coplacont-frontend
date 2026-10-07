import { createContext, useContext } from 'react';
import type { Metodo } from './configuracionApi';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export const NOMBRE_METODO: Record<Metodo, string> = { promedio: 'Promedio ponderado', fifo: 'FIFO' };
export const METODOS: { id: Metodo; label: string; desc: string }[] = [
  {
    id: 'promedio',
    label: 'Promedio ponderado',
    desc: 'Cada compra recalcula un costo unitario promedio para todo el stock del producto.',
  },
  {
    id: 'fifo',
    label: 'FIFO (PEPS)',
    desc: 'Lo primero que entra es lo primero que sale: cada lote conserva su costo de compra.',
  },
];

/* ---------- Imágenes ---------- */

export const MAX_IMAGEN = 2 * 1024 * 1024;
export const mb = (b: number) => (b / 1048576).toFixed(1).replace('.', ',') + ' MB';

/** Valida tipo y peso; devuelve el error o la imagen como data URL */
export function leerImagen(f: File): Promise<{ error: string } | { url: string }> {
  if (!/^image\/(png|jpeg)$/.test(f.type)) {
    return Promise.resolve({ error: 'Formato no admitido. Sube una imagen JPG o PNG.' });
  }
  if (f.size > MAX_IMAGEN) {
    return Promise.resolve({ error: `La imagen pesa ${mb(f.size)}. El máximo es 2 MB.` });
  }
  return new Promise((resolve) => {
    const rd = new FileReader();
    rd.onload = () => resolve({ url: String(rd.result) });
    rd.onerror = () => resolve({ error: 'No se pudo leer la imagen.' });
    rd.readAsDataURL(f);
  });
}

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Reduce el logo para que viaje liviano (máx. 800×400, conserva PNG) */
export async function reducirLogo(url: string): Promise<string> {
  const img = await cargarImagen(url);
  const k = Math.min(1, 800 / img.naturalWidth, 400 / img.naturalHeight);
  if (k === 1) return url;
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * k);
  cv.height = Math.round(img.naturalHeight * k);
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
  return url.startsWith('data:image/png') ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.9);
}

/** Iniciales: "Comercial Andina S.A.C." → "CA" */
export const iniciales = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => w.length > 2 && /^[A-ZÁÉÍÓÚÑ]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const pad = (n: number) => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' o ISO → 'dd/mm/yyyy' */
export function fecha(iso: string): string {
  if (iso.length > 10) {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
export const soles = (n: number) =>
  'S/ ' +
  Math.abs(n)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
