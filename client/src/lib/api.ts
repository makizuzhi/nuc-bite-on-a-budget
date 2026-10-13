import axios, { AxiosError } from 'axios';
import { clearToken, getToken } from './token';

export const SESSION_EXPIRED_EVENT = 'nuc:session-expired';

// The ONE axios instance used by the whole app (every request goes through here).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the login token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the session is invalid or expired (401), sign the student out.
// Login / register requests are excluded: a 401 there just means "wrong password".
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const isAuthCall = String(err.config?.url ?? '').startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      clearToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(err);
  },
);

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

/** Turns any thrown error into a message that is safe to show the student. */
export function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<ApiErrorBody>;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (e?.request && !e.response) return 'Cannot reach the server. Is the API running?';
  return 'Something went wrong. Please try again.';
}

/** Per-field messages returned by the server's validation (400), if any. */
export function getFieldErrors(err: unknown): Record<string, string> {
  return (err as AxiosError<ApiErrorBody>)?.response?.data?.errors ?? {};
}
