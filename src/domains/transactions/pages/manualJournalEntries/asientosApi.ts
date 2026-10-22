import { apiSlice } from '@/store/api/apiSlice';

export type EstadoAsiento = 'registrado' | 'anulado';
export type OrigenAsiento = 'manual' | 'compra' | 'venta';

export interface LineaAsiento {
  orden: number;
  idCuenta: number;
  codigoCuenta: string;
  nombreCuenta: string;
  glosa: string | null;
  debe: number;
  haber: number;
}

export interface Asiento {
  id: number;
  numero: number;
  periodo: { id: number; año: number; cerrado: boolean };
  fecha: string;
  glosa: string;
  referencia: string | null;
  origen: OrigenAsiento;
  estado: EstadoAsiento;
  totalDebe: number;
  totalHaber: number;
  cantidadLineas: number;
  creadoPor: string;
  fechaCreacion: string;
  modificadoPor: string | null;
  fechaActualizacion: string;
  anulacion: { fecha: string; por: string; motivo: string } | null;
  editable: boolean;
  lineas?: LineaAsiento[];
}

export interface FiltrosAsientos {
  desde?: string;
  hasta?: string;
  q?: string;
  estado?: EstadoAsiento;
  cuenta?: string;
  pagina?: number;
  limite?: number;
}

export interface PaginaAsientos {
  datos: Asiento[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface GuardarAsiento {
  fecha: string;
  glosa: string;
  referencia?: string;
  lineas: { codigoCuenta: string; glosa?: string; debe: number; haber: number }[];
}

const LISTA = { type: 'Asientos' as const, id: 'LIST' };
// Los movimientos cambian qué cuentas se pueden desactivar o subdividir
const PLAN = { type: 'PlanContable' as const, id: 'LIST' };

export const asientosApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getAsientosContables: b.query<PaginaAsientos, FiltrosAsientos>({
      query: (params) => ({
        url: '/asientos',
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
      }),
      providesTags: [LISTA],
    }),
    getAsientoContable: b.query<Asiento, number>({
      query: (id) => `/asientos/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Asientos', id }],
    }),
    crearAsientoContable: b.mutation<Asiento, GuardarAsiento>({
      query: (body) => ({ url: '/asientos', method: 'POST', body }),
      invalidatesTags: [LISTA, PLAN],
    }),
    editarAsientoContable: b.mutation<Asiento, { id: number; datos: GuardarAsiento }>({
      query: ({ id, datos }) => ({ url: `/asientos/${id}`, method: 'PUT', body: datos }),
      invalidatesTags: (_r, _e, { id }) => [LISTA, PLAN, { type: 'Asientos', id }],
    }),
    anularAsientoContable: b.mutation<Asiento, { id: number; motivo: string }>({
      query: ({ id, motivo }) => ({ url: `/asientos/${id}/anular`, method: 'PATCH', body: { motivo } }),
      invalidatesTags: (_r, _e, { id }) => [LISTA, PLAN, { type: 'Asientos', id }],
    }),
  }),
});

export const {
  useGetAsientosContablesQuery,
  useGetAsientoContableQuery,
  useCrearAsientoContableMutation,
  useEditarAsientoContableMutation,
  useAnularAsientoContableMutation,
} = asientosApi;

/** Mensaje(s) legibles de un error del backend */
export function erroresDe(e: unknown, porDefecto = 'No se pudo guardar. Inténtalo de nuevo.'): string[] {
  const m = (e as { data?: { message?: string | string[] } })?.data?.message;
  if (Array.isArray(m)) return m.length ? m : [porDefecto];
  return [m || porDefecto];
}
