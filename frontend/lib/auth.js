'use client';

const ACCESS_KEY = 'zb_access';
const ROLE_KEY = 'zb_role';

export function setSession(access, role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(ROLE_KEY, role || '');
}

export function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACCESS_KEY) || '';
}

export function getRole() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ROLE_KEY) || '';
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ROLE_KEY);
}
