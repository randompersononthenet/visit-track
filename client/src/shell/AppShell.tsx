// AppShell: main layout with sidebar navigation, header (mobile), theming and routing outlet.
// Sidebar is sticky and scrolls independently; theme persists in localStorage.
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
    case 'users':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [theme, setTheme] = useState<'light'|'dark'>(
    (typeof window !== 'undefined' && (localStorage.getItem('vt_theme') as 'light'|'dark')) || 'light'
  );
  const [collapsed, setCollapsed] = useState<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('vt_nav_collapsed') === '1' : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem('vt_theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('vt_nav_collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

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
    ...(hasRole(['admin', 'staff', 'officer', 'warden']) ? [{ to: '/register', label: 'Visitor', icon: 'register' }] : [] as any),
    ...(hasRole(['admin', 'staff', 'officer', 'warden']) ? [{ to: '/register-external', label: 'Officials/Doctors', icon: 'register' }] : [] as any),
    ...(hasRole(['admin', 'staff', 'officer', 'warden']) ? [{ to: '/personnel', label: 'Personnel', icon: 'personnel' }] : [] as any),
    ...(hasRole(['staff', 'officer']) ? [{ to: '/scan', label: 'Scan', icon: 'scan' }] : [] as any),
    ...(hasRole(['admin', 'staff']) ? [{ to: '/prereg', label: 'Pre-Registrations', icon: 'register' }] : [] as any),
    ...(hasRole(['admin', 'staff']) ? [{ to: '/archived', label: 'Archived Visitors', icon: 'logs' }] : [] as any),
    ...(hasRole(['admin', 'staff', 'warden', 'analyst']) ? [{ to: '/logs', label: 'Visit Logs', icon: 'logs' }] : [] as any),
    ...(hasRole(['admin', 'staff', 'warden', 'analyst']) ? [{ to: '/reports', label: 'Reports', icon: 'reports' }] : [] as any),
    ...(hasRole(['admin']) ? [{ to: '/users', label: 'Users', icon: 'users' }] : [] as any),
    ...(hasRole(['admin']) ? [{ to: '/audit-logs', label: 'Audit Trails', icon: 'logs' }] : [] as any),
  ];
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col gap-2 ${collapsed ? 'p-2' : 'p-4'} border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 transition-all sticky top-0 h-screen overflow-y-auto shrink-0`}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
            <img
              src="/Visittrack.png"
              alt="VisitTrack"
              className={`${collapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded`}
              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
            />
            {!collapsed && <div className="text-lg font-semibold tracking-tight">VisitTrack</div>}
          </div>
          {/* Right controls */}
          <div className={`flex items-center ${collapsed ? 'hidden' : ''}`}>
            <div
              role="button"
              aria-label="Toggle sidebar"
              className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 mr-1"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {/* Collapse/Expand icon */}
              {collapsed ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              )}
            </div>
            <div
              role="button"
              aria-label="Toggle color theme"
              className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364 6.364l-1.414-1.414M8.05 8.05L6.636 6.636m10.728 0l-1.414 1.414M8.05 15.95l-1.414 1.414"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </div>
          </div>
          {/* When collapsed, show only collapse toggle on the right */}
          {collapsed && (
            <div
              role="button"
              aria-label="Expand sidebar"
              className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={() => setCollapsed(false)}
              title="Expand"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
          )}
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              className={
                (collapsed ? 'justify-center px-2 ' : 'px-3 ') +
                'py-2 rounded-md text-sm flex items-center gap-2 transition-colors ' +
                (pathname === n.to
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')
              }
            >
              <Icon name={n.icon} />
              {!collapsed && <span>{n.label}</span>}
            </Link>
          ))}
        </nav>
        {/* Logout control (icon + text, flushed left) */}
        <div className="mt-auto mx-2 flex items-center justify-start">
          <div
            role="button"
            aria-label="Log out"
            className={(collapsed ? 'justify-center px-2 ' : 'px-2 ') + 'flex items-center gap-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 border border-transparent dark:hover:bg-slate-800 dark:text-slate-300'}
            onClick={openLogoutDialog}
            title="Log out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M19 12H5"/></svg>
            {!collapsed && <span className="text-sm">Log out</span>}
          </div>
        </div>
        <div className={`mt-2 text-xs text-slate-500 dark:text-slate-400 ${collapsed ? 'px-0 text-center' : 'px-2'}`}>© {new Date().getFullYear()}</div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open navigation"
              className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={() => setShowMobileNav(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
            <div className="font-semibold">VisitTrack</div>
          </div>
          <div className="flex items-center gap-1">
            <div
              role="button"
              aria-label="Toggle color theme"
              className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364 6.364l-1.414-1.414M8.05 8.05L6.636 6.636m10.728 0l-1.414 1.414M8.05 15.95l-1.414 1.414"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </div>
            <div
              role="button"
              aria-label="Log out"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={openLogoutDialog}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M19 12H5"/></svg>
              <span className="text-sm">Log out</span>
            </div>
          </div>
        </header>
        <main className="px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
      {/* Mobile navigation overlay */}
      {showMobileNav && (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowMobileNav(false); }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-xl p-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="font-semibold">Menu</div>
              <button
                aria-label="Close navigation"
                className="p-2 rounded-md hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                onClick={() => setShowMobileNav(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <ul className="mt-1 divide-y divide-slate-200 dark:divide-slate-800">
              {nav.map((n) => (
                <li key={`sheet-${n.to}`}>
                  <Link
                    to={n.to}
                    onClick={() => setShowMobileNav(false)}
                    className={
                      'flex items-center gap-2 px-3 py-3 rounded-md ' +
                      (pathname === n.to ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')
                    }
                  >
                    <Icon name={n.icon} />
                    <span className="text-sm">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
          <div className="relative w-full max-w-sm mx-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg shadow-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M19 12H5"/></svg>
              <h3 id="logout-title" className="text-lg font-semibold">Sign out</h3>
            </div>
            <p id="logout-desc" className="text-slate-700 dark:text-slate-300 text-sm mb-4">Are you sure you want to log out?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={closeLogoutDialog} className="px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200">Cancel</button>
              <button ref={confirmBtnRef} onClick={confirmLogout} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white">Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
