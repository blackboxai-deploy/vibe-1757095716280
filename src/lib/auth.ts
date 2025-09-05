import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'remote-control-android-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: string;
  deviceId?: string;
  type: 'admin' | 'device';
  iat?: number;
  exp?: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  adminId: string;
  connected: boolean;
  lastSeen: string;
  createdAt: string;
}

// Default admin credentials
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  id: 'admin-001'
};

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generate admin login token
 */
export function generateAdminToken(adminId: string): string {
  return generateToken({
    userId: adminId,
    type: 'admin'
  });
}

/**
 * Generate device pairing token
 */
export function generateDeviceToken(adminId: string, deviceId: string): string {
  return generateToken({
    userId: adminId,
    deviceId,
    type: 'device'
  });
}

/**
 * Validate admin credentials
 */
export async function validateAdminCredentials(username: string, password: string): Promise<{ success: boolean; adminId?: string; message?: string }> {
  try {
    // For demo purposes, using default admin
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      return {
        success: true,
        adminId: DEFAULT_ADMIN.id
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Authentication error'
    };
  }
}

/**
 * Generate secure device ID
 */
export function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `device_${timestamp}_${random}`;
}

/**
 * Generate QR code data for device pairing
 */
export function generatePairingData(adminId: string): { deviceId: string; token: string; qrData: string } {
  const deviceId = generateDeviceId();
  const token = generateDeviceToken(adminId, deviceId);
  
  const pairingData = {
    deviceId,
    token,
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    timestamp: Date.now()
  };
  
  return {
    deviceId,
    token,
    qrData: JSON.stringify(pairingData)
  };
}

/**
 * Validate pairing token
 */
export function validatePairingToken(token: string): { success: boolean; adminId?: string; deviceId?: string; message?: string } {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { success: false, message: 'Invalid or expired token' };
  }
  
  if (decoded.type !== 'device' || !decoded.deviceId) {
    return { success: false, message: 'Invalid device token' };
  }
  
  return {
    success: true,
    adminId: decoded.userId,
    deviceId: decoded.deviceId
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return true;
    
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Refresh token if it's close to expiring
 */
export function refreshTokenIfNeeded(token: string): string | null {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  // Refresh if token expires in less than 2 hours
  const timeUntilExpiry = (decoded.exp! * 1000) - Date.now();
  if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
    return generateToken({
      userId: decoded.userId,
      deviceId: decoded.deviceId,
      type: decoded.type
    });
  }
  
  return token;
}