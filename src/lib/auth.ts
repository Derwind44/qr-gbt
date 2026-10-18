'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'admin_authenticated';
const LOGIN_TIME_KEY = 'admin_login_time';
const AUTH_EVENT = 'admin-auth-change';

export function readIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminSession() {
  sessionStorage.setItem(AUTH_KEY, 'true');
  sessionStorage.setItem(LOGIN_TIME_KEY, new Date().toISOString());
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAdminSession() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(LOGIN_TIME_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, readIsAdmin, () => false);
}

/** Redirects to /login when no admin session exists. Returns whether the page may render. */
export function useAdminGuard(): boolean {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!readIsAdmin()) router.replace('/login');
  }, [router]);

  return isAdmin;
}
