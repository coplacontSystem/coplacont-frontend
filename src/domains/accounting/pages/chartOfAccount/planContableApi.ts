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
    getCuentasContables: b.query<Cuenta[], { elemento?: string; q?: string }>({
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
  }),
});

export const {
  useGetResumenPlanContableQuery,
  useGetCuentasContablesQuery,
  useGetCuentaContableQuery,
  useLazyGetCuentaContableQuery,
  useCrearSubcuentaContableMutation,
  useActualizarSubcuentaContableMutation,
} = planContableApi;
