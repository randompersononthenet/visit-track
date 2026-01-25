import axios from 'axios';
import { setRole } from './auth';

const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && !import.meta.env.VITE_API_BASE)
  ? window.location.origin
  : (import.meta.env.VITE_API_BASE || 'http://localhost:4000');

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vt_token') : null;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      setToken(null);
      try { setRole(null); } catch {}
      // Optionally preserve intended path via query
      const href = window.location.href;
      const next = encodeURIComponent(href);
      window.location.assign(`/login?next=${next}`);
    }
    return Promise.reject(err);
  }
);

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('vt_token', token);
  else localStorage.removeItem('vt_token');
}
