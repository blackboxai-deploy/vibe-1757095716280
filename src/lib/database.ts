import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

interface Database {
  run: (sql: string, params?: any[]) => Promise<any>;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

let db: Database | null = null;

/**
 * Initialize SQLite database
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const sqlite = sqlite3.verbose();
  const database = new sqlite.Database(':memory:'); // In-memory database for demo
  
  // Promisify database methods
  const promiseDb: Database = {
    run: (sql: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        database.run(sql, params || [], function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    get: (sql: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        database.get(sql, params || [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        database.all(sql, params || [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    },
    close: () => {
      return new Promise((resolve) => {
        database.close(() => resolve());
      });
    }
  };

  // Create tables
  await createTables(promiseDb);
  
  // Insert sample data
  await insertSampleData(promiseDb);
  
  db = promiseDb;
  return db;
}

/**
 * Create database tables
 */
async function createTables(database: Database): Promise<void> {
  // Admin users table
  await database.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Devices table
  await database.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      device_type TEXT DEFAULT 'android',
      admin_id TEXT NOT NULL,
      connected BOOLEAN DEFAULT FALSE,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      device_info TEXT,
      FOREIGN KEY (admin_id) REFERENCES admin_users (id)
    )
  `);

  // Sessions table
  await database.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      token TEXT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices (id),
      FOREIGN KEY (admin_id) REFERENCES admin_users (id)
    )
  `);

  // Activity logs table
  await database.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (id),
      FOREIGN KEY (admin_id) REFERENCES admin_users (id)
    )
  `);

  // Commands table
  await database.run(`
    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      command TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      output TEXT,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices (id)
    )
  `);
}

/**
 * Insert sample data for demo
 */
async function insertSampleData(database: Database): Promise<void> {
  // Insert default admin user (password is hashed version of 'admin123')
  const adminId = 'admin-001';
  const hashedPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/JCBozTOHJQKt5mJI6'; // bcrypt hash of 'admin123'
  
  try {
    await database.run(
      'INSERT OR IGNORE INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)',
      [adminId, 'admin', hashedPassword]
    );

    // Insert sample devices
    const devices = [
      {
        id: 'device-001',
        name: 'Samsung Galaxy S23',
        info: JSON.stringify({
          model: 'Samsung Galaxy S23',
          android_version: '14.0',
          api_level: 34,
          manufacturer: 'Samsung',
          brand: 'samsung',
          hardware: 'qcom',
          ram: '8GB',
          storage: '256GB',
          battery_level: 85,
          screen_resolution: '1080x2340',
          network_type: 'WiFi'
        })
      },
      {
        id: 'device-002', 
        name: 'Pixel 8 Pro',
        info: JSON.stringify({
          model: 'Google Pixel 8 Pro',
          android_version: '14.0',
          api_level: 34,
          manufacturer: 'Google',
          brand: 'google',
          hardware: 'tensor',
          ram: '12GB',
          storage: '512GB',
          battery_level: 72,
          screen_resolution: '1344x2992',
          network_type: '5G'
        })
      }
    ];

    for (const device of devices) {
      await database.run(
        'INSERT OR IGNORE INTO devices (id, device_name, admin_id, device_info, connected) VALUES (?, ?, ?, ?, ?)',
        [device.id, device.name, adminId, device.info, false]
      );
    }

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

/**
 * Device operations
 */
export async function getConnectedDevices(adminId: string): Promise<any[]> {
  const database = await initDatabase();
  return await database.all(
    'SELECT * FROM devices WHERE admin_id = ? ORDER BY last_seen DESC',
    [adminId]
  );
}

export async function getDeviceById(deviceId: string): Promise<any | null> {
  const database = await initDatabase();
  return await database.get(
    'SELECT * FROM devices WHERE id = ?',
    [deviceId]
  );
}

export async function updateDeviceStatus(deviceId: string, connected: boolean): Promise<void> {
  const database = await initDatabase();
  await database.run(
    'UPDATE devices SET connected = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
    [connected, deviceId]
  );
}

export async function createDevice(deviceData: {
  id: string;
  deviceName: string;
  adminId: string;
  deviceInfo?: any;
}): Promise<void> {
  const database = await initDatabase();
  await database.run(
    'INSERT INTO devices (id, device_name, admin_id, device_info, connected) VALUES (?, ?, ?, ?, ?)',
    [deviceData.id, deviceData.deviceName, deviceData.adminId, JSON.stringify(deviceData.deviceInfo || {}), true]
  );
}

/**
 * Session operations
 */
export async function createSession(sessionData: {
  deviceId: string;
  adminId: string;
  token: string;
  expiresAt: Date;
}): Promise<string> {
  const database = await initDatabase();
  const sessionId = uuidv4();
  
  await database.run(
    'INSERT INTO sessions (id, device_id, admin_id, token, expires_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, sessionData.deviceId, sessionData.adminId, sessionData.token, sessionData.expiresAt.toISOString()]
  );
  
  return sessionId;
}

export async function getActiveSession(deviceId: string): Promise<any | null> {
  const database = await initDatabase();
  return await database.get(
    'SELECT * FROM sessions WHERE device_id = ? AND active = TRUE AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
    [deviceId]
  );
}

/**
 * Activity logging
 */
export async function logActivity(activityData: {
  deviceId: string;
  adminId: string;
  action: string;
  details?: any;
}): Promise<void> {
  const database = await initDatabase();
  const activityId = uuidv4();
  
  await database.run(
    'INSERT INTO activity_logs (id, device_id, admin_id, action, details) VALUES (?, ?, ?, ?, ?)',
    [activityId, activityData.deviceId, activityData.adminId, activityData.action, JSON.stringify(activityData.details || {})]
  );
}

export async function getRecentActivity(deviceId: string, limit: number = 50): Promise<any[]> {
  const database = await initDatabase();
  return await database.all(
    'SELECT * FROM activity_logs WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?',
    [deviceId, limit]
  );
}

/**
 * Command operations
 */
export async function createCommand(commandData: {
  deviceId: string;
  command: string;
}): Promise<string> {
  const database = await initDatabase();
  const commandId = uuidv4();
  
  await database.run(
    'INSERT INTO commands (id, device_id, command) VALUES (?, ?, ?)',
    [commandId, commandData.deviceId, commandData.command]
  );
  
  return commandId;
}

export async function updateCommandResult(commandId: string, result: {
  status: 'success' | 'error' | 'timeout';
  output?: string;
  error?: string;
}): Promise<void> {
  const database = await initDatabase();
  await database.run(
    'UPDATE commands SET status = ?, output = ?, error = ?, executed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [result.status, result.output, result.error, commandId]
  );
}

export async function getPendingCommands(deviceId: string): Promise<any[]> {
  const database = await initDatabase();
  return await database.all(
    'SELECT * FROM commands WHERE device_id = ? AND status = "pending" ORDER BY created_at ASC',
    [deviceId]
  );
}

/**
 * Cleanup expired sessions and logs
 */
export async function cleanupExpiredData(): Promise<void> {
  const database = await initDatabase();
  
  // Deactivate expired sessions
  await database.run(
    'UPDATE sessions SET active = FALSE WHERE expires_at <= CURRENT_TIMESTAMP AND active = TRUE'
  );
  
  // Delete old activity logs (older than 30 days)
  await database.run(
    'DELETE FROM activity_logs WHERE timestamp < datetime("now", "-30 days")'
  );
  
  // Delete old commands (older than 7 days)
  await database.run(
    'DELETE FROM commands WHERE created_at < datetime("now", "-7 days")'
  );
}