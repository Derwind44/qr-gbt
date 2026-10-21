import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { findJemaat } from "@/lib/server/jemaat";
import { db } from "@/lib/server/supabaseAdmin";

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();

  const params = new URL(request.url).searchParams;
  const sessionId = params.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id wajib diisi." }, { status: 400 });

  try {
    if (params.get("count") === "1") {
      const { count, error } = await db()
        .from("presensi")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId);
      if (error) throw error;
      return NextResponse.json({ count: count ?? 0 });
    }

    const { data, error } = await db()
      .from("presensi")
      .select("*")
      .eq("session_id", sessionId)
      .order("scan_time", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return serverError(err, "Gagal memuat presensi.");
  }
}

/** Body: { session_id, code } — the jemaat is resolved server-side so names can't be spoofed. */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const body = await request.json();
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";
    const code = typeof body.code === "string" ? body.code : "";
    if (!sessionId || !code) {
      return NextResponse.json({ status: "error", message: "Data scan tidak lengkap." }, { status: 400 });
    }

    const jemaat = await findJemaat(code, "id,id_jemaat,full_name");
    if (!jemaat) return NextResponse.json({ status: "not_found" });

    const { data: existing, error: dupErr } = await db()
      .from("presensi")
      .select("id")
      .eq("session_id", sessionId)
      .eq("id_jemaat", jemaat.id_jemaat)
      .limit(1)
      .maybeSingle();
    if (dupErr) throw dupErr;
    if (existing) return NextResponse.json({ status: "duplicate", full_name: jemaat.full_name });

    const { data, error } = await db()
      .from("presensi")
      .insert([{ session_id: sessionId, jemaat_id: jemaat.id, id_jemaat: jemaat.id_jemaat, full_name: jemaat.full_name }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ status: "success", record: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Gagal mencatat presensi." }, { status: 500 });
  }
}
