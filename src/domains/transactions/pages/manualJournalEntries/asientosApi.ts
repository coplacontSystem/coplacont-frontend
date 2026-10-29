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
  origen?: OrigenAsiento;
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

export interface CuentaAutomatica {
  clave: string;
  uso: string;
  codigo: string;
  porDefecto: string;
  nombreCuenta: string | null;
  /** La cuenta ya no sirve (no existe, está desactivada o agrupa) */
  error: string | null;
}

export interface ResultadoGeneracion {
  generados: number;
  actualizados: number;
  errores: { idComprobante: number; comprobante: string; error: string }[];
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
    getCuentasAutomaticas: b.query<CuentaAutomatica[], void>({
      query: () => '/asientos/automaticos/cuentas',
      providesTags: [{ type: 'Asientos', id: 'CUENTAS' }],
    }),
    guardarCuentasAutomaticas: b.mutation<CuentaAutomatica[], Record<string, string>>({
      query: (body) => ({ url: '/asientos/automaticos/cuentas', method: 'PUT', body }),
      invalidatesTags: [{ type: 'Asientos', id: 'CUENTAS' }],
    }),
    generarAsientosAutomaticos: b.mutation<ResultadoGeneracion, { desde: string; hasta: string }>({
      query: (body) => ({ url: '/asientos/automaticos/generar', method: 'POST', body }),
      invalidatesTags: [LISTA, PLAN],
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
  useGetCuentasAutomaticasQuery,
  useGuardarCuentasAutomaticasMutation,
  useGenerarAsientosAutomaticosMutation,
} = asientosApi;

/** Mensaje(s) legibles de un error del backend */
export function erroresDe(e: unknown, porDefecto = 'No se pudo guardar. Inténtalo de nuevo.'): string[] {
  const m = (e as { data?: { message?: string | string[] } })?.data?.message;
  if (Array.isArray(m)) return m.length ? m : [porDefecto];
  return [m || porDefecto];
}
