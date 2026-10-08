import { apiSlice } from '@/store/api/apiSlice';

export interface EmpresaFila {
  id: number;
  razonSocial: string;
  ruc: string;
  habilitada: boolean;
  usuarios: number;
  periodo: { año: number; estado: 'activo' | 'vencido'; fin: string } | null;
  ultimoAcceso: string | null;
  comprobantesMes: number;
  creada: string;
}

export interface ItemAtencion {
  tipo: 'sinPeriodo' | 'periodoVencido' | 'inactiva' | 'sinLogin';
  severidad: 'alta' | 'media' | 'baja';
  idPersona: number;
  empresa: string;
  usuario?: { id: number; nombre: string; email: string; alta: string };
  periodo?: { año: number; fin: string };
  ultimaActividad?: string | null;
}

export interface AdminDashboard {
  kpis: {
    empresasHabilitadas: number;
    empresasDeshabilitadas: number;
    usuarios: number;
    empresasActivas30: number;
    comprobantesMes: number;
    comprobantesMesAnterior: number;
    variacion: number | null;
  };
  actividad: { mes: string; comprobantes: number; empresasNuevas: number }[];
  atencion: ItemAtencion[];
  empresas: EmpresaFila[];
  accesos: {
    idUsuario: number;
    nombre: string;
    empresa: string | null;
    agente: string | null;
    avatar: string | null;
    fecha: string;
  }[];
  altas: { id: number; razonSocial: string; fecha: string; usuarios: number }[];
}

export interface EmpresaDetalle {
  id: number;
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  logo: string | null;
  habilitada: boolean;
  creada: string;
  usuarios: {
    id: number;
    nombre: string;
    email: string;
    habilitado: boolean;
    principal: boolean;
    ultimoAcceso: string | null;
  }[];
  periodos: { id: number; año: number; estado: string; inicio: string; fin: string }[];
  actividad: { mes: string; comprobantes: number }[];
}

const ADMIN = [{ type: 'Admin' as const, id: 'LIST' }];

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (b) => ({
    getAdminDashboard: b.query<AdminDashboard, void>({
      query: () => '/admin/dashboard',
      providesTags: ADMIN,
    }),
    getEmpresaAdmin: b.query<EmpresaDetalle, number>({
      query: (id) => `/admin/empresas/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Admin', id }],
    }),
    cambiarEstadoEmpresa: b.mutation<void, { id: number; habilitar: boolean }>({
      query: ({ id, habilitar }) => ({
        url: `/persona/${id}/${habilitar ? 'enable' : 'disable'}`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, { id }) => [...ADMIN, { type: 'Admin', id }, { type: 'Users', id: 'LIST' }],
    }),
    agregarUsuario: b.mutation<unknown, { idPersona: number; nombre: string; email: string; idRol: number }>({
      query: ({ idPersona, ...body }) => ({
        url: `/user/persona/${idPersona}`,
        method: 'POST',
        body: { ...body, esPrincipal: false },
      }),
      invalidatesTags: (_r, _e, { idPersona }) => [...ADMIN, { type: 'Admin', id: idPersona }, { type: 'Users', id: 'LIST' }],
    }),
    getRoles: b.query<{ id: number; nombre: string }[], void>({
      query: () => '/rol',
    }),
    reenviarAcceso: b.mutation<{ success: boolean; message: string }, string>({
      query: (email) => ({ url: '/auth/request-password-reset', method: 'POST', body: { email } }),
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetEmpresaAdminQuery,
  useCambiarEstadoEmpresaMutation,
  useAgregarUsuarioMutation,
  useGetRolesQuery,
  useReenviarAccesoMutation,
} = adminApi;
