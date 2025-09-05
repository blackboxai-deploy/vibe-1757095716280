import { v4 as uuidv4 } from 'uuid';

export interface MockDeviceInfo {
  id: string;
  name: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  manufacturer: string;
  brand: string;
  hardware: string;
  ram: string;
  storage: string;
  batteryLevel: number;
  screenResolution: string;
  networkType: string;
  connected: boolean;
  lastSeen: string;
}

export interface MockApp {
  packageName: string;
  appName: string;
  version: string;
  icon: string;
  size: string;
  category: string;
  system: boolean;
}

export interface MockFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
  permissions: string;
}

export interface MockCommand {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
}

export interface MockLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

/**
 * Mock device data generator
 */
export class DeviceSimulator {
  private static devices: MockDeviceInfo[] = [
    {
      id: 'device-001',
      name: 'Samsung Galaxy S23',
      model: 'SM-S911B',
      androidVersion: '14.0',
      apiLevel: 34,
      manufacturer: 'Samsung',
      brand: 'samsung',
      hardware: 'qcom',
      ram: '8GB',
      storage: '256GB',
      batteryLevel: 85,
      screenResolution: '1080x2340',
      networkType: 'WiFi',
      connected: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'device-002',
      name: 'Google Pixel 8 Pro',
      model: 'Pixel 8 Pro',
      androidVersion: '14.0',
      apiLevel: 34,
      manufacturer: 'Google',
      brand: 'google',
      hardware: 'tensor',
      ram: '12GB',
      storage: '512GB',
      batteryLevel: 72,
      screenResolution: '1344x2992',
      networkType: '5G',
      connected: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'device-003',
      name: 'OnePlus 11',
      model: 'CPH2447',
      androidVersion: '13.0',
      apiLevel: 33,
      manufacturer: 'OnePlus',
      brand: 'oneplus',
      hardware: 'qcom',
      ram: '16GB',
      storage: '1TB',
      batteryLevel: 94,
      screenResolution: '1440x3216',
      networkType: '5G',
      connected: false,
      lastSeen: new Date().toISOString()
    }
  ];

  static getDevices(): MockDeviceInfo[] {
    return this.devices.map(device => ({
      ...device,
      batteryLevel: Math.max(10, Math.min(100, device.batteryLevel + (Math.random() - 0.5) * 10)),
      lastSeen: new Date().toISOString()
    }));
  }

  static getDeviceById(deviceId: string): MockDeviceInfo | null {
    return this.devices.find(device => device.id === deviceId) || null;
  }

