import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { insertJemaat, listJemaat } from "@/lib/server/jemaat";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return NextResponse.json(await listJemaat());
  } catch (err) {
    return serverError(err, "Gagal memuat data jemaat.");
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const body = await request.json();
    return NextResponse.json(await insertJemaat(body), { status: 201 });
  } catch (err) {
    return serverError(err, "Gagal menyimpan data jemaat.");
  }
}
