import { NextResponse } from 'next/server';
import { handleCallback } from '@/lib/calendar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    await handleCallback(code);
    return NextResponse.redirect(new URL('/settings', request.url));
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
