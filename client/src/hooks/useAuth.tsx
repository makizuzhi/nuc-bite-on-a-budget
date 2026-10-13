import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, SESSION_EXPIRED_EVENT } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/token';
import type { SignupForm } from '../schemas';

interface AuthResponse { token: string }
interface Ctx {
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (values: SignupForm) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken);

  // The axios interceptor fires this event when the server rejects our token (expired / deleted account).
  useEffect(() => {
    const onExpired = () => setTokenState(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const accept = useCallback((res: AuthResponse) => { setToken(res.token); setTokenState(res.token); }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    accept(data);
  }, [accept]);

  const register = useCallback(async (v: SignupForm) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      fullName: v.fullName, email: v.email, password: v.password, allowance: v.allowance, cycleLengthDays: v.cycleLengthDays,
    });
    accept(data);
  }, [accept]);

  const logout = useCallback(() => { clearToken(); setTokenState(null); }, []);

  const value = useMemo(() => ({ isLoggedIn: Boolean(token), login, register, logout }), [token, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
