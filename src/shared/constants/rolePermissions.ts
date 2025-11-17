/**
 * Configuración de permisos por rol
 * Define qué rutas puede acceder cada tipo de usuario
 */

import { MAIN_ROUTES, SETTINGS_ROUTES } from '@/router/routes';

/**
 * Tipos de roles disponibles en el sistema
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EMPRESA: 'EMPRESA',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Rutas permitidas para ADMIN
 * ADMIN solo puede acceder a estas rutas específicas
 */
export const ADMIN_ALLOWED_ROUTES = [
  MAIN_ROUTES.HOME, // Dashboard principal
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.USERS}`, // Gestión de usuarios
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.VALUATION_METHODS}`, // Métodos de valoración
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.MY_ACCOUNT}`, // Mi cuenta
] as const;

/**
 * Rutas restringidas para EMPRESA
 * Estas rutas NO pueden ser accedidas por usuarios con rol EMPRESA
 */
export const EMPRESA_RESTRICTED_ROUTES = [
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.USERS}`, // Gestión de usuarios
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.VALUATION_METHODS}`, // Métodos de valoración
] as const;

/**
 * Rutas permitidas para EMPRESA
 * EMPRESA puede acceder a todas las rutas excepto las restringidas
 */
export const EMPRESA_ALLOWED_ROUTES = [
  MAIN_ROUTES.HOME, // Dashboard principal - EMPRESA también puede acceder
  MAIN_ROUTES.MAINTAINERS,
  MAIN_ROUTES.TRANSACTIONS,
  MAIN_ROUTES.INVENTORY,
  MAIN_ROUTES.ACCOUNTING,
  MAIN_ROUTES.FINANCIAL_CLOSING,
  MAIN_ROUTES.FINANCIAL_STATEMENTS,
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.PARAMS}`,
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.ACCOUNTING_PERIODS}`,
  `${MAIN_ROUTES.SETTINGS}${SETTINGS_ROUTES.MY_ACCOUNT}`,
] as const;

/**
 * Configuración de permisos por rol
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    allowedRoutes: ADMIN_ALLOWED_ROUTES, // Admin solo accede a rutas específicas
    restrictedRoutes: [] as string[],
    defaultRedirect: MAIN_ROUTES.HOME,
  },
  [USER_ROLES.EMPRESA]: {
    allowedRoutes: EMPRESA_ALLOWED_ROUTES,
    restrictedRoutes: EMPRESA_RESTRICTED_ROUTES,
    defaultRedirect: MAIN_ROUTES.HOME, // Redirige a home por defecto
  },
} as const;

/**
 * Verifica si un usuario tiene acceso a una ruta específica
 * @param userRole - Rol del usuario
 * @param routePath - Ruta a verificar
 * @returns true si tiene acceso, false si no
 */
export const hasRouteAccess = (userRole: UserRole, routePath: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    return false;
  }

  // Para ADMIN: solo puede acceder a las rutas específicamente permitidas
  if (userRole === USER_ROLES.ADMIN) {
    return permissions.allowedRoutes.some(allowedRoute => 
      routePath === allowedRoute || routePath.startsWith(`${allowedRoute}/`)
    );
  }

  // Para EMPRESA: puede acceder a todas las rutas excepto las restringidas
  if (userRole === USER_ROLES.EMPRESA) {
    const isRestricted = permissions.restrictedRoutes.some(restrictedRoute =>
      routePath === restrictedRoute || routePath.startsWith(`${restrictedRoute}/`)
    );
    
    if (isRestricted) {
      return false;
    }

    // Verificar si está en las rutas permitidas
    return permissions.allowedRoutes.some(allowedRoute => 
      routePath === allowedRoute || routePath.startsWith(`${allowedRoute}/`)
    );
  }

  return false;
};

/**
 * Obtiene la ruta de redirección por defecto para un rol
 * @param userRole Rol del usuario
 * @returns Ruta de redirección
 */
export const getDefaultRedirectRoute = (userRole: UserRole): string => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions?.defaultRedirect || MAIN_ROUTES.HOME;
};