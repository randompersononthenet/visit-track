import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { hasRole } from '../lib/auth';

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
