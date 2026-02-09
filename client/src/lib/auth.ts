export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vt_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vt_token');
  localStorage.removeItem('vt_role');
  localStorage.removeItem('vt_username');
}

export function getRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vt_role');
}

export function setRole(role: string | null) {
  if (typeof window === 'undefined') return;
  if (role) localStorage.setItem('vt_role', role);
  else localStorage.removeItem('vt_role');
}

export function hasRole(roles: string[]): boolean {
  const r = getRole();
  if (!r) return false;
  return roles.includes(r);
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vt_username');
}

export function setUsername(username: string | null) {
  if (typeof window === 'undefined') return;
  if (username) localStorage.setItem('vt_username', username);
  else localStorage.removeItem('vt_username');
}

export function getPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem('vt_permissions');
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function setPermissions(perms: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vt_permissions', JSON.stringify(perms));
}

export function hasPermission(slug: string): boolean {
  if (getRole() === 'admin') return true;
  const perms = getPermissions();
  return perms.includes(slug);
}
