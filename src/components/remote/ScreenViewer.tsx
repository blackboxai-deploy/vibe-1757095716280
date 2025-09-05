'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Monitor, 
  RefreshCw, 
  Download, 
  Maximize, 
  Minimize,
  Play,
  Pause,
  Square,
  Camera,
  Settings
} from 'lucide-react';
import { DeviceSimulator } from '@/lib/deviceSimulator';
import { useDeviceSocket } from '@/hooks/useSocket';

interface ScreenViewerProps {
  deviceId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ScreenViewer({ deviceId, autoRefresh = true, refreshInterval = 3000 }: ScreenViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const screenRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const recordingRef = useRef<NodeJS.Timeout>();

  const { connected, lastScreenshot, requestScreenshot } = useDeviceSocket(deviceId);

  useEffect(() => {
    if (autoRefresh && connected) {
      intervalRef.current = setInterval(() => {
        requestScreenshot();
      }, refreshInterval);

      // Initial screenshot request
      requestScreenshot();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, connected, refreshInterval, requestScreenshot]);

  const handleRefreshNow = () => {
    requestScreenshot();
  };

  const handleDownloadScreenshot = async () => {
    if (!lastScreenshot) return;

    try {
      const link = document.createElement('a');
      link.href = lastScreenshot;
      link.download = `screenshot-${deviceId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!screenRef.current) return;

    if (!isFullscreen) {
      screenRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingDuration(0);
    
    if (recordingRef.current) {
      clearInterval(recordingRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualitySettings = (quality: 'low' | 'medium' | 'high') => {
    const settings = {
      low: { width: 360, height: 640, compression: 80 },
      medium: { width: 720, height: 1280, compression: 60 },
      high: { width: 1080, height: 1920, compression: 40 }
    };
    return settings[quality];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Screen Viewer</span>
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? 'Live' : 'Offline'}
            </Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* Quality Selector */}
            <div className="flex items-center space-x-1">
              <Settings className="w-4 h-4 text-slate-500" />
              <select 
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="low">Low (360p)</option>
                <option value="medium">Medium (720p)</option>
                <option value="high">High (1080p)</option>
              </select>
            </div>

            {/* Recording Controls */}
            {!isRecording ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startRecording}
                disabled={!connected}
              >
                <Play className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopRecording}
                  className="text-red-600 hover:text-red-700"
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Badge variant="destructive" className="animate-pulse">
                  REC {formatTime(recordingDuration)}
                </Badge>
              </div>
            )}

            {/* Refresh Control */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshNow}
              disabled={!connected}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadScreenshot}
              disabled={!lastScreenshot}
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Status and Settings */}
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-4">
            <span>Device: {deviceId}</span>
            <span>•</span>
            <span>Auto-refresh: {autoRefresh ? `${refreshInterval/1000}s` : 'Off'}</span>
            <span>•</span>
            <span>Quality: {getQualitySettings(quality).width}x{getQualitySettings(quality).height}</span>
          </div>
          
          {lastScreenshot && (
            <span className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div 
          ref={screenRef}
          className={`relative bg-slate-100 rounded-lg overflow-hidden ${
            isFullscreen ? 'h-screen' : 'h-96 md:h-[600px]'
          }`}
        >
          {lastScreenshot ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={lastScreenshot}
                alt="Device screen"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Screenshot not available</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {connected ? (
                <div className="text-center text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                  <p>Loading screen...</p>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Device not connected</p>
                  <p className="text-xs mt-1">Connect device to view screen</p>
                </div>
              )}
            </div>
          )}

          {/* Recording indicator overlay */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              ● RECORDING {formatTime(recordingDuration)}
            </div>
          )}

          {/* Connection status overlay */}
          {!connected && (
            <div className="absolute top-4 right-4 bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-medium">
              Offline
            </div>
          )}
        </div>

        {/* Screen Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                // Toggle auto-refresh would be handled by parent component
              }}
              disabled={!connected}
            >
              {autoRefresh ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              Auto-refresh
            </Button>

            <span className="text-xs text-slate-500">
              Interval: {refreshInterval/1000}s
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {connected && (
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live connection</span>
              </div>
            )}
            
            {lastScreenshot && (
              <Button variant="outline" size="sm" onClick={handleDownloadScreenshot}>
                <Download className="w-4 h-4 mr-1" />
                Save Screenshot
              </Button>
            )}
          </div>
        </div>

        {/* Connection Quality Indicator */}
        {connected && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Connection Quality</span>
              <span>Excellent</span>
            </div>
            <Progress value={95} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}