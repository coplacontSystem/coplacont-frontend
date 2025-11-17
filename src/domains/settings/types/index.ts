/**
 * Métodos de valoración disponibles
 */
export const MetodoValoracion = {
  promedio: 'promedio',
  fifo: 'fifo'
} as const;

export type MetodoValoracion = typeof MetodoValoracion[keyof typeof MetodoValoracion];

/**
 * Estados de periodo contable
 */
export const EstadoPeriodo = {
  ACTIVO: 'ACTIVO',
  CERRADO: 'CERRADO'
} as const;

export type EstadoPeriodo = typeof EstadoPeriodo[keyof typeof EstadoPeriodo];

/**
 * Interfaz para la configuración de periodo contable
 */
export interface ConfiguracionPeriodo {
  id: number;
  año: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  cerrado: boolean;
  usuarioCierre: string | null;
  observaciones: string;
  persona: {
    id: number;
    razonSocial: string;
    ruc: string;
  };
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/**
 * DTO para crear un nuevo periodo contable
 */
export interface CreateConfiguracionPeriodoDto {
  año: number;
  fechaInicio: string;
  fechaFin: string;
  idPersona: number;
  observaciones: string;
}

/**
 * DTO para actualizar un periodo contable
 */
export interface UpdateConfiguracionPeriodoDto {
  año?: number;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
  cerrado?: boolean;
  observaciones?: string;
}

/**
 * DTO para actualizar solo el método de valoración
 */
export interface UpdateMetodoValoracionDto {
  metodoValoracion: MetodoValoracion;
}

/**
 * Interfaz para filtros de búsqueda de periodos
 */
export interface PeriodoFilters {
  anio?: number;
  mes?: number;
  estado?: EstadoPeriodo;
  metodoValoracion?: MetodoValoracion;
}

/**
 * Interfaz para respuesta paginada de periodos
 */
export interface PeriodosResponse {
  data: ConfiguracionPeriodo[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interfaz para respuesta de configuración de período
 */
export interface ConfiguracionPeriodoResponse {
  metodoValoracion: MetodoValoracion;
  duracionMeses: number;
  mesInicio: number;
  diasLimiteRetroactivo: number;
  recalculoAutomaticoKardex: boolean;
}

/**
 * Interfaz para opciones de select
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Constantes para opciones de select
 */
export const METODO_VALORACION_OPTIONS: SelectOption[] = [
  { value: MetodoValoracion.promedio, label: 'Promedio Ponderado' },
  { value: MetodoValoracion.fifo, label: 'FIFO (Primero en Entrar, Primero en Salir)' }
];

export const ESTADO_PERIODO_OPTIONS: SelectOption[] = [
  { value: EstadoPeriodo.ACTIVO, label: 'Activo' },
  { value: EstadoPeriodo.CERRADO, label: 'Cerrado' }
];

/**
 * Utilidades para formateo
 */
export const formatPeriodoLabel = (periodo: ConfiguracionPeriodo): string => {
  return periodo.descripcion;
};

export const formatMetodoValoracion = (metodo: MetodoValoracion): string => {
  const option = METODO_VALORACION_OPTIONS.find(opt => opt.value === metodo);
  return option?.label || metodo;
};

export const formatEstadoPeriodo = (estado: EstadoPeriodo): string => {
  const option = ESTADO_PERIODO_OPTIONS.find(opt => opt.value === estado);
  return option?.label || estado;
};

// ============================================================================
// TIPOS PARA USUARIOS Y EMPRESAS
// ============================================================================

/**
 * Interfaz para datos de empresa/persona
 */
export interface Persona {
  id: number;
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  telefono?: string;
  direccion?: string;
  habilitado: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaz para usuario
 */
export interface User {
  id: number;
  nombre: string;
  email: string;
  habilitado: boolean;
  esPrincipal: boolean;
  persona?: Persona;
  roles?: string[];
  resetPasswordToken?: string;
}

/**
 * DTO para crear empresa con usuario principal
 */
export interface CreateEmpresaConUsuarioDto {
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  telefono?: string;
  direccion?: string;
  nombreUsuario: string;
  emailUsuario: string;
  idRol: number;
  esPrincipal?: boolean;
}

/**
 * Interfaz para respuesta de empresa con usuario
 */
export interface EmpresaConUsuario {
  persona: Persona;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    passwordPlano: string;
  };
}

/**
 * DTO para crear usuario para empresa existente
 */
export interface CreateUserForPersonaDto {
  nombre: string;
  email: string;
  idRol: number;
  esPrincipal?: boolean;
}

/**
 * DTO para actualizar usuario
 */
export interface UpdateUserDto {
  nombre?: string;
  email?: string;
  habilitado?: boolean;
  esPrincipal?: boolean;
  persona?: {
    nombreEmpresa?: string;
    ruc?: string;
    razonSocial?: string;
    telefono?: string;
    direccion?: string;
  };
}

/**
 * Interfaz parcial para formularios de empresa
 */
export interface EmpresaParcial {
  id?: number;
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  telefono?: string;
  direccion?: string;
  nombreUsuario: string;
  emailUsuario: string;
  idRol: number;
  esPrincipal?: boolean;
}

/**
 * Opciones para roles (esto debería venir del backend)
 */
export const ROLE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Administrador' },
  { value: 2, label: 'Contador' },
  { value: 3, label: 'Usuario' }
];

/**
 * Opciones para filtros de estado de usuarios
 */
export const USER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' }
];

// ============================================================================
// TIPOS PARA RESPUESTA DEL CONTROLADOR DE PERSONAS
// ============================================================================

/**
 * Usuario dentro de la respuesta de persona
 */
export interface UserInPersonaResponse {
  id: number;
  nombre: string;
  email: string;
  habilitado: boolean;
  esPrincipal: boolean;
  roles: string[];
  createdAt: string;
  persona?: Persona;
}

/**
 * Persona con usuarios asociados (respuesta del nuevo controlador)
 */
export interface PersonaWithUsersResponse {
  id: number;
  nombreEmpresa: string;
  ruc: string;
  razonSocial: string;
  telefono?: string;
  direccion?: string;
  habilitado: boolean;
  createdAt: string;
  updatedAt: string;
  totalUsuarios: number;
  usuariosActivos: number;
  usuarios: UserInPersonaResponse[];
}