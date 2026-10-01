import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { Loader } from '@/components'
import { useAuth } from '@/domains/auth';
import { WELCOME_ROUTE } from './routes';

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige a la bienvenida si el usuario no está autenticado
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return <Navigate to={WELCOME_ROUTE} replace />;
  }

  return (
    <Outlet />
  );
};

