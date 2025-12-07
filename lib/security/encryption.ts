/**
 * Encryption utilities for sensitive fields
 * Uses AES-GCM encryption via Node.js crypto
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Derive encryption key from master secret
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 */
export function encrypt(plaintext: string, masterSecret?: string): string {
  const secret = masterSecret || process.env.ENCRYPTION_SECRET || "";
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET not configured");
  }

  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine salt + iv + authTag + encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, masterSecret?: string): string {
  const secret = masterSecret || process.env.ENCRYPTION_SECRET || "";
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET not configured");
  }

  const combined = Buffer.from(encryptedData, "base64");

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(secret, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt sensitive fields in an object
 */
export function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  masterSecret?: string
): T {
  const encrypted = { ...data };
  for (const field of fieldsToEncrypt) {
    if (data[field] && typeof data[field] === "string") {
      encrypted[field] = encrypt(data[field] as string, masterSecret) as T[keyof T];
    }
  }
  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 */
export function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt: (keyof T)[],
  masterSecret?: string
): T {
  const decrypted = { ...data };
  for (const field of fieldsToDecrypt) {
    if (data[field] && typeof data[field] === "string") {
      try {
        decrypted[field] = decrypt(data[field] as string, masterSecret) as T[keyof T];
      } catch (error) {
        // If decryption fails, field might not be encrypted
        console.warn(`Failed to decrypt field ${String(field)}:`, error);
      }
    }
  }
  return decrypted;
}

