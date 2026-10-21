import { NextResponse } from "next/server";
import { isAdminRequest, serverError, unauthorized } from "@/lib/server/guard";
import { removePublicAccess } from "@/lib/server/googleDrive";
import { db } from "@/lib/server/supabaseAdmin";
import { extractGoogleDriveFileId } from "@/lib/gdrive";

/**
 * One-off: remove "anyone with the link" access from every KTP photo stored in the database.
 * Files the service account cannot change (e.g. owned by the Google Form owner) are returned in
 * `failed` — lock those with lockKtpFiles() in the Apps Script.
 */
export async function POST() {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const { data, error } = await db().from("jemaat").select("id_jemaat,ktp_photo_url").not("ktp_photo_url", "is", null);
    if (error) throw error;

    const locked: string[] = [];
    const failed: string[] = [];
    for (const row of data ?? []) {
      const fileId = extractGoogleDriveFileId(row.ktp_photo_url ?? "");
      if (!fileId) continue;
      try {
        ((await removePublicAccess(fileId)) ? locked : failed).push(row.id_jemaat);
      } catch {
        failed.push(row.id_jemaat);
      }
    }

    return NextResponse.json({ locked: locked.length, failed });
  } catch (err) {
    return serverError(err, "Gagal mengunci foto KTP.");
  }
}
