import { Route, Routes } from "react-router-dom";
import { RoleBasedRoute } from '@/components';

import { 
    UsersRouter,
    ParamsRouter,
    AccountingPeriodRouter,
    ValuationMethodsRouter,
    DashboardRouter,
    MyAccountRouter,
} from '../pages';
import { SETTINGS_ROUTES } from '../../../router';
import { USER_ROLES } from '@/shared/constants';

/**
 * Router principal del módulo de configuración
 * Define todas las rutas disponibles para el módulo de settings con protección por roles
 */
export const Router = () => {
  return (
    <Routes>
      <Route index element={<DashboardRouter />} />
      
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
      {/* Mi Cuenta: disponible para ADMIN */}
      <Route path={`${SETTINGS_ROUTES.MY_ACCOUNT}/*`} element={
        <RoleBasedRoute requiredRoles={[USER_ROLES.ADMIN]}>
          <MyAccountRouter />
        </RoleBasedRoute>
      } />
      
      {/* Rutas disponibles para EMPRESA */}
      <Route path={SETTINGS_ROUTES.PARAMS} element={
        <RoleBasedRoute>
          <ParamsRouter />
        </RoleBasedRoute>
      } />
      <Route path={`${SETTINGS_ROUTES.ACCOUNTING_PERIODS}/*`} element={
        <RoleBasedRoute>
          <AccountingPeriodRouter />
        </RoleBasedRoute>
      } />
    </Routes>
  );
};