import { randomBytes, randomInt } from "crypto";
import { Jemaat } from "../types";
import { db } from "./supabaseAdmin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Columns the client may write. id, id_jemaat, qr_token and created_at are set by the server only. */
const WRITABLE_COLUMNS = new Set([
  "nik",
  "full_name",
  "gender",
  "birth_place",
  "birth_date",
  "address",
  "phone",
  "email",
  "join_year",
  "marital_status",
  "spouse_name",
  "children_count",
  "children_detail",
  "father_name",
  "mother_name",
  "church_role",
  "potentials",
  "is_joined_division",
  "joined_divisions",
  "category",
  "status",
  "ktp_photo_url",
  "profile_photo_url",
]);

function cleanPayload(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (!WRITABLE_COLUMNS.has(key) || val === undefined || val === null) continue;
    if (key === "potentials" || key === "joined_divisions") {
      cleaned[key] = Array.isArray(val) ? val.filter((v) => typeof v === "string") : [];
    } else if (typeof val === "string") {
      cleaned[key] = val.trim();
    }
  }
  return cleaned;
}

/**
 * Human-readable ID: (2 Inisial Nama)-(4 Digit Random)(DDMMYY)
 * Example: Budi Santoso born 06/08/1995 -> BU-4829060895
 */
function generateIdJemaat(fullName: string, birthDate: string): string {
  const cleanName = fullName.trim().replace(/[^a-zA-Z]/g, "");
  const initials = (cleanName + "XX").substring(0, 2).toUpperCase();
  const random4Digit = randomInt(1000, 10000);

  let ddmmyy = "010100";
  const parts = birthDate?.split("-") ?? [];
  if (parts.length === 3) {
    ddmmyy = `${parts[2].padStart(2, "0")}${parts[1].padStart(2, "0")}${parts[0].slice(-2)}`;
  }

  return `${initials}-${random4Digit}${ddmmyy}`;
}

function generateQrToken(): string {
  return `tok-${randomBytes(16).toString("hex")}`;
}

export async function listJemaat(): Promise<Jemaat[]> {
  const { data, error } = await db().from("jemaat").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Jemaat[];
}

/** Find by UUID id, id_jemaat (case-insensitive) or qr_token. */
export async function findJemaat(code: string, columns = "*"): Promise<Jemaat | null> {
  const clean = code.trim();
  if (!clean || clean.length > 100) return null;

  const lookups: [string, string][] = [];
  if (UUID_RE.test(clean)) lookups.push(["id", clean]);
  lookups.push(["qr_token", clean], ["id_jemaat", clean.toUpperCase()]);

  for (const [column, value] of lookups) {
    const { data, error } = await db().from("jemaat").select(columns).eq(column, value).limit(1).maybeSingle();
    if (error) throw error;
    if (data) return data as unknown as Jemaat;
  }
  return null;
}

export async function insertJemaat(input: Record<string, unknown>): Promise<Jemaat> {
  const payload = cleanPayload(input);
  if (!payload.full_name) throw new Error("Nama lengkap wajib diisi.");

  const { data, error } = await db()
    .from("jemaat")
    .insert([
      {
        ...payload,
        id_jemaat: generateIdJemaat(String(payload.full_name), String(payload.birth_date ?? "")),
        qr_token: generateQrToken(),
      },
    ])
    .select("*")
    .single();
  if (error) throw error;
  return data as Jemaat;
}

export async function patchJemaat(code: string, updates: Record<string, unknown>): Promise<Jemaat | null> {
  const existing = await findJemaat(code, "id");
  if (!existing) return null;

  const { data, error } = await db()
    .from("jemaat")
    .update(cleanPayload(updates))
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Jemaat;
}

export async function removeJemaat(code: string): Promise<boolean> {
  const existing = await findJemaat(code, "id");
  if (!existing) return false;

  const { error } = await db().from("jemaat").delete().eq("id", existing.id);
  if (error) throw error;
  return true;
}
