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
}
