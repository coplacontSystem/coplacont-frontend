import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RecoveryPasswordPage, NewPasswordPage } from '@/domains/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { RoleBasedRoute } from '@/components';

import { MainLayout } from '../components';
import {  
  TransactionsRouter, 
  InventoryRouter,
  AccountingRouter,
  FinancialClosingRouter,
  FinancialStatementsRouter,
  SettingsRouter,
} from '@/domains';
import { AUTH_ROUTES, MAIN_ROUTES, WELCOME_ROUTE } from '@/router';
import { MaintainersRouter } from '@/domains/maintainers';
import { Dashboard } from '@/pages';
import { WelcomePage } from '@/pages/Welcome/WelcomePage';

/**
 * Componente principal de enrutamiento de la aplicación
 * Define todas las rutas disponibles y su configuración con protección basada en roles
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>

      {/* Rutas públicas */}
      <Route element={<PublicRoute />}>
        <Route path={WELCOME_ROUTE} element={<WelcomePage />} />
      </Route>
      <Route path={AUTH_ROUTES.AUTH} element={<PublicRoute />} >
        <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={AUTH_ROUTES.RECOVERY_PASSWORD} element={<RecoveryPasswordPage />} />
        <Route path={AUTH_ROUTES.NEW_PASSWORD} element={<NewPasswordPage />} />
        <Route index element={<Navigate to={`${AUTH_ROUTES.AUTH}/${AUTH_ROUTES.LOGIN}`} replace />} />
      </Route>

      {/* Rutas privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path={MAIN_ROUTES.HOME} element={<MainLayout />}>
          {/* Ruta del Dashboard - disponible para ADMIN y EMPRESA */}
          <Route index element={
            <RoleBasedRoute>
              <Dashboard />
            </RoleBasedRoute>
          } />
          
          {/* Rutas de módulos - disponibles para EMPRESA, restringidas para ADMIN */}
          <Route path={`${MAIN_ROUTES.MAINTAINERS}/*`} element={
            <RoleBasedRoute>
              <MaintainersRouter />
            </RoleBasedRoute>
          } />
          <Route path={`${MAIN_ROUTES.TRANSACTIONS}/*`} element={
            <RoleBasedRoute>
              <TransactionsRouter />
            </RoleBasedRoute>
          } />
          <Route path={`${MAIN_ROUTES.INVENTORY}/*`} element={
            <RoleBasedRoute>
              <InventoryRouter />
            </RoleBasedRoute>
          } />
          <Route path={`${MAIN_ROUTES.ACCOUNTING}/*`} element={
            <RoleBasedRoute>
              <AccountingRouter />
            </RoleBasedRoute>
          } />
          <Route path={`${MAIN_ROUTES.FINANCIAL_CLOSING}/*`} element={
            <RoleBasedRoute>
              <FinancialClosingRouter />
            </RoleBasedRoute>
          } />
          <Route path={`${MAIN_ROUTES.FINANCIAL_STATEMENTS}/*`} element={
            <RoleBasedRoute>
              <FinancialStatementsRouter />
            </RoleBasedRoute>
          } />
          
          {/* Rutas de configuración - con protección específica por subruta */}
          <Route path={`${MAIN_ROUTES.SETTINGS}/*`} element={
            <RoleBasedRoute>
              <SettingsRouter />
            </RoleBasedRoute>
          } />
        </Route>
      </Route>

      {/* Ruta 404 - Redirecciona a la bienvenida */}
      <Route path="*" element={<Navigate to={WELCOME_ROUTE} replace />} />
    </Routes>
  );
};

export default AppRouter;