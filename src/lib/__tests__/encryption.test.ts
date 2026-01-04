import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

describe('encryption', () => {
  // The setup file already sets ENCRYPTION_KEY, but we can override for specific tests

  describe('encrypt', () => {
    it('encrypts a string and returns base64', () => {
      const plaintext = 'secret-token-12345';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTypeOf('string');
      expect(encrypted).not.toBe(plaintext);
      // Base64 should be longer due to IV (16) + AuthTag (16) + data
      expect(encrypted.length).toBeGreaterThan(44);
    });

    it('produces different ciphertext for same input (random IV)', () => {
      const plaintext = 'same-input';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Each encryption should produce different output due to random IV
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('handles empty string', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeTypeOf('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('handles long strings', () => {
      const longString = 'a'.repeat(10000);
      const encrypted = encrypt(longString);
      expect(encrypted).toBeTypeOf('string');
    });

    it('handles unicode characters', () => {
      const unicodeText = 'Token with emoji 🎵 and unicode: 日本語';
      const encrypted = encrypt(unicodeText);
      expect(encrypted).toBeTypeOf('string');
    });

    it('handles special characters in tokens', () => {
      const specialChars = 'token/with+special=chars&more!@#$%^&*()';
      const encrypted = encrypt(specialChars);
      expect(encrypted).toBeTypeOf('string');
    });

    it('throws when ENCRYPTION_KEY is missing', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('throws when ENCRYPTION_KEY has wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      // Set a key that's too short (not 32 bytes)
      process.env.ENCRYPTION_KEY = Buffer.from('short-key').toString('base64');

      expect(() => encrypt('test')).toThrow('must be 32 bytes');

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('decrypt', () => {
    it('decrypts an encrypted string back to original', () => {
      const plaintext = 'my-secret-discogs-token';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('handles empty string roundtrip', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('handles unicode characters roundtrip', () => {
      const plaintext = 'Token with emoji 🎵 and unicode: 日本語';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('handles special characters roundtrip', () => {
      const plaintext = 'oauth_token=abc123&oauth_secret=xyz789!@#';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('handles long string roundtrip', () => {
      const longString = 'a'.repeat(10000);
      const encrypted = encrypt(longString);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longString);
    });

    it('throws on tampered ciphertext (modified data)', () => {
      const encrypted = encrypt('secret');
      // Tamper with the encrypted data (last few characters)
      const tampered = encrypted.slice(0, -4) + 'XXXX';

      expect(() => decrypt(tampered)).toThrow();
    });

    it('throws on invalid base64 input', () => {
      expect(() => decrypt('not-valid-base64!!!')).toThrow();
    });

    it('throws on truncated ciphertext', () => {
      const encrypted = encrypt('secret');
      // Truncate to less than IV + AuthTag (32 bytes)
      const truncated = encrypted.slice(0, 20);

      expect(() => decrypt(truncated)).toThrow();
    });

    it('throws when decrypting with wrong key', () => {
      const plaintext = 'secret';
      const encrypted = encrypt(plaintext);

      // Change the key
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = Buffer.from('b'.repeat(32)).toString('base64');

      // Should throw because auth tag won't match
      expect(() => decrypt(encrypted)).toThrow();

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('encrypt/decrypt integration', () => {
    it('handles multiple sequential encrypt/decrypt operations', () => {
      const tokens = [
        'token1-abc123',
        'token2-xyz789',
        'oauth_access_token_secret',
      ];

      for (const token of tokens) {
        const encrypted = encrypt(token);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(token);
      }
    });

    it('encrypted values can be stored and retrieved', () => {
      // Simulate storing and retrieving from database
      const originalToken = 'access-token-from-discogs';
      const encryptedForStorage = encrypt(originalToken);

      // Simulate some time passing or data transfer
      const retrievedFromStorage = encryptedForStorage;

      const decryptedToken = decrypt(retrievedFromStorage);
      expect(decryptedToken).toBe(originalToken);
    });
  });
});
