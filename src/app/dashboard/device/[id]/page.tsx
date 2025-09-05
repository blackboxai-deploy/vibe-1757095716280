'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Smartphone, 
  Battery, 
  Wifi, 
  HardDrive, 
  Monitor,
  Terminal,
  FileText,
  MapPin,
  Camera,
  Mic
} from 'lucide-react';
import { DeviceSimulator } from '@/lib/deviceSimulator';
import ScreenViewer from '@/components/remote/ScreenViewer';
import Link from 'next/link';

export default function DeviceControlPage() {
  const params = useParams();
  const deviceId = params.id as string;
  const [device, setDevice] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    if (deviceId) {
      const deviceData = DeviceSimulator.getDeviceById(deviceId);
      setDevice(deviceData);
      
      if (deviceData) {
        const status = DeviceSimulator.getSystemStatus(deviceId);
        setSystemStatus(status);
      }
    }
  }, [deviceId]);

  if (!device) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-700">Device not found</h2>
            <p className="text-slate-500 mt-2">The device with ID "{deviceId}" was not found.</p>
            <Link href="/dashboard" className="inline-block mt-4">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{device.name}</h1>
            <p className="text-slate-600">{device.model} • Android {device.androidVersion}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={device.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
            {device.connected ? 'Connected' : 'Offline'}
          </Badge>
          <Badge variant="outline">
            {device.networkType}
          </Badge>
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery</CardTitle>
            <Battery className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{device.batteryLevel}%</div>
            <p className="text-xs text-slate-600">
              {device.batteryLevel > 50 ? 'Good' : device.batteryLevel > 20 ? 'Low' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{device.storage}</div>
            <p className="text-xs text-slate-600">Total capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{device.networkType}</div>
            <p className="text-xs text-slate-600">Connection type</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM</CardTitle>
            <Monitor className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{device.ram}</div>
            <p className="text-xs text-slate-600">Memory</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Tabs */}
      <Tabs defaultValue="screen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="screen" className="flex items-center space-x-1">
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Screen</span>
          </TabsTrigger>
          <TabsTrigger value="terminal" className="flex items-center space-x-1">
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Terminal</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Location</span>
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center space-x-1">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center space-x-1">
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screen" className="space-y-4">
          <ScreenViewer deviceId={deviceId} />
        </TabsContent>

        <TabsContent value="terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Command Terminal</CardTitle>
              <CardDescription>Execute commands on the remote device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Terminal component coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Manager</CardTitle>
              <CardDescription>Browse and manage device files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>File manager component coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Tracking</CardTitle>
              <CardDescription>View current location and history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Location tracker component coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camera Access</CardTitle>
              <CardDescription>Capture photos from device cameras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Camera component coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Recording</CardTitle>
              <CardDescription>Record audio from device microphone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Audio recorder component coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}