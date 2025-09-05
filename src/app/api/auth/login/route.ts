import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, generateAdminToken } from '@/lib/auth';
import { initDatabase, logActivity } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: true, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    const result = await validateAdminCredentials(username, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: true, message: result.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateAdminToken(result.adminId!);

    // Initialize database and log activity
    await initDatabase();
    await logActivity({
      deviceId: 'system',
      adminId: result.adminId!,
      action: 'admin_login',
      details: { username, timestamp: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      token,
      adminId: result.adminId,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}