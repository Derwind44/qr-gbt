// Usage: node scripts/hash-password.mjs "password-baru"
// Copy the output into ADMIN_PASSWORD_HASH.
import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Pakai: node scripts/hash-password.mjs "<password minimal 10 karakter>"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
