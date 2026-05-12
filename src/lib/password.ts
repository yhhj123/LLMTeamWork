// Password hashing using Node's built-in scrypt. No bcrypt dep needed.
//
// Stored hash format:   scrypt$<N>$<saltHex>$<derivedHex>
// where N is the keylen (we use 64). scrypt's other parameters use the
// defaults baked into node:crypto, which are appropriate for interactive
// logins as of Node 20+.

import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, KEY_LEN);
  return `scrypt$${KEY_LEN}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const keylen = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (!keylen || expected.length !== keylen) return false;
  const derived = await scryptAsync(plain, salt, keylen);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
