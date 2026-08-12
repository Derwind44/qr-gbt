import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  | { status: "duplicate" }
  | { status: "error"; message: string };

// ============================================================
// SESSIONS
// ============================================================

/** Fetch all sessions, newest first */
export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}

/** Create a new session */
export async function createSession(payload: {
  name: string;
  event_date: string;
  description?: string;
}): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert([{ ...payload, is_active: true }])
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

/** Toggle session active status */
export async function toggleSessionActive(
  id: string,
  is_active: boolean
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ is_active })
    .eq("id", id);
  if (error) throw error;
}

/** Delete a session (cascade deletes all presensi for it) */
export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// PRESENSI
// ============================================================

/**
 * Record a jemaat presence in a session.
 * Returns 'success', 'duplicate' (already scanned), or 'error'.
 */
export async function recordPresensi(params: {
  session_id: string;
  jemaat_id: string;
  id_jemaat: string;
  full_name: string;
}): Promise<RecordPresensiResult> {
  // Check for duplicate first
  const { data: existing } = await supabase
    .from("presensi")
    .select("id")
    .eq("session_id", params.session_id)
    .eq("id_jemaat", params.id_jemaat)
    .maybeSingle();

  if (existing) {
    return { status: "duplicate" };
  }

  const { data, error } = await supabase
    .from("presensi")
    .insert([params])
    .select()
    .single();

  if (error) return { status: "error", message: error.message };
  return { status: "success", record: data as PresensiRecord };
}

/** Get all presensi records for a session, newest first */
export async function getPresensiBySession(
  session_id: string
): Promise<PresensiRecord[]> {
  const { data, error } = await supabase
    .from("presensi")
    .select("*")
    .eq("session_id", session_id)
    .order("scan_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PresensiRecord[];
}

/** Count total present jemaat for a session */
export async function countPresensi(session_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("presensi")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session_id);
  if (error) throw error;
  return count ?? 0;
}
