import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppShell() {
  const { pathname } = useLocation();
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/register', label: 'Register' },
    { to: '/scan', label: 'Scan' },
    { to: '/reports', label: 'Reports' },
  ];
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">VisitTrack</h1>
          <nav className="flex gap-4">
            {nav.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className={
                  'text-sm px-3 py-1 rounded ' +
                  (pathname === n.to ? 'bg-blue-600 text-white' : 'hover:bg-gray-100')
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
