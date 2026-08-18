import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Phase 2B rules #2-4: Lab Number, Result Reference and Access Code must
 * stay separate; the Result Reference must be opaque/random (never derived
 * from the lab number or a database id); the Access Code must be stored
 * only as a hash.
 *
 * These are pure helpers with no table access — used by
 * lib/data/labReports.ts when a report transitions to "published".
 */

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/**
 * Generates an opaque public Result Reference, e.g. "SML-7K9X-4QRT".
 * Not sequential, not derived from lab_number or any database id.
 */
export function generateResultReference(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `SML-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

/**
 * Generates a short numeric access code for the future public portal
 * (not wired to anything public in this phase) and its hash. Only the hash
 * is ever persisted — the plaintext is returned once, to be delivered to
 * the patient out-of-band (SMS/email/WhatsApp), never stored or logged.
 */
export function generateAccessCode(): { plaintext: string; hash: string } {
  const bytes = randomBytes(4);
  const plaintext = (bytes.readUInt32BE(0) % 1_000_000).toString().padStart(6, "0");
  return { plaintext, hash: hashAccessCode(plaintext) };
}

const SCRYPT_KEYLEN = 64;

export function hashAccessCode(plaintext: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plaintext, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyAccessCode(plaintext: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(plaintext, salt, SCRYPT_KEYLEN);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
