import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { setRole } from '../lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const token = res.data?.token as string;
      if (!token) throw new Error('No token received');
      setToken(token);
      try { setRole(res.data?.user?.role || null); } catch {}
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-xl dark:bg-slate-800/50 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-700">
            <img src="/rbjmp1-logo.jpg" alt="BJMP" className="w-full h-full object-contain" />
          </div>
          <img
            src="/Visittrack.png"
            alt="VisitTrack logo"
            className="w-30 h-30 rounded"
            onError={(e:any)=>{ e.currentTarget.style.display='none'; }}
          />
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-700">
            <img src="/agooDJ-logo.jpg" alt="Agoo District Jail" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="text-2xl font-semibold tracking-tight">VisitTrack</div>
          <div className="text-slate-600 text-sm dark:text-slate-400">Sign in to your account</div>
        </div>
        <form className="space-y-3" onSubmit={onSubmit} aria-label="Login form">
          <label className="block">
            <span className="sr-only">Username</span>
            <input
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-label="Username"
            />
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <div className="relative">
              <input
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.07 1.13-2.06 2-2.94M10.58 10.58a2 2 0 0 0 2.84 2.84M6.1 6.1l11.8 11.8"/><path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .23.52-.51 1.02-.84 1.5"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>
          {error && <div className="text-rose-600 text-sm dark:text-rose-400" role="alert">{error}</div>}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
