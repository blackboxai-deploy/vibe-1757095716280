import CryptoJS from 'crypto-js';

// Default encryption key - in production, use environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'remote-control-android-encryption-key-2024-secure';

/**
 * Encrypt sensitive data using AES-256
 */
export function encryptData(data: string, key?: string): string {
  try {
    const encryptionKey = key || ENCRYPTION_KEY;
    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256
 */
export function decryptData(encryptedData: string, key?: string): string {
  try {
    const encryptionKey = key || ENCRYPTION_KEY;
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Invalid encrypted data or key');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJSON(obj: any, key?: string): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString, key);
  } catch (error) {
    console.error('JSON encryption error:', error);
    throw new Error('Failed to encrypt JSON data');
  }
}

/**
 * Decrypt to JSON object
 */
export function decryptJSON(encryptedData: string, key?: string): any {
  try {
    const decrypted = decryptData(encryptedData, key);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('JSON decryption error:', error);
    throw new Error('Failed to decrypt JSON data');
  }
}

/**
 * Generate secure hash for data integrity
 */
export function generateHash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Generate HMAC for message authentication
 */
export function generateHMAC(message: string, key?: string): string {
  const hmacKey = key || ENCRYPTION_KEY;
  return CryptoJS.HmacSHA256(message, hmacKey).toString();
}

/**
 * Verify HMAC
 */
export function verifyHMAC(message: string, hmac: string, key?: string): boolean {
  try {
    const expectedHMAC = generateHMAC(message, key);
    return CryptoJS.enc.Hex.parse(hmac).toString() === CryptoJS.enc.Hex.parse(expectedHMAC).toString();
  } catch {
    return false;
  }
}

/**
 * Generate random encryption key
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString();
}

/**
 * Encrypt with timestamp for expiry
 */
export function encryptWithExpiry(data: string, expiryMinutes: number = 60, key?: string): string {
  const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
  const dataWithExpiry = {
    data,
    expires: expiryTime
  };
  return encryptJSON(dataWithExpiry, key);
}

/**
 * Decrypt and check expiry
 */
export function decryptWithExpiry(encryptedData: string, key?: string): { data: string; expired: boolean } | null {
  try {
    const decrypted = decryptJSON(encryptedData, key);
    const expired = Date.now() > decrypted.expires;
    
    return {
      data: decrypted.data,
      expired
    };
  } catch {
    return null;
  }
}

/**
 * Secure data transmission format
 */
export interface SecureMessage {
  payload: string;
  signature: string;
  timestamp: number;
}

/**
 * Create secure message with signature
 */
export function createSecureMessage(data: any, key?: string): SecureMessage {
  const timestamp = Date.now();
  const payload = encryptJSON(data, key);
  const messageToSign = `${payload}.${timestamp}`;
  const signature = generateHMAC(messageToSign, key);
  
  return {
    payload,
    signature,
    timestamp
  };
}

/**
 * Verify and decode secure message
 */
export function verifySecureMessage(message: SecureMessage, key?: string): { data: any; valid: boolean } {
  try {
    const messageToVerify = `${message.payload}.${message.timestamp}`;
    const isValid = verifyHMAC(messageToVerify, message.signature, key);
    
    if (!isValid) {
      return { data: null, valid: false };
    }
    
    const data = decryptJSON(message.payload, key);
    return { data, valid: true };
  } catch {
    return { data: null, valid: false };
  }
}