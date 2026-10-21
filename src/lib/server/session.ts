// Uses Web Crypto only, so it runs in both route handlers and proxy.ts.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET minimal 32 karakter harus diisi di environment server.");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${encodeURIComponent(username)}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [user, exp, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;

  try {
    return safeEqual(sig, await sign(`${user}.${exp}`));
  } catch {
    return false;
  }
}
