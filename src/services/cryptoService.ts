/**
 * ObsidianOS Cryptographic Service
 * Real client-side Zero-Knowledge End-to-End Encryption using WebCrypto API (AES-GCM 256-bit + PBKDF2)
 */

export class CryptoService {
  // Convert ArrayBuffer to Base64
  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convert Base64 to Uint8Array
  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Generate cryptographically secure random bytes
  public static generateSalt(length = 16): string {
    const salt = new Uint8Array(length);
    window.crypto.getRandomValues(salt);
    return this.bufferToBase64(salt.buffer);
  }

  // Generate a random IV for AES-GCM
  public static generateIV(length = 12): string {
    const iv = new Uint8Array(length);
    window.crypto.getRandomValues(iv);
    return this.bufferToBase64(iv.buffer);
  }

  // Compute SHA-256 checksum of arbitrary string
  public static async computeSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Derive an AES-GCM 256-bit key from password/pin and salt using PBKDF2
  private static async deriveKey(password: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt arbitrary data using AES-GCM-256 with PBKDF2 key derivation
   */
  public static async encryptData(
    data: any,
    passphrase: string,
    existingSalt?: string
  ): Promise<{
    ciphertext: string;
    iv: string;
    salt: string;
    checksum: string;
    algorithm: string;
  }> {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    const salt = existingSalt || this.generateSalt();
    const saltBuffer = this.base64ToBuffer(salt);
    const iv = this.generateIV();
    const ivBuffer = this.base64ToBuffer(iv);

    const key = await this.deriveKey(passphrase, saltBuffer);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      dataBuffer
    );

    const checksum = await this.computeSHA256(jsonString);
    const ciphertext = this.bufferToBase64(encryptedBuffer);

    return {
      ciphertext,
      iv,
      salt,
      checksum,
      algorithm: 'AES-256-GCM (PBKDF2-SHA256)',
    };
  }

  /**
   * Decrypt AES-GCM-256 ciphertext
   */
  public static async decryptData<T = any>(
    ciphertext: string,
    iv: string,
    salt: string,
    passphrase: string,
    expectedChecksum?: string
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const saltBuffer = this.base64ToBuffer(salt);
      const ivBuffer = this.base64ToBuffer(iv);
      const encryptedBuffer = this.base64ToBuffer(ciphertext);

      const key = await this.deriveKey(passphrase, saltBuffer);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      if (expectedChecksum) {
        const actualChecksum = await this.computeSHA256(plaintext);
        if (actualChecksum !== expectedChecksum) {
          return { success: false, error: 'Integritätsprüfung fehlgeschlagen: Prüfsumme stimmt nicht überein.' };
        }
      }

      try {
        const parsed = JSON.parse(plaintext);
        return { success: true, data: parsed };
      } catch {
        return { success: true, data: plaintext as unknown as T };
      }
    } catch (err: any) {
      return {
        success: false,
        error: 'Entschlüsselung fehlgeschlagen: Falscher Schlüssel/PIN oder beschädigte Cloud-Daten.',
      };
    }
  }

  /**
   * Generate an emergency encryption recovery key (BIP39-style words)
   */
  public static generateRecoveryKey(): string {
    const words = [
      'obsidian', 'nebula', 'cipher', 'vault', 'matrix', 'quantum', 'spectral', 'violet',
      'sentinel', 'kernel', 'horizon', 'astral', 'shadow', 'glacier', 'enigma', 'protocol',
      'vertex', 'aurora', 'prism', 'zenith', 'pulse', 'echo', 'flux', 'vortex'
    ];
    const selected: string[] = [];
    const randomVals = new Uint8Array(8);
    window.crypto.getRandomValues(randomVals);
    for (let i = 0; i < 8; i++) {
      selected.push(words[randomVals[i] % words.length]);
    }
    return selected.join('-');
  }
}
