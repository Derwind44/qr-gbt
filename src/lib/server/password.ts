import { scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash format: scrypt:<saltHex>:<hashHex> (legacy "$" separator also accepted)
 * Generate with: node scripts/hash-password.mjs "<password>"
 */
export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [algo, saltHex, hashHex] = stored.split(/[:$]/);
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const userOk =
    expectedUser.length > 0 &&
    username.length === expectedUser.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(expectedUser));
  // Always run scrypt so a wrong username takes as long as a wrong password.
  const passOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  return userOk && passOk;
}
