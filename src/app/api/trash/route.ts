import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { listTrash, TRASH_RETENTION_DAYS } from "@/lib/server/jemaat";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return NextResponse.json({ retentionDays: TRASH_RETENTION_DAYS, items: await listTrash() });
  } catch (err) {
    return serverError(err, "Gagal memuat sampah.");
  }
}
