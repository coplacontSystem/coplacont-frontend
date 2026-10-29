import { Route, Routes } from "react-router-dom";

import { MainPage, RegisterPage } from '.'
import { ImportarXmlPage } from '../importXml';
import { COMMON_ROUTES } from '@/router/routes';

export const Router = () => {
  return (
    <Routes>
      <Route index element={<MainPage />} />
      <Route path={COMMON_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={COMMON_ROUTES.BULK_REGISTER} element={<ImportarXmlPage desde="compras" />} />
    </Routes>
  );
};