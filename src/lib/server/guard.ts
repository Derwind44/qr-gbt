import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: "Sesi admin tidak valid. Silakan masuk lagi." }, { status: 401 });
}

export function serverError(err: unknown, fallback = "Terjadi kesalahan di server.") {
  console.error(err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
