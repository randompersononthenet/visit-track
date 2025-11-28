import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { hasRole, logout } from '../lib/auth';

function Icon({ name }: { name: string }) {
  const props = { width: 16, height: 16, className: 'mr-2 inline-block align-[-2px]' } as any;
  switch (name) {
    case 'dashboard':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z"/></svg>);
    case 'register':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3H5a2 2 0 0 0-2 2v11m0 0V5a2 2 0 0 1 2-2h11m-13 13l4-4 4 4 7-7"/></svg>);
    case 'personnel':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>);
    case 'scan':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/><rect x="7" y="7" width="10" height="10" rx="2"/></svg>);
    case 'logs':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v4H4zM4 12h16v8H4z"/></svg>);
    case 'reports':
      return (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 0 0-2 2v14l4-4h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>);
    default:
      return null;
  }
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  function openLogoutDialog() {
    setShowLogoutDialog(true);
  }
  function closeLogoutDialog() {
    setShowLogoutDialog(false);
  }
  function confirmLogout() {
    try { logout(); } catch {}
    setShowLogoutDialog(false);
    navigate('/login', { replace: true });
  }
  useEffect(() => {
    if (showLogoutDialog) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowLogoutDialog(false);
      };
      window.addEventListener('keydown', onKey);
      // focus confirm button for accessibility
      setTimeout(() => confirmBtnRef.current?.focus(), 0);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [showLogoutDialog]);
  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/register', label: 'Register', icon: 'register' },
    { to: '/personnel', label: 'Personnel', icon: 'personnel' },
    { to: '/scan', label: 'Scan', icon: 'scan' },
    ...(hasRole(['admin', 'staff']) ? [{ to: '/logs', label: 'Visit Logs', icon: 'logs' }] : [] as any),
    ...(hasRole(['admin', 'staff']) ? [{ to: '/reports', label: 'Reports', icon: 'reports' }] : [] as any),
  ];
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-64 hidden md:flex flex-col gap-2 p-4 border-r border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 px-2 py-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9-9 9-9-9z"/></svg>
          <div className="text-lg font-semibold tracking-tight">VisitTrack</div>
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                'px-3 py-2 rounded-md text-sm transition-colors ' +
                (pathname === n.to
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white')
              }
            >
              <Icon name={n.icon} /> {n.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={openLogoutDialog}
          className="mt-auto mb-2 mx-2 px-3 py-2 rounded-md text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left"
        >
          Log out
        </button>
        <div className="text-xs text-slate-400 px-2">© {new Date().getFullYear()}</div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-slate-800 bg-slate-950/60 px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">VisitTrack</div>
          <button onClick={openLogoutDialog} className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded">
            Log out
          </button>
        </header>
        <main className="px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
      {showLogoutDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-desc"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeLogoutDialog();
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-sm mx-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M19 12H5"/></svg>
              <h3 id="logout-title" className="text-lg font-semibold">Sign out</h3>
            </div>
            <p id="logout-desc" className="text-slate-300 text-sm mb-4">Are you sure you want to log out?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={closeLogoutDialog} className="px-3 py-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">Cancel</button>
              <button ref={confirmBtnRef} onClick={confirmLogout} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white">Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
