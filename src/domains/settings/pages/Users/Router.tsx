import { Navigate, Route, Routes } from "react-router-dom";

import { MainPage } from '.'
import { COMMON_ROUTES } from '@/router';

export const Router = () => {
  return (
    <Routes>
      <Route index element={<MainPage />} />
      {/* El alta de empresa es un modal de la lista */}
      <Route path={COMMON_ROUTES.REGISTER} element={<Navigate to="..?nueva=1" relative="path" replace />} />
    </Routes>
  );
};
