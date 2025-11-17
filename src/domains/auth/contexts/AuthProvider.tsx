import React, { useState, useEffect } from 'react';
import type { IAuthUser, IAuthContextState, IAuthProviderProps, IPersona, IRole } from '@/domains/auth';

import { AuthContext } from './context';

/**
 * Proveedor del contexto de autenticación
 * Maneja el estado global de autenticación y persistencia en localStorage
 */
export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Función de debug para monitorear localStorage
   */
  const debugLocalStorage = (action: string) => {
    const keys = ['jwt', 'user', 'persona', 'roles'];
    const status = keys.map(key => ({
      key,
      exists: localStorage.getItem(key) !== null,
      value: localStorage.getItem(key)?.substring(0, 50) + '...'
    }));
    console.log(`AuthProvider [${action}]:`, status);
  };

  /**
   * Limpia datos duplicados o obsoletos del localStorage
   */
  const cleanupDuplicateData = () => {
    try {
      debugLocalStorage('ANTES de cleanup');
      
      // Solo limpiar claves duplicadas específicas, sin validaciones complejas
      const duplicateKeys = ['_token', 'auth_user', 'token', 'authToken', 'access_token'];
      const removed: string[] = [];
      
      duplicateKeys.forEach(key => {
        try {
          if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            removed.push(key);
          }
        } catch (error) {
          console.error(`AuthProvider: Error eliminando ${key}:`, error);
        }
      });
      
      if (removed.length > 0) {
        console.log('AuthProvider: Claves duplicadas eliminadas:', removed);
      }
      
      debugLocalStorage('DESPUÉS de cleanup');
      
    } catch (error) {
      console.error('AuthProvider: Error al limpiar datos duplicados:', error);
    }
  };

  /**
   * Verifica si hay datos de autenticación guardados al inicializar
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('AuthProvider: Inicializando autenticación...');
        debugLocalStorage('INICIO de inicialización');
        
        // Verificar si localStorage está disponible
        if (typeof Storage === 'undefined') {
          console.warn('localStorage no está disponible');
          debugLocalStorage('localStorage NO disponible');
          setIsLoading(false);
          return;
        }

        const savedToken = localStorage.getItem('jwt');
        const savedUser = localStorage.getItem('user');
        const savedPersona = localStorage.getItem('persona');
        const savedRoles = localStorage.getItem('roles');

        console.log('AuthProvider: Inicializando autenticación', {
          hasToken: !!savedToken,
          hasUser: !!savedUser,
          hasPersona: !!savedPersona,
          hasRoles: !!savedRoles,
          tokenLength: savedToken?.length || 0,
          userLength: savedUser?.length || 0,
          localStorageLength: localStorage.length,
          windowLocation: window.location.href,
          userAgent: navigator.userAgent,
          isProduction: import.meta.env.PROD
        });

        if (savedToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          try {
            const parsedUser = JSON.parse(savedUser) as IAuthUser;
            
            // Si hay persona guardada por separado, la agregamos al usuario
            if (savedPersona && savedPersona !== 'undefined' && savedPersona !== 'null') {
              try {
                const parsedPersona = JSON.parse(savedPersona) as IPersona;
                parsedUser.persona = parsedPersona;
              } catch (personaParseError) {
                console.error('Error al parsear persona:', personaParseError);
                localStorage.removeItem('persona');
              }
            }
            
            // Si hay roles guardados por separado, los agregamos al usuario
            if (savedRoles && savedRoles !== 'undefined' && savedRoles !== 'null') {
              try {
                const parsedRoles = JSON.parse(savedRoles) as IRole[];
                parsedUser.roles = parsedRoles;
              } catch (rolesParseError) {
                console.error('Error al parsear roles:', rolesParseError);
                localStorage.removeItem('roles');
              }
            }
            
            setToken(savedToken);
            setUser(parsedUser);
            console.log('Usuario autenticado restaurado:', parsedUser.email);
          } catch (parseError) {
            console.error('Error al parsear datos guardados:', parseError);
            // Solo limpiar si hay error de parsing
            localStorage.removeItem('jwt');
            localStorage.removeItem('user');
            localStorage.removeItem('persona');
            localStorage.removeItem('roles');
          }
        } else {
          console.log('No hay datos de autenticación guardados');
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Solo limpiar en caso de error crítico
        try {
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('persona');
          localStorage.removeItem('roles');
        } catch (cleanupError) {
          console.error('Error al limpiar localStorage:', cleanupError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Eliminado el efecto de focus que causaba problemas

  /**
   * Función para realizar login
   * Guarda los datos en el estado y en localStorage
   */
  const login = (nombre: string, email: string, jwt: string, persona: IPersona, roles: IRole[]) => {
    try {
      console.log('AuthProvider: Iniciando proceso de login', {
        email,
        hasJwt: !!jwt,
        hasPersona: !!persona,
        hasRoles: !!roles,
        rolesCount: roles?.length || 0,
        windowLocation: window.location.href,
        userAgent: navigator.userAgent
      });
      
      const userData: IAuthUser = { nombre, email, persona, roles };
      
      // Verificar que localStorage esté disponible
      if (typeof Storage === 'undefined') {
        console.error('AuthProvider: localStorage no está disponible durante el login');
        return;
      }
      
      debugLocalStorage('ANTES de login');
      
      // Limpiar datos duplicados antes de guardar
      cleanupDuplicateData();
      
      // Verificar estado actual antes de actualizar
      console.log('AuthProvider: Estado antes del login', {
        currentUser: user?.email,
        currentToken: !!token,
        localStorageUser: localStorage.getItem('user'),
        localStorageToken: localStorage.getItem('jwt')
      });
      
      // Actualizar estado
      console.log('AuthProvider: Actualizando estado del contexto...');
      setUser(userData);
      setToken(jwt);
      
      // Guardar en localStorage con verificación
      try {
        console.log('AuthProvider: Guardando en localStorage...');
        localStorage.setItem('jwt', jwt);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('persona', JSON.stringify(persona));
        localStorage.setItem('roles', JSON.stringify(roles));
        
        debugLocalStorage('DESPUÉS de guardar en login');
        
        console.log('AuthProvider: Datos guardados, verificando...');
        
        // Verificar que se guardaron correctamente
        const savedToken = localStorage.getItem('jwt');
        const savedUser = localStorage.getItem('user');
        const savedPersona = localStorage.getItem('persona');
        const savedRoles = localStorage.getItem('roles');
        
        console.log('AuthProvider: Verificación de guardado', {
          tokenSaved: !!savedToken,
          userSaved: !!savedUser,
          personaSaved: !!savedPersona,
          rolesSaved: !!savedRoles,
          tokenMatches: savedToken === jwt,
          userDataLength: savedUser?.length || 0,
          localStorageLength: localStorage.length
        });
        
        if (!savedToken || !savedUser) {
          console.error('AuthProvider: Error - Los datos no se guardaron correctamente en localStorage');
        } else {
          console.log('AuthProvider: Todos los datos se guardaron correctamente');
        }
        
        // Intentar parsear para verificar integridad
         if (savedUser) {
           try {
             const parsedUser = JSON.parse(savedUser);
             console.log('AuthProvider: Usuario parseado correctamente', {
               parsedEmail: parsedUser.email,
               originalEmail: email
             });
           } catch (parseError) {
             console.error('AuthProvider: Error al parsear usuario guardado', parseError);
           }
         }
        
      } catch (storageError) {
        console.error('AuthProvider: Error al guardar en localStorage:', storageError);
      }
      
    } catch (error) {
      console.error('AuthProvider: Error durante el login:', error);
    }
  };

  /**
   * Función para realizar logout
   * Limpia el estado y el localStorage
   */
  const logout = () => {
    debugLocalStorage('ANTES de logout');
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('persona');
    localStorage.removeItem('roles');
    
    debugLocalStorage('DESPUÉS de eliminar en logout');
    
    // Limpiar también cualquier dato duplicado
    cleanupDuplicateData();
    
    debugLocalStorage('DESPUÉS de cleanup en logout');
  };

  const value: IAuthContextState = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};