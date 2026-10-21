import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/server/password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/server/session";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/server/rateLimit";
import { serverError } from "@/lib/server/guard";

export async function POST(request: Request) {
  const key = `login:${clientIp(request)}`;
  if (!rateLimit(key, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }

    resetRateLimit(key);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, await createSessionToken(username), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    return serverError(err, "Login belum dikonfigurasi di server.");
  }
}
