import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variable
 * The key should be a 32-byte base64-encoded string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (256 bits)`);
  }

  return keyBuffer;
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns a base64-encoded string containing: IV + Auth Tag + Encrypted Data
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16); // 128-bit IV

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV + Auth Tag + Encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt a string encrypted with the encrypt() function
 * Expects a base64-encoded string containing: IV + Auth Tag + Encrypted Data
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedText, 'base64');

  // Extract IV, Auth Tag, and encrypted data
  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const encrypted = combined.subarray(32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
