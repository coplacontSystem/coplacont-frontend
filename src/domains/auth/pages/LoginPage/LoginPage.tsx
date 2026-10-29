import React, { useState } from 'react';

import { AuthLayout, AuthHeader } from '@/components';

import { 
  LoginForm, 
  AuthService, 
  type ILoginFormData, 
  type ILoginRequest,
  useAuth,
} from '@/domains/auth';
import { useNavigate } from 'react-router-dom';
import { MAIN_ROUTES } from '@/router';

//import styles from './LoginPage.module.scss';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  /**
   * Maneja el proceso de login
   * Utiliza el servicio de autenticación para realizar el login
   */
  const handleLogin = async (formData: ILoginFormData) => {
    try {
      setIsLoading(true);
      setLoginError('');
      
      // Preparar los datos para el servicio (mapear password a contrasena)
      const loginRequest: ILoginRequest = {
        email: formData.email,
        contrasena: formData.password
      };
      
      // Llamada al servicio de autenticación
      const response = await AuthService.login(loginRequest);
      


      if (response.success && response.email && response.jwt && response.roles) {
        console.log('Login exitoso, llamando a función login del contexto');
        // Usar el contexto para manejar el login
        login(response.nombre, response.email, response.jwt, response.persona, response.roles);
        
        console.log('Redirigiendo a página principal');
        // Redirigir a la página principal después del login exitoso
        navigate(MAIN_ROUTES.HOME);
      } else {
        console.error('Login falló - datos incompletos o respuesta no exitosa');
        setLoginError(response.message || 'Error en el proceso de autenticación');
      }
    } catch (error) {
      console.error('Error durante el proceso de login:', error);
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/** Header de autenticación - Molécula reutilizable */}
      <AuthHeader
        title="Bienvenido al Sistema Coplacont"
        subtitle="Ingresa a tu cuenta para continuar"
      />

      {/** Organismo LoginForm - Contiene toda la lógica del formulario */}
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={loginError}
      />
    </AuthLayout>
  );
};

export default LoginPage;
