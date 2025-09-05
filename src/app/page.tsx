'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, Shield, Wifi } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_id', data.adminId);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding & Features */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Remote Control Android</h1>
            </div>
            <p className="text-lg text-slate-300">
              Professional remote management solution for Android devices with transparent monitoring and secure control.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-time Control</h3>
                <p className="text-slate-300">Live screen monitoring, file management, and command execution with instant feedback.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure & Transparent</h3>
                <p className="text-slate-300">End-to-end encryption with clear notifications to device users about active monitoring.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Multi-Device Support</h3>
                <p className="text-slate-300">Manage multiple Android devices from a single dashboard with individual device controls.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h4 className="font-semibold mb-3">Key Features:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Live screen sharing and remote interaction</li>
              <li>• Complete file system access and management</li>
              <li>• Command terminal with real-time output</li>
              <li>• App installation and management</li>
              <li>• GPS location tracking and history</li>
              <li>• Camera and microphone remote access</li>
              <li>• Comprehensive activity logging</li>
              <li>• Secure WebSocket communication</li>
            </ul>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold text-slate-900">Admin Login</CardTitle>
              <CardDescription className="text-slate-600">
                Enter your credentials to access the device control dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Username: <span className="font-mono bg-white px-2 py-1 rounded">admin</span></p>
                  <p>Password: <span className="font-mono bg-white px-2 py-1 rounded">admin123</span></p>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loading || !username || !password}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="mt-6 text-center text-sm text-white/70">
            <p>This is a demonstration application for educational purposes.</p>
            <p className="mt-1">All device controls are simulated and transparent to users.</p>
          </div>
        </div>
      </div>
    </div>
  );
}