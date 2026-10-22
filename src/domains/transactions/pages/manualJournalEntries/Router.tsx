import { Route, Routes } from "react-router-dom";

import { MainPage } from '.'
import { AsientoFormPage } from './AsientoForm';

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="nuevo" element={<AsientoFormPage />} />
      <Route path=":id/editar" element={<AsientoFormPage />} />
    </Routes>
  );
};
