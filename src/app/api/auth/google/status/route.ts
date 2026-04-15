import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const TOKEN_PATH = path.join(process.cwd(), 'google_tokens.json');
  
  try {
    await fs.access(TOKEN_PATH);
    return NextResponse.json({ connected: true });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
