import { apiSlice } from '@/store/api/apiSlice';

export interface PlanAdmin {
  id: number;
  codigo: string;
  nombre: string;
  norma: string;
  codigoSunat: string;
  porDefecto: boolean;
  origen: 'incluido' | 'importado';
  version: number;
  nota: string | null;
  vigenteDesde: string;
  actualizado: string;
  cuentas: number;
  empresas: number;
}

export interface ImportarPlan {
  modo: 'nuevo' | 'actualizar';
  codigo: string;
  nombre?: string;
  norma?: string;
  codigoSunat?: string;
  vigenteDesde?: string;
  nota?: string;
  archivo: { nombre: string; contenido: string };
}

export interface PreviaPlan {
  errores: string[];
  avisos: string[];
  diferencias: {
    comparadoCon: string | null;
    total: number;
    nuevas: [string, string][];
    quitadas: [string, string][];
    renombradas: [string, string, string][];
  };
}

export type TipoEquivalencia = 'igual' | 'renombrada' | 'cambio' | 'eliminada';

export interface Equivalencia {
  id: number;
  codigoOrigen: string;
  nombreOrigen: string;
  codigoDestino: string | null;
  nombreDestino: string | null;
  tipo: TipoEquivalencia;
  similitud: number;
  revisada: boolean;
  nota: string | null;
  revisadaPor: string | null;
}

export interface TablaEquivalencias {
  origen: { codigo: string; nombre: string };
  destino: { codigo: string; nombre: string };
  resumen: Partial<Record<TipoEquivalencia, number>>;
  porRevisar: number;
  equivalencias: Equivalencia[];
}

const PLANES = { type: 'PlanContable' as const, id: 'ADMIN' };
const EQUIVALENCIAS = { type: 'PlanContable' as const, id: 'EQUIVALENCIAS' };

export const planesAdminApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getPlanesAdmin: b.query<PlanAdmin[], void>({
      query: () => '/admin/planes-contables',
      providesTags: [PLANES],
    }),
    previsualizarPlan: b.mutation<PreviaPlan, ImportarPlan>({
      query: (body) => ({ url: '/admin/planes-contables/previsualizar', method: 'POST', body }),
    }),
    publicarPlan: b.mutation<{ creadas: number; renombradas: number; desactivadas: number }, ImportarPlan>({
      query: (body) => ({ url: '/admin/planes-contables/publicar', method: 'POST', body }),
      invalidatesTags: [PLANES, EQUIVALENCIAS, { type: 'PlanContable', id: 'LIST' }],
    }),
    getEquivalenciasPlan: b.query<TablaEquivalencias, { origen: string; destino: string }>({
      query: (params) => ({ url: '/plan-contable/equivalencias', params }),
      providesTags: [EQUIVALENCIAS],
    }),
    revisarEquivalencia: b.mutation<{ ok: boolean }, { id: number; codigoDestino: string | null; nota?: string }>({
      query: ({ id, ...body }) => ({ url: `/plan-contable/equivalencias/${id}`, method: 'PATCH', body }),
      invalidatesTags: [EQUIVALENCIAS],
    }),
  }),
});

export const {
  useGetPlanesAdminQuery,
  usePrevisualizarPlanMutation,
  usePublicarPlanMutation,
  useGetEquivalenciasPlanQuery,
  useRevisarEquivalenciaMutation,
} = planesAdminApi;
