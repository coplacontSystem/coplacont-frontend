/** 1234.5 → "1 234,50" (miles con espacio fino, coma decimal) */
export function importe(n: number): string {
  const [ent, dec] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '−' : ''}${ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec}`;
}

/** 'YYYY-MM-DD' → 'dd/mm/aaaa' */
export const fecha = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

/** ISO con hora → 'dd/mm/aaaa hh:mm' en hora local */
export function fechaHora(iso: string): string {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
