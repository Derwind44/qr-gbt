import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { db } from "@/lib/server/supabaseAdmin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const { is_active } = await request.json();
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active harus boolean." }, { status: 400 });
    }
    const { error } = await db().from("sessions").update({ is_active }).eq("id", (await params).id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Gagal mengubah sesi.");
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const { error } = await db().from("sessions").delete().eq("id", (await params).id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Gagal menghapus sesi.");
  }
}
