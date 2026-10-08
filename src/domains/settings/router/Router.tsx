import { Navigate, Route, Routes } from "react-router-dom";
import { RoleBasedRoute } from '@/components';

import { UsersRouter, ValuationMethodsRouter } from '../pages';
import { Configuracion } from '../pages/Configuracion/Configuracion';
import { MAIN_ROUTES, SETTINGS_ROUTES } from '../../../router';
import { USER_ROLES } from '@/shared/constants';

const st = MAIN_ROUTES.SETTINGS;

/**
 * Router del módulo de configuración. Cuenta, empresa, periodos y parámetros
 * viven en una sola pantalla con navegación interna (/settings/:seccion).
 */
export const Router = () => {
  return (
    <Routes>
      <Route index element={<Navigate to={`${st}${SETTINGS_ROUTES.CUENTA}`} replace />} />

      {/* Rutas exclusivas para ADMIN */}
      <Route path={`${SETTINGS_ROUTES.USERS}/*`} element={
        <RoleBasedRoute requiredRoles={[USER_ROLES.ADMIN]}>
          <UsersRouter />
        </RoleBasedRoute>
      } />
      <Route path={`${SETTINGS_ROUTES.VALUATION_METHODS}/*`} element={
        <RoleBasedRoute requiredRoles={[USER_ROLES.ADMIN]}>
          <ValuationMethodsRouter />
        </RoleBasedRoute>
      } />

      {/* Rutas anteriores */}
      <Route path="my-account/*" element={<Navigate to={`${st}${SETTINGS_ROUTES.CUENTA}`} replace />} />
      <Route path="params" element={<Navigate to={`${st}${SETTINGS_ROUTES.PARAMETROS}`} replace />} />
      <Route path="accounting-periods/*" element={<Navigate to={`${st}${SETTINGS_ROUTES.PERIODOS}`} replace />} />

      {/* Configuración: Mi cuenta para todos; el resto solo con empresa */}
      <Route path=":seccion" element={
        <RoleBasedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.EMPRESA]}>
          <Configuracion />
        </RoleBasedRoute>
      } />
    </Routes>
  );
};
