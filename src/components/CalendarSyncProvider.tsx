'use client'

import { useCalendarSync } from '@/lib/hooks/useCalendarSync'

// Silent provider that syncs calendar on app load
// No UI - just triggers the sync in background
export function CalendarSyncProvider({ children }: { children: React.ReactNode }) {
    useCalendarSync()
    return <>{children}</>
}
