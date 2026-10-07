import { apiSlice } from '@/store/api/apiSlice';

export type Metodo = 'promedio' | 'fifo';

export interface Perfil {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  cargo: string | null;
  avatar: string | null;
  ultimoLogin: string | null;
  ultimoAgente: string | null;
  contrasenaActualizada: string | null;
}

export interface Empresa {
  id: number;
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  logo: string | null;
}

export type EstadoPeriodo = 'activo' | 'reabierto' | 'futuro' | 'pendiente' | 'cerrado';

export interface Periodo {
  id: number;
  año: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPeriodo;
  metodoValoracion: Metodo;
  fechaCierre: string | null;
  cerradoPor: string | null;
  movimientos: number;
  puedeCerrar: boolean;
  puedeReabrir: boolean;
}

/** Reglas editables desde Parámetros */
export interface Reglas {
  mesInicio: number;
  diasLimiteRetroactivo: number;
  requiereAutorizacionRetroactivo: boolean;
  cierreAutomatico: boolean;
  diasParaCierreAutomatico: number;
  notificarProximoCierre: boolean;
  diasNotificacionCierre: number;
  permitirMovimientosPeriodoCerrado: boolean;
}

export interface Configuracion extends Reglas {
  metodoValoracion: Metodo;
  metodoBloqueado: boolean;
  periodoActivo: { id: number; año: number; movimientos: number } | null;
}

const PERIODOS = [
  { type: 'Periodos' as const, id: 'LIST' },
  { type: 'Configuration' as const, id: 'LIST' },
];

export const configuracionApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getCuenta: b.query<Perfil, void>({
      query: () => '/cuenta',
      providesTags: [{ type: 'Cuenta', id: 'ME' }],
    }),
    actualizarCuenta: b.mutation<Perfil, Partial<Pick<Perfil, 'nombre' | 'telefono' | 'cargo'>>>({
      query: (body) => ({ url: '/cuenta', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Cuenta', id: 'ME' }],
    }),
    cambiarCorreo: b.mutation<Perfil, { email: string; contrasenaActual: string }>({
      query: (body) => ({ url: '/cuenta/correo', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Cuenta', id: 'ME' }],
    }),
    cambiarContrasena: b.mutation<Perfil, { actual: string; nueva: string }>({
      query: (body) => ({ url: '/cuenta/contrasena', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Cuenta', id: 'ME' }],
    }),
    guardarAvatar: b.mutation<Perfil, string | null>({
      query: (imagen) =>
        imagen
          ? { url: '/cuenta/avatar', method: 'PUT', body: { imagen } }
          : { url: '/cuenta/avatar', method: 'DELETE' },
      invalidatesTags: [{ type: 'Cuenta', id: 'ME' }],
    }),

    getEmpresa: b.query<Empresa, void>({
      query: () => '/empresa',
      providesTags: [{ type: 'Empresa', id: 'ME' }],
    }),
    actualizarEmpresa: b.mutation<
      Empresa,
      Partial<Pick<Empresa, 'razonSocial' | 'nombreComercial' | 'direccion' | 'telefono'>>
    >({
      query: (body) => ({ url: '/empresa', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Empresa', id: 'ME' }],
    }),
    guardarLogo: b.mutation<Empresa, string | null>({
      query: (imagen) =>
        imagen
          ? { url: '/empresa/logo', method: 'PUT', body: { imagen } }
          : { url: '/empresa/logo', method: 'DELETE' },
      invalidatesTags: [{ type: 'Empresa', id: 'ME' }],
    }),

    getPeriodos: b.query<Periodo[], void>({
      query: () => '/periodos-contables/resumen',
      providesTags: [{ type: 'Periodos', id: 'LIST' }],
    }),
    crearPeriodo: b.mutation<unknown, { año: number; metodoValoracion: Metodo }>({
      query: (body) => ({ url: '/periodos-contables', method: 'POST', body }),
      invalidatesTags: PERIODOS,
    }),
    cerrarPeriodo: b.mutation<unknown, number>({
      query: (id) => ({ url: `/periodos-contables/${id}/cerrar`, method: 'PUT', body: {} }),
      invalidatesTags: PERIODOS,
    }),
    reabrirPeriodo: b.mutation<unknown, number>({
      query: (id) => ({ url: `/periodos-contables/${id}/reabrir`, method: 'PUT' }),
      invalidatesTags: PERIODOS,
    }),
    getInventarioAl: b.query<{ fecha: string; valor: number }, string>({
      query: (fecha) => ({ url: '/dashboard/inventario', params: { fecha } }),
    }),

    getConfiguracion: b.query<Configuracion, void>({
      query: () => '/periodos-contables/configuracion',
      providesTags: [{ type: 'Configuration', id: 'LIST' }],
    }),
    actualizarReglas: b.mutation<Configuracion, Partial<Reglas>>({
      query: (body) => ({ url: '/periodos-contables/configuracion', method: 'PUT', body }),
      invalidatesTags: [{ type: 'Configuration', id: 'LIST' }],
    }),
    cambiarMetodo: b.mutation<unknown, Metodo>({
      query: (metodoValoracion) => ({
        url: '/periodos-contables/configuracion/metodo-valoracion',
        method: 'PUT',
        body: { metodoValoracion },
      }),
      invalidatesTags: PERIODOS,
    }),
  }),
});

export const {
  useGetCuentaQuery,
  useActualizarCuentaMutation,
  useCambiarCorreoMutation,
  useCambiarContrasenaMutation,
  useGuardarAvatarMutation,
  useGetEmpresaQuery,
  useActualizarEmpresaMutation,
  useGuardarLogoMutation,
  useGetPeriodosQuery,
  useCrearPeriodoMutation,
  useCerrarPeriodoMutation,
  useReabrirPeriodoMutation,
  useGetInventarioAlQuery,
  useGetConfiguracionQuery,
  useActualizarReglasMutation,
  useCambiarMetodoMutation,
} = configuracionApi;

/** Mensaje legible de un error de RTK Query / Nest */
export function mensajeError(e: unknown, porDefecto = 'No se pudo guardar. Inténtalo de nuevo.'): string {
  const data = (e as { data?: { message?: string | string[] } })?.data;
  const m = data?.message;
  if (Array.isArray(m)) return m[0] ?? porDefecto;
  return m || porDefecto;
}
