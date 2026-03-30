import { updateTaskStatus } from '@/lib/obsidian';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lineIndex, completed } = await req.json();
    
    if (typeof lineIndex !== 'number') {
      return NextResponse.json({ error: 'lineIndex is required' }, { status: 400 });
    }

    await updateTaskStatus(new Date(), lineIndex, completed);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}
