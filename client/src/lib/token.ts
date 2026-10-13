// The login token lives in localStorage so a refresh keeps you signed in.
// Storage can be blocked (private windows), so every access is wrapped in try/catch.
const KEY = 'nuc_token';

export const getToken = (): string | null => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export const setToken = (token: string) => {
  try { localStorage.setItem(KEY, token); } catch { /* ignore: the session just will not survive a refresh */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};
