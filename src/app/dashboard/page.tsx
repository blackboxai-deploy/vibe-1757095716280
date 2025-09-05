'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Battery, 
  HardDrive, 
  Wifi, 
  MapPin, 
  Camera,
  Activity,
  Users,
  Monitor,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import { DeviceSimulator } from '@/lib/deviceSimulator';
import { useAdminSocket } from '@/hooks/useSocket';

export default function DashboardPage() {
  const [devices, setDevices] = useState(DeviceSimulator.getDevices());
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalCommands: 0,
    avgBattery: 0
  });

  const adminId = typeof window !== 'undefined' ? localStorage.getItem('admin_id') : null;
  const { connected, connectedDevices, deviceEvents } = useAdminSocket(adminId || '');

  useEffect(() => {
    // Simulate real-time device updates
    const interval = setInterval(() => {
      setDevices(prevDevices => 
        prevDevices.map(device => ({
          ...device,
          batteryLevel: Math.max(10, Math.min(100, device.batteryLevel + (Math.random() - 0.5) * 5)),
          lastSeen: new Date().toISOString()
        }))
      );
    }, 10000);

    // Update system stats
    const updateStats = () => {
      const totalDevices = devices.length;
      const activeDevices = connectedDevices.length;
      const avgBattery = devices.reduce((sum, d) => sum + d.batteryLevel, 0) / devices.length;
      
      setSystemStats({
        totalDevices,
        activeDevices,
        totalCommands: deviceEvents.filter(e => e.type === 'command').length,
        avgBattery: Math.round(avgBattery)
      });
    };

    updateStats();
    return () => clearInterval(interval);
  }, [devices, connectedDevices, deviceEvents]);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(selectedDevice === deviceId ? null : deviceId);
  };

  const getDeviceStatus = (device: any) => {
    const isConnected = connectedDevices.includes(device.id);
    const batteryColor = device.batteryLevel > 50 ? 'text-green-600' : 
                        device.batteryLevel > 20 ? 'text-yellow-600' : 'text-red-600';
    
    return { isConnected, batteryColor };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Device Dashboard</h1>
          <p className="text-slate-600">Monitor and control your Android devices remotely</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={`${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          {connected && (
            <Badge variant="outline">
              {connectedDevices.length} Active Device{connectedDevices.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalDevices}</div>
            <p className="text-xs text-slate-600">Registered devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeDevices}</div>
            <p className="text-xs text-slate-600">Currently connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commands Executed</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalCommands}</div>
            <p className="text-xs text-slate-600">In this session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery</CardTitle>
            <Battery className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.avgBattery}%</div>
            <p className="text-xs text-slate-600">Across all devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status Alert */}
      {!connected && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            WebSocket connection is not active. Real-time features may be limited. 
            Device controls are currently in simulation mode.
          </AlertDescription>
        </Alert>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device) => {
          const { isConnected, batteryColor } = getDeviceStatus(device);
          const isSelected = selectedDevice === device.id;
          
          return (
            <Card 
              key={device.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-purple-500 shadow-lg' : ''
              }`}
              onClick={() => handleDeviceSelect(device.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <Badge className={isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <span>{device.model}</span>
                  <span>•</span>
                  <span>Android {device.androidVersion}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Device Image Placeholder */}
                <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center">
                  <img 
                    src={`https://placehold.co/200x300?text=${encodeURIComponent(device.name + ' Screenshot')}`}
                    alt={`${device.name} screenshot`}
                    className="w-24 h-36 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex items-center justify-center text-slate-400">
                    <Monitor className="w-8 h-8" />
                  </div>
                </div>

                {/* Device Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Battery className={`w-4 h-4 ${batteryColor}`} />
                      <span className="text-sm font-medium">Battery</span>
                    </div>
                    <span className={`text-sm font-semibold ${batteryColor}`}>
                      {device.batteryLevel}%
                    </span>
                  </div>
                  <Progress value={device.batteryLevel} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-slate-500" />
                      <span>{device.storage}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-slate-500" />
                      <span>{device.networkType}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {isSelected && (
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200">
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Monitor className="w-3 h-3" />
                      <span>Screen</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Location</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Camera className="w-3 h-3" />
                      <span>Camera</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Control</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest device events and commands</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceEvents.length > 0 ? (
            <div className="space-y-3">
              {deviceEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Device {event.deviceId}</div>
                    <div className="text-xs text-slate-600 capitalize">{event.type} event</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Connect devices to see real-time events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}