import { NextResponse } from "next/server";
import { Readable } from "stream";
import { isAdminRequest, unauthorized } from "@/lib/server/guard";
import { getDrive } from "@/lib/server/googleDrive";

type Ctx = { params: Promise<{ id: string }> };

/** Streams a private Drive image (e.g. KTP) to a logged-in admin via the service account. */
export async function GET(_request: Request, { params }: Ctx) {
  if (!(await isAdminRequest())) return unauthorized();

  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{15,}$/.test(id)) {
    return NextResponse.json({ error: "ID file tidak valid." }, { status: 400 });
  }

  const drive = getDrive();
  if (!drive) return NextResponse.json({ error: "Google Drive belum dikonfigurasi." }, { status: 500 });

  try {
    const meta = await drive.files.get({ fileId: id, fields: "mimeType", supportsAllDrives: true });
    const mimeType = meta.data.mimeType ?? "";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "File bukan gambar." }, { status: 415 });
    }

    const file = await drive.files.get(
      { fileId: id, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    );

    return new Response(Readable.toWeb(file.data as Readable) as ReadableStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Drive file proxy error:", err);
    return NextResponse.json(
      { error: "File tidak bisa dibuka. Pastikan foldernya sudah di-share ke service account." },
      { status: 404 },
    );
  }
}
