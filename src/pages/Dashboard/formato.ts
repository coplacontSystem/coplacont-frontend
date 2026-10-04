/** Formatos del dashboard: miles con espacio fino y coma decimal (es-PE). */

const NBSP = ' ';

const miles = (entero: string) => entero.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

export function soles(n: number, moneda = 'PEN'): string {
  const [entero, decimales] = Math.abs(n).toFixed(2).split('.');
  const simbolo = moneda === 'USD' ? 'US$' : 'S/';
  return `${n < 0 ? '−' : ''}${simbolo}${NBSP}${miles(entero)},${decimales}`;
}

export function numero(n: number): string {
  const [entero, decimales] = String(Math.round(n * 100) / 100).split('.');
  return miles(entero) + (decimales ? `,${decimales}` : '');
}

export const porcentaje = (n: number, decimales = 1) =>
  `${n.toFixed(decimales).replace('.', ',')}%`;

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** 'YYYY-MM' → 'Septiembre 2026' */
export function nombreMes(mes: string, conAño = true): string {
  const [a, m] = mes.split('-').map(Number);
  return conAño ? `${MESES[m - 1]} ${a}` : MESES[m - 1];
}

/** 'YYYY-MM-DD' → 'dd/mm/yyyy' */
export function fecha(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Eje del gráfico: tope "redondo" y etiquetas compactas. */
export function escala(max: number): { tope: number; ticks: number[] } {
  if (max <= 0) return { tope: 4, ticks: [0, 1, 2, 3, 4] };
  const paso0 = max / 4;
  const potencia = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * potencia).find((p) => p >= paso0)!;
  return { tope: paso * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * paso) };
}

export function compacto(n: number): string {
  if (n === 0) return '0';
  if (n >= 1_000_000) return `${numero(n / 1_000_000)} M`;
  if (n >= 1_000) return `${numero(n / 1_000)} mil`;
  return numero(n);
}

/** Iniciales de una razón social: "Bodega Don Lucho" → "BD". */
export const iniciales = (s: string) =>
  s
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, '')
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '·';
