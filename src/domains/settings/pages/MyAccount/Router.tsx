import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainPage } from './MainPage';

/**
 * Router para la página "Mi Cuenta"
 */
export const Router: React.FC = () => {
  return (
    <Routes>
      <Route index element={<MainPage />} />
    </Routes>
  );
};

export default Router;