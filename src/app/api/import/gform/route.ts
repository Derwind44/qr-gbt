import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/server/guard";
import { insertJemaat, purgeExpiredTrash } from "@/lib/server/jemaat";
import { db } from "@/lib/server/supabaseAdmin";

/** Called by the Google Apps Script with header `x-import-secret: <IMPORT_SECRET>`. */
function hasValidSecret(request: Request): boolean {
  const expected = process.env.IMPORT_SECRET ?? "";
  const given = request.headers.get("x-import-secret") ?? "";
  return (
    expected.length >= 32 &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}

/** Insert one jemaat from a Google Form submission. id_jemaat and qr_token are generated here. */
export async function POST(request: Request) {
  if (!hasValidSecret(request)) return unauthorized();
  try {
    const jemaat = await insertJemaat(await request.json());
    return NextResponse.json({ ok: true, id_jemaat: jemaat.id_jemaat }, { status: 201 });
  } catch (err) {
    return serverError(err, "Gagal menyimpan data dari Google Form.");
  }
}

/** Daily keep-alive ping (keeps the free Supabase project awake) that also empties expired trash. */
export async function GET(request: Request) {
  if (!hasValidSecret(request)) return unauthorized();
  try {
    const { error } = await db().from("jemaat").select("id").limit(1);
    if (error) throw error;
    const trash = await purgeExpiredTrash();
    return NextResponse.json({ ok: true, ...trash });
  } catch (err) {
    return serverError(err, "Database tidak dapat dihubungi.");
  }
}
