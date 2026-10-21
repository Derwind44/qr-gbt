import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { findJemaat, patchJemaat, removeJemaat } from "@/lib/server/jemaat";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Data jemaat tidak ditemukan." }, { status: 404 });

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const jemaat = await findJemaat(decodeURIComponent((await params).id));
    return jemaat ? NextResponse.json(jemaat) : notFound();
  } catch (err) {
    return serverError(err, "Gagal memuat data jemaat.");
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const updated = await patchJemaat(decodeURIComponent((await params).id), await request.json());
    return updated ? NextResponse.json(updated) : notFound();
  } catch (err) {
    return serverError(err, "Gagal menyimpan perubahan.");
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return (await removeJemaat(decodeURIComponent((await params).id))) ? NextResponse.json({ ok: true }) : notFound();
  } catch (err) {
    return serverError(err, "Gagal menghapus data jemaat.");
  }
}
