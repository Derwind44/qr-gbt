import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { purgeJemaat, restoreJemaat } from "@/lib/server/jemaat";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Data tidak ada di sampah." }, { status: 404 });

/** Restore from trash. */
export async function POST(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return (await restoreJemaat((await params).id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (err) {
    return serverError(err, "Gagal memulihkan data.");
  }
}

/** Delete permanently, including the KTP file in the private bucket. */
export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const result = await purgeJemaat((await params).id);
    return result.purged ? NextResponse.json(result) : notFound();
  } catch (err) {
    return serverError(err, "Gagal menghapus permanen.");
  }
}
