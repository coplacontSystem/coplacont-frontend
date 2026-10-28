import { apiSlice } from '@/store/api/apiSlice';

export type Naturaleza = 'deudora' | 'acreedora' | 'mixta';

export interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  elemento: string;
  naturaleza: Naturaleza;
  idPadre: number | null;
  codigoPadre: string | null;
  propia: boolean;
  activa: boolean;
  tieneHijas: boolean;
  imputable: boolean;
}

export interface Plan {
  id: number;
  codigo: string;
  nombre: string;
  norma: string;
  codigoSunat: string;
  vigenteDesde: string;
  vigenteHasta: string | null;
  nota?: string | null;
}

export interface CambioPlan {
  idPlan: number;
  idPeriodoDesde?: number;
  reasignar?: Record<string, string>;
}

export interface InformeCambioPlan {
  planActual: { id: number; codigo: string; nombre: string };
  planDestino: { id: number; codigo: string; nombre: string };
  periodos: { id: number; año: number; pasa: boolean }[];
  cuentasPropias: { codigo: string; nombre: string; nuevoCodigo: string | null; problema: string | null }[];
  cuentasUsadas: {
    codigo: string;
    nombre: string;
    usos: number;
    destino: string | null;
    nombreDestino: string | null;
    problema: string | null;
  }[];
  areas: { nombre: string; actual: string | null; nuevo: string | null }[];
  cuentasAutomaticas: { rol: string; actual: string; nuevo: string | null }[];
  errores: string[];
  avisos: string[];
}

export interface ResumenPlan {
  plan: Plan;
  elementos: { elemento: string; nombre: string; cuentas: number; propias: number }[];
}

export interface DetalleCuenta {
  cuenta: Cuenta;
  ruta: Cuenta[];
  hijas: Cuenta[];
}

const LISTA = { type: 'PlanContable' as const, id: 'LIST' };

export const planContableApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getResumenPlanContable: b.query<ResumenPlan, void>({
      query: () => '/plan-contable',
      providesTags: [LISTA],
    }),
    getCuentasContables: b.query<Cuenta[], { elemento?: string; q?: string; imputables?: boolean }>({
      query: (params) => ({ url: '/plan-contable/cuentas', params }),
      providesTags: [LISTA],
    }),
    getCuentaContable: b.query<DetalleCuenta, string>({
      query: (codigo) => `/plan-contable/cuentas/${codigo}`,
      providesTags: [LISTA],
    }),
    crearSubcuentaContable: b.mutation<
      Cuenta,
      { codigoPadre?: string; codigo: string; nombre: string; naturaleza?: Naturaleza }
    >({
      query: (body) => ({ url: '/plan-contable/cuentas', method: 'POST', body }),
      invalidatesTags: [LISTA],
    }),
    actualizarSubcuentaContable: b.mutation<Cuenta, { id: number; nombre?: string; activa?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/plan-contable/cuentas/${id}`, method: 'PATCH', body }),
      invalidatesTags: [LISTA],
    }),
    getPlanesContables: b.query<Plan[], void>({
      query: () => '/plan-contable/planes',
      providesTags: [LISTA],
    }),
    previsualizarCambioPlan: b.mutation<InformeCambioPlan, CambioPlan>({
      query: (body) => ({ url: '/plan-contable/cambio/previsualizar', method: 'POST', body }),
    }),
    cambiarPlanContable: b.mutation<ResumenPlan, CambioPlan>({
      query: (body) => ({ url: '/plan-contable', method: 'PUT', body }),
      invalidatesTags: [LISTA, { type: 'Asientos', id: 'LIST' }, { type: 'Periodos', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetResumenPlanContableQuery,
  useGetCuentasContablesQuery,
  useGetCuentaContableQuery,
  useLazyGetCuentaContableQuery,
  useCrearSubcuentaContableMutation,
  useActualizarSubcuentaContableMutation,
  useGetPlanesContablesQuery,
  usePrevisualizarCambioPlanMutation,
  useCambiarPlanContableMutation,
} = planContableApi;
