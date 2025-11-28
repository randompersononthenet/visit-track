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
