import { apiFetch } from "./api";

// ============================================================
// TYPES
// ============================================================
export interface Session {
  id: string;
  name: string;
  event_date: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PresensiRecord {
  id: string;
  session_id: string;
  jemaat_id: string;
  id_jemaat: string;
  full_name: string;
  scan_time: string;
}

export type RecordPresensiResult =
  | { status: "success"; record: PresensiRecord }
  | { status: "duplicate"; full_name: string }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ============================================================
// SESSIONS
// ============================================================

/** Fetch all sessions, newest first */
export function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>("/api/sessions");
}

/** Create a new session */
export function createSession(payload: {
  name: string;
  event_date: string;
  description?: string;
}): Promise<Session> {
  return apiFetch<Session>("/api/sessions", { method: "POST", body: JSON.stringify(payload) });
}

/** Toggle session active status */
export async function toggleSessionActive(id: string, is_active: boolean): Promise<void> {
  await apiFetch(`/api/sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

/** Delete a session (cascade deletes all presensi for it) */
export async function deleteSession(id: string): Promise<void> {
  await apiFetch(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ============================================================
// PRESENSI
// ============================================================

/**
 * Record presence for the jemaat behind a scanned code.
 * The server resolves the code, so the client never sends names or ids it could spoof.
 */
export function recordPresensi(params: { session_id: string; code: string }): Promise<RecordPresensiResult> {
  return apiFetch<RecordPresensiResult>("/api/presensi", { method: "POST", body: JSON.stringify(params) });
}

/** Get all presensi records for a session, newest first */
export function getPresensiBySession(session_id: string): Promise<PresensiRecord[]> {
  return apiFetch<PresensiRecord[]>(`/api/presensi?session_id=${encodeURIComponent(session_id)}`);
}

/** Count total present jemaat for a session */
export async function countPresensi(session_id: string): Promise<number> {
  const { count } = await apiFetch<{ count: number }>(
    `/api/presensi?session_id=${encodeURIComponent(session_id)}&count=1`,
  );
  return count;
}
