import { NextResponse } from "next/server";
import { serverError } from "@/lib/server/guard";
import { findJemaat } from "@/lib/server/jemaat";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { JEMAAT_PUBLIC_COLUMNS } from "@/lib/types";

/** Public QR lookup. Returns only non-sensitive fields. */
export async function GET(request: Request) {
  if (!rateLimit(`scan:${clientIp(request)}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Tunggu sebentar." }, { status: 429 });
  }

  const code = new URL(request.url).searchParams.get("code") ?? "";
  try {
    const jemaat = await findJemaat(code, JEMAAT_PUBLIC_COLUMNS);
    return NextResponse.json(jemaat, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError(err, "Gagal mencari data.");
  }
}
