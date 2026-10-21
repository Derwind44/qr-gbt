import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { db } from "@/lib/server/supabaseAdmin";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const { data, error } = await db().from("sessions").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return serverError(err, "Gagal memuat sesi.");
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const event_date = typeof body.event_date === "string" ? body.event_date : "";
    const description = typeof body.description === "string" ? body.description.trim() : null;
    if (!name || !event_date) {
      return NextResponse.json({ error: "Nama dan tanggal sesi wajib diisi." }, { status: 400 });
    }

    const { data, error } = await db()
      .from("sessions")
      .insert([{ name, event_date, description, is_active: true }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return serverError(err, "Gagal membuat sesi.");
  }
}
