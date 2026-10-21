import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { db, KTP_BUCKET } from "@/lib/server/supabaseAdmin";

/** Admin-only: redirects to a 60-second signed URL for a KTP photo in the private bucket. */
export async function GET(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();

  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!/^[a-zA-Z0-9._-]+$/.test(path)) {
    return NextResponse.json({ error: "Path tidak valid." }, { status: 400 });
  }

  try {
    const { data, error } = await db().storage.from(KTP_BUCKET).createSignedUrl(path, 60);
    if (error || !data) {
      return NextResponse.json({ error: "Foto KTP tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return serverError(err, "Gagal membuka foto KTP.");
  }
}
