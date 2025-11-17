import { useContext } from "react";
import { AuthContext } from "../contexts";
import type { IAuthContextState } from "@/domains/auth";

/**
 * Hook personalizado para usar el contexto de autenticación
 * @returns El estado y funciones del contexto de autenticación
 * @throws Error si se usa fuera del AuthProvider
 */
export const useAuth = (): IAuthContextState => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};