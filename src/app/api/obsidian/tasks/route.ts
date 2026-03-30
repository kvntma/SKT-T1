import { readDailyNote } from '@/lib/obsidian';
import { NextResponse } from 'next/server';

export async function GET() {
  const note = await readDailyNote(new Date());
  if (!note) {
    return NextResponse.json({ tasks: [] });
  }
  return NextResponse.json({ tasks: note.tasks });
}
