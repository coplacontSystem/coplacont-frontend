import { handleApiError } from '@/shared';
import { type ILoginRequest, type ILoginResponse, type IAuthUser, type IPersona, type IRole, authApi } from '@/domains/auth';

/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con la autenticación de usuarios
 */
export class AuthService {

  static async login(credentials: ILoginRequest): Promise<ILoginResponse> {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error) {
      console.error('AuthService: Error en la solicitud de login:', error);
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  }

  static logout(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('persona');
    localStorage.removeItem('roles');
  }

  static async recoverPassword(email: string): Promise<{ success: boolean, message: string }> {
    const response = await authApi.recoverPassword({ email });
    return response.data;
  }

  static async validateResetToken(token: string): Promise<{ success: boolean, message: string, userId?: number }> {
    const response = await authApi.validateResetToken({ token });
    return response.data;
  }

  static async resetPassword(token: string, password: string): Promise<{ success: boolean, message: string }> {
    const response = await authApi.resetPassword({ token, password });
    return response.data;
  }

  static getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  static getUser(): IAuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static getPersona(): IPersona | null {
    const personaStr = localStorage.getItem('persona');
    if (!personaStr) return null;

    try {
      return JSON.parse(personaStr);
    } catch {
      return null;
    }
  }

  static savePersona(persona: IPersona): void {
    localStorage.setItem('persona', JSON.stringify(persona));
  }

  static getRoles(): IRole[] | null {
    const rolesStr = localStorage.getItem('roles');
    if (!rolesStr) return null;

    try {
      return JSON.parse(rolesStr);
    } catch {
      return null;
    }
  }

  static saveRoles(roles: IRole[]): void {
    localStorage.setItem('roles', JSON.stringify(roles));
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static decodeToken<T = unknown>(token: string): T | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as T;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   * @param token - Token JWT
   * @returns true si el token ha expirado
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken<{ exp?: number }>(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }
}