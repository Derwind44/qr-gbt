'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

// UI hint only. Real access control lives in proxy.ts and every /api route (httpOnly session cookie).
let isAdminState = false;
let checked = false;
let pending: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function setState(value: boolean) {
  isAdminState = value;
  checked = true;
  listeners.forEach((l) => l());
}

export function refreshAdminSession(): Promise<boolean> {
  pending ??= fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : { isAdmin: false }))
    .then((d) => Boolean(d.isAdmin))
    .catch(() => false)
    .then((value) => {
      pending = null;
      setState(value);
      return value;
    });
  return pending;
}

export async function loginAdmin(username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setState(true);
      return null;
    }
    const data = await res.json().catch(() => null);
    return data?.error || 'Gagal masuk. Coba lagi.';
  } catch {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  }
}

export async function logoutAdmin() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  setState(false);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!checked) refreshAdminSession();
  return () => listeners.delete(callback);
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, () => isAdminState, () => false);
}

/** Redirects to /login when no admin session exists. Returns whether the page may render. */
export function useAdminGuard(): boolean {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    refreshAdminSession().then((ok) => {
      if (!ok) router.replace('/login');
    });
  }, [router]);

  return isAdmin;
}
