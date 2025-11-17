import { createContext } from 'react';
import type { IAuthContextState } from '@/domains/auth';

export const AuthContext = createContext<IAuthContextState | undefined>(undefined);