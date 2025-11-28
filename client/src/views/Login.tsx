import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { setRole } from '../lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/Visittrack.png"
            alt="VisitTrack logo"
            className="w-16 h-16 mb-2 rounded"
            onError={(e:any)=>{ e.currentTarget.style.display='none'; }}
          />
          <div className="text-2xl font-semibold tracking-tight">VisitTrack</div>
          <div className="text-slate-400 text-sm">Sign in to your account</div>
        </div>
        <form className="space-y-3" onSubmit={onSubmit} aria-label="Login form">
          <label className="block">
            <span className="sr-only">Username</span>
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-label="Username"
            />
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
            />
          </label>
          {error && <div className="text-rose-400 text-sm" role="alert">{error}</div>}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