  static updateDeviceConnection(deviceId: string, connected: boolean): void {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.connected = connected;
      device.lastSeen = new Date().toISOString();
    }
  }

  static generateScreenshot(deviceId: string): string {
    const device = this.getDeviceById(deviceId);
    if (!device) return '';
    
    const [width, height] = device.screenResolution.split('x').map(Number);
    const timestamp = Date.now();
    
    // Generate placeholder screenshot URL with device-specific content
    return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(`${device.name} Screenshot - ${new Date().toLocaleTimeString()}`)}`;
  }

  static getInstalledApps(deviceId: string): MockApp[] {
    const apps: MockApp[] = [
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        version: '118.0.5993.88',
        icon: 'https://placehold.co/64x64?text=Chrome',
        size: '145MB',
        category: 'Web Browser',
        system: false
      },
      {
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        version: '2.23.21.76',
        icon: 'https://placehold.co/64x64?text=WA',
        size: '89MB',
        category: 'Communication',
        system: false
      },
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        version: '302.0.0.23.113',
        icon: 'https://placehold.co/64x64?text=IG',
        size: '78MB',
        category: 'Social Media',
        system: false
      },
      {
        packageName: 'com.spotify.music',
        appName: 'Spotify',
        version: '8.8.62.488',
        icon: 'https://placehold.co/64x64?text=Spot',
        size: '67MB',
        category: 'Music',
        system: false
      },
      {
        packageName: 'com.android.settings',
        appName: 'Settings',
        version: '14.0',
        icon: 'https://placehold.co/64x64?text=Set',
        size: '12MB',
        category: 'System',
        system: true
      },
      {
        packageName: 'com.google.android.gms',
        appName: 'Google Play Services',
        version: '23.42.17',
        icon: 'https://placehold.co/64x64?text=GPS',
        size: '234MB',
        category: 'System',
        system: true
      }
    ];

    return apps;
  }

  static getFileSystem(deviceId: string, path: string = '/'): MockFile[] {
    const commonFiles: MockFile[] = [
      {
        name: 'Android',
        path: '/Android',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-15 10:30:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'DCIM',
        path: '/DCIM',
        type: 'directory', 
        size: 0,
        lastModified: '2024-01-20 14:22:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'Download',
        path: '/Download',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-22 09:15:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'Documents',
        path: '/Documents',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-18 16:45:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'Pictures',
        path: '/Pictures',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-21 11:30:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'Music',
        path: '/Music',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-19 13:20:00',
        permissions: 'drwxr-xr-x'
      },
      {
        name: 'Videos',
        path: '/Videos',
        type: 'directory',
        size: 0,
        lastModified: '2024-01-20 15:10:00',
        permissions: 'drwxr-xr-x'
      }
    ];

    if (path === '/' || path === '') {
      return commonFiles;
    }

    // Return sample files for specific directories
    if (path === '/DCIM') {
      return [
        {
          name: 'Camera',
          path: '/DCIM/Camera',
          type: 'directory',
          size: 0,
          lastModified: '2024-01-20 14:22:00',
          permissions: 'drwxr-xr-x'
        }
      ];
    }

    if (path === '/Download') {
      return [
        {
          name: 'document.pdf',
          path: '/Download/document.pdf',
          type: 'file',
          size: 2048576, // 2MB
          lastModified: '2024-01-22 09:15:00',
          permissions: '-rw-r--r--'
        },
        {
          name: 'image.jpg',
          path: '/Download/image.jpg',
          type: 'file',
          size: 1536000, // 1.5MB
          lastModified: '2024-01-21 18:30:00',
          permissions: '-rw-r--r--'
        }
      ];
    }

    return [];
  }

  static executeCommand(deviceId: string, command: string): MockCommand {
    const commandId = uuidv4();
    const timestamp = new Date().toISOString();

    // Simulate command execution with realistic outputs
    const commandOutputs: Record<string, { output: string; exitCode: number }> = {
      'ls': {
        output: 'Android\nDCIM\nDownload\nDocuments\nPictures\nMusic\nVideos',
        exitCode: 0
      },
      'pwd': {
        output: '/storage/emulated/0',
        exitCode: 0
      },
      'whoami': {
        output: 'u0_a123',
        exitCode: 0
      },
      'date': {
        output: new Date().toString(),
        exitCode: 0
      },
      'ps': {
        output: 'USER     PID   PPID  VSIZE  RSS     WCHAN    PC        NAME\nroot      1     0     1896   788   ffffffff 00000000 S /init\nsystem    123   1     2384   1256  ffffffff 00000000 S /system/bin/servicemanager',
        exitCode: 0
      },
      'df': {
        output: 'Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/fuse      249999360 123456789 126542571  50% /storage/emulated',
        exitCode: 0
      },
      'getprop': {
        output: '[ro.build.version.release]: [14]\n[ro.build.version.sdk]: [34]\n[ro.product.model]: [SM-S911B]',
        exitCode: 0
      }
    };

    const result = commandOutputs[command.toLowerCase()] || {
      output: `Command '${command}' not found or not supported in simulation`,
      exitCode: 127
    };

    return {
      id: commandId,
      command,
      output: result.output,
      exitCode: result.exitCode,
      timestamp
    };
  }

  static getCurrentLocation(deviceId: string): MockLocation {
    // Simulate location in Jakarta, Indonesia with some randomization
    const baseLatitude = -6.2088;
    const baseLongitude = 106.8456;
    
    const latitude = baseLatitude + (Math.random() - 0.5) * 0.02; // ±0.01 degrees (~1km)
    const longitude = baseLongitude + (Math.random() - 0.5) * 0.02;
    
    return {
      latitude,
      longitude,
      accuracy: Math.floor(Math.random() * 20) + 5, // 5-25 meters
      timestamp: new Date().toISOString(),
      address: `Jakarta, Indonesia (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
    };
  }

  static captureCamera(deviceId: string, camera: 'front' | 'back' = 'back'): string {
    const timestamp = Date.now();
    const cameraText = camera === 'front' ? 'Front Camera Selfie' : 'Back Camera Photo';
    
    return `https://placehold.co/1920x1080?text=${encodeURIComponent(`${cameraText} - ${new Date().toLocaleTimeString()}`)}`;
  }

  static recordAudio(deviceId: string, duration: number = 10): { audioUrl: string; duration: number; size: number } {
    const timestamp = Date.now();
    const audioUrl = `https://placehold.co/400x100?text=${encodeURIComponent(`Audio Recording - ${duration}s - ${new Date().toLocaleTimeString()}`)}`;
    
    return {
      audioUrl,
      duration,
      size: duration * 16000 // Approximate size calculation (16KB per second)
    };
  }

  static generateNotification(deviceId: string, message: string): void {
    console.log(`[${deviceId}] Notification: ${message} at ${new Date().toISOString()}`);
  }

  static getSystemStatus(deviceId: string): any {
    const device = this.getDeviceById(deviceId);
    if (!device) return null;

    return {
      deviceInfo: device,
      batteryLevel: device.batteryLevel,
      batteryStatus: device.batteryLevel > 50 ? 'Good' : device.batteryLevel > 20 ? 'Low' : 'Critical',
      storage: {
        total: parseInt(device.storage.replace('GB', '')) * 1024 * 1024 * 1024, // Convert to bytes
        used: Math.floor(Math.random() * 0.6 * parseInt(device.storage.replace('GB', ''))) * 1024 * 1024 * 1024,
        available: 0 // Will be calculated
      },
      memory: {
        total: parseInt(device.ram.replace('GB', '')) * 1024 * 1024 * 1024,
        used: Math.floor(Math.random() * 0.7 * parseInt(device.ram.replace('GB', ''))) * 1024 * 1024 * 1024,
        available: 0 // Will be calculated
      },
      network: {
        type: device.networkType,
        connected: true,
        signalStrength: Math.floor(Math.random() * 4) + 1 // 1-4 bars
      },
      uptime: Math.floor(Math.random() * 48 * 60 * 60), // Random uptime in seconds (0-48 hours)
      temperature: 25 + Math.random() * 15 // 25-40°C
    };
  }
}