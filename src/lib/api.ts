import { Jemaat, JemaatPublic } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || `Permintaan gagal (${res.status}).`, res.status);
  return data as T;
}

export function getAllJemaat(): Promise<Jemaat[]> {
  return apiFetch<Jemaat[]>("/api/jemaat");
}

/** Admin lookup by UUID id, id_jemaat or qr_token. Returns null when not found. */
export async function getJemaatByCodeOrId(code: string): Promise<Jemaat | null> {
  try {
    return await apiFetch<Jemaat>(`/api/jemaat/${encodeURIComponent(code.trim())}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Public lookup for the /scan page. Only non-sensitive fields come back. */
export function scanJemaat(code: string): Promise<JemaatPublic | null> {
  return apiFetch<JemaatPublic | null>(`/api/scan?code=${encodeURIComponent(code.trim())}`);
}

export function createJemaat(input: Partial<Jemaat>): Promise<Jemaat> {
  return apiFetch<Jemaat>("/api/jemaat", { method: "POST", body: JSON.stringify(input) });
}

export function updateJemaat(code: string, updates: Partial<Jemaat>): Promise<Jemaat> {
  return apiFetch<Jemaat>(`/api/jemaat/${encodeURIComponent(code)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteJemaat(code: string): Promise<boolean> {
  try {
    await apiFetch(`/api/jemaat/${encodeURIComponent(code)}`, { method: "DELETE" });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export interface TrashedJemaat {
  id: string;
  id_jemaat: string;
  full_name: string;
  profile_photo_url?: string;
  ktp_photo_url?: string;
  deleted_at: string;
}

export function getTrash(): Promise<{ retentionDays: number; items: TrashedJemaat[] }> {
  return apiFetch("/api/trash");
}

export async function restoreJemaat(id: string): Promise<void> {
  await apiFetch(`/api/trash/${encodeURIComponent(id)}`, { method: "POST" });
}

/** Returns the Drive link of a Google Form KTP that still has to be deleted by hand. */
export async function purgeJemaat(id: string): Promise<{ driveKtpUrl?: string }> {
  return apiFetch(`/api/trash/${encodeURIComponent(id)}`, { method: "DELETE" });
}
