import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppShell() {
  const { pathname } = useLocation();
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/register', label: 'Register' },
    { to: '/personnel', label: 'Personnel' },
    { to: '/scan', label: 'Scan' },
    { to: '/reports', label: 'Reports' },
  ];
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-64 hidden md:flex flex-col gap-2 p-4 border-r border-slate-800 bg-slate-950/60">
        <div className="text-lg font-semibold tracking-tight px-2 py-1">VisitTrack</div>
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
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-slate-400 px-2">© {new Date().getFullYear()}</div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-slate-800 bg-slate-950/60 px-4 py-3">
          <div className="font-semibold">VisitTrack</div>
        </header>
        <main className="px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
