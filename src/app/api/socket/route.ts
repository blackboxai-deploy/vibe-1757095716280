import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { DeviceSimulator } from '@/lib/deviceSimulator';
import { verifyToken } from '@/lib/auth';
import { logActivity, initDatabase } from '@/lib/database';

// Global socket server instance
let io: SocketIOServer | null = null;

// Connected devices and admin sessions
const connectedDevices = new Map<string, any>();
const adminSessions = new Map<string, string>(); // socketId -> adminId

export async function GET() {
  return NextResponse.json({ message: 'Socket.IO server endpoint' });
}

export async function POST() {
  if (!io) {
    await initSocketServer();
  }
  
  return NextResponse.json({ 
    status: 'Socket.IO server initialized',
    connectedDevices: connectedDevices.size,
    adminSessions: adminSessions.size
  });
}

async function initSocketServer() {
  try {
    // Initialize database
    await initDatabase();

    // Create HTTP server for Socket.IO
    const httpServer = createServer();
    
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Admin authentication
      socket.on('admin:authenticate', async (data) => {
        try {
          const { token } = data;
          const decoded = verifyToken(token);
          
          if (decoded && decoded.type === 'admin') {
            adminSessions.set(socket.id, decoded.userId);
            socket.emit('admin:authenticated', { success: true, adminId: decoded.userId });
            
            await logActivity({
              deviceId: 'system',
              adminId: decoded.userId,
              action: 'admin_websocket_connect',
              details: { socketId: socket.id, timestamp: new Date().toISOString() }
            });
          } else {
            socket.emit('admin:authenticated', { success: false, error: 'Invalid token' });
          }
        } catch (error) {
          socket.emit('admin:authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Admin joins room for device events
      socket.on('admin:join', (data) => {
        const { adminId } = data;
        socket.join(`admin:${adminId}`);
        
        // Send current connected devices
        const devices = Array.from(connectedDevices.values());
        socket.emit('devices:list', devices);
      });

      // Device connection simulation
      socket.on('device:register', (data) => {
        const { deviceId, deviceInfo, adminId } = data;
        
        connectedDevices.set(deviceId, {
          ...deviceInfo,
          socketId: socket.id,
          connectedAt: new Date().toISOString()
        });

        // Update device simulator
        DeviceSimulator.updateDeviceConnection(deviceId, true);
        
        // Notify admin
        socket.to(`admin:${adminId}`).emit('device:connect', {
          deviceId,
          deviceInfo
        });
        
        socket.emit('device:registered', { success: true, deviceId });
      });

      // Screen sharing
      socket.on('device:screenshot', async (data) => {
        const { deviceId } = data;
        
        try {
          const screenshot = DeviceSimulator.generateScreenshot(deviceId);
          socket.emit('screen:update', { deviceId, screenshot });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'screenshot_request',
              details: { timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Screenshot failed', deviceId });
        }
      });

      // Command execution
      socket.on('device:command', async (data) => {
        const { deviceId, command, commandId } = data;
        
        try {
          const result = DeviceSimulator.executeCommand(deviceId, command);
          
          socket.emit('command:result', {
            deviceId,
            commandId: commandId || result.id,
            result: {
              output: result.output,
              exitCode: result.exitCode,
              timestamp: result.timestamp
            }
          });

          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'command_execute',
              details: { command, result, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('command:result', {
            deviceId,
            commandId: commandId || 'error',
            result: { error: 'Command execution failed' }
          });
        }
      });

      // File operations
      socket.on('device:files', async (data) => {
        const { deviceId, path } = data;
        
        try {
          const files = DeviceSimulator.getFileSystem(deviceId, path);
          socket.emit('file:list', { deviceId, path, files });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'file_browse',
              details: { path, fileCount: files.length, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'File listing failed', deviceId });
        }
      });

      // Location tracking
      socket.on('device:location', async (data) => {
        const { deviceId } = data;
        
        try {
          const location = DeviceSimulator.getCurrentLocation(deviceId);
          socket.emit('location:update', { deviceId, location });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'location_request',
              details: { location, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Location request failed', deviceId });
        }
      });

      // Camera capture
      socket.on('device:camera', async (data) => {
        const { deviceId, camera } = data;
        
        try {
          const imageUrl = DeviceSimulator.captureCamera(deviceId, camera);
          socket.emit('camera:result', { deviceId, camera, imageUrl });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'camera_capture',
              details: { camera, imageUrl, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Camera capture failed', deviceId });
        }
      });

      // Audio recording
      socket.on('device:audio', async (data) => {
        const { deviceId, duration } = data;
        
        try {
          const audioData = DeviceSimulator.recordAudio(deviceId, duration);
          socket.emit('audio:result', { deviceId, audioData });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'audio_record',
              details: { duration, audioData, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Audio recording failed', deviceId });
        }
      });

      // App management
      socket.on('device:apps', async (data) => {
        const { deviceId } = data;
        
        try {
          const apps = DeviceSimulator.getInstalledApps(deviceId);
          socket.emit('app:list', { deviceId, apps });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'app_list',
              details: { appCount: apps.length, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'App listing failed', deviceId });
        }
      });

      // Notification
      socket.on('device:notify', async (data) => {
        const { deviceId, message } = data;
        
        try {
          DeviceSimulator.generateNotification(deviceId, message);
          socket.emit('notification:sent', { deviceId, message, success: true });
          
          // Log activity
          const adminId = adminSessions.get(socket.id);
          if (adminId) {
            await logActivity({
              deviceId,
              adminId,
              action: 'notification_send',
              details: { message, timestamp: new Date().toISOString() }
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Notification failed', deviceId });
        }
      });

      // Disconnect handling
      socket.on('disconnect', async (reason) => {
        console.log('Client disconnected:', socket.id, reason);
        
        // Remove admin session
        const adminId = adminSessions.get(socket.id);
        if (adminId) {
          adminSessions.delete(socket.id);
          
          await logActivity({
            deviceId: 'system',
            adminId,
            action: 'admin_websocket_disconnect',
            details: { socketId: socket.id, reason, timestamp: new Date().toISOString() }
          });
        }

        // Remove connected devices
        for (const [deviceId, deviceData] of connectedDevices.entries()) {
          if (deviceData.socketId === socket.id) {
            connectedDevices.delete(deviceId);
            DeviceSimulator.updateDeviceConnection(deviceId, false);
            
            // Notify admins
            if (adminId) {
              socket.to(`admin:${adminId}`).emit('device:disconnect', { deviceId });
            }
          }
        }
      });
    });

    // Start server on available port
    const port = process.env.SOCKET_PORT || 3001;
    httpServer.listen(port, () => {
      console.log(`Socket.IO server running on port ${port}`);
    });

  } catch (error) {
    console.error('Socket.IO server initialization error:', error);
    throw error;
  }
}

// Export for external initialization
export { initSocketServer, io };