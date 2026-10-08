const H = 60;
const D = 1440;

/** Minutos desde una fecha ISO */
export const minutosDesde = (iso: string | null | undefined) =>
  iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : null;

/** "hace 2 h", "hace 12 días", "Nunca" */
export function relativo(iso: string | null | undefined): string {
  const m = minutosDesde(iso);
  if (m == null) return 'Nunca';
  if (m < 1) return 'ahora';
  if (m < H) return `hace ${m} min`;
  if (m < D) return `hace ${Math.round(m / H)} h`;
  const d = Math.round(m / D);
  if (d < 60) return d === 1 ? 'hace 1 día' : `hace ${d} días`;
  return `hace ${Math.round(d / 30)} meses`;
}

export const diasDesde = (iso: string | null | undefined) => {
  const m = minutosDesde(iso);
  return m == null ? null : Math.floor(m / D);
};

/** "Rosa Quispe Mamani" → "Rosa Quispe" */
export const dosPalabras = (s: string) => s.split(' ').slice(0, 2).join(' ');

/** Quita la forma societaria: "Bodega Don Lucho E.I.R.L." → "Bodega Don Lucho" */
export const sinSociedad = (s: string) => s.replace(/ (S\.A\.C\.|E\.I\.R\.L\.|S\.R\.L\.|S\.A\.A\.|S\.A\.)$/, '');

/** "Chrome/… Windows" → "Chrome en Windows" */
export function navegador(ua: string | null): string {
  if (!ua) return '';
  const b = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : '';
  const so = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone/.test(ua)
      ? 'iPhone'
      : /iPad/.test(ua)
        ? 'iPad'
        : /Android/.test(ua)
          ? 'Android'
          : /Mac OS X/.test(ua)
            ? 'macOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : '';
  return [b, so].filter(Boolean).join(' en ');
}

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const pad = (n: number) => String(n).padStart(2, '0');
/** Fecha local dd/mm/aaaa de un ISO con hora ('YYYY-MM-DD' se toma tal cual) */
export function fechaCorta(iso: string): string {
  if (iso.length === 10) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
