import { type BlockType, BLOCK_CONFIGS } from '@/lib/blocks/config'

// ──────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────

export interface DisplayBlock {
    id: string
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    source: 'manual' | 'calendar'
    calendar_id?: string | null
    calendar_link?: string
    google_event_id?: string | null
    linear_issue_id?: string | null
    routine_id?: string | null
    task_link?: string | null
    session?: {
        id?: string
        outcome?: string | null
        actual_start?: string | null
        actual_end?: string | null
    } | null
}

// ──────────────────────────────────────────────
// Date / time helpers
// ──────────────────────────────────────────────

/** Format an ISO date string to a human-readable time (e.g. "2:30 PM") */
export function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/** Format an ISO date string to a short date (e.g. "Mon, Feb 10") */
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

/** Check if two Date objects represent the same calendar day */
export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

/** Format elapsed seconds as MM:SS (for timer displays) */
export function formatTimerSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ──────────────────────────────────────────────
// Block helpers
// ──────────────────────────────────────────────

/** Get CSS classes for a block type badge */
export function getBlockTypeColor(type: string): string {
    const config = BLOCK_CONFIGS[type as BlockType]
    if (config) {
        return `${config.color.bg} ${config.color.text} ${config.color.border}`
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}

/** Get emoji for a block type */
export function getBlockTypeEmoji(type: string): string {
    switch (type) {
        case 'focus': return '🎯'
        case 'admin': return '📋'
        case 'recovery': return '🧘'
        default: return '⚡'
    }
}

/** Get calendar color by calendar_id (handles composite IDs like "calId::eventId") */
export function getCalendarColor(
    calendarId: string | null | undefined,
    calendars: Array<{ id: string; color?: string }>
): string | undefined {
    if (!calendarId) return undefined
    const actualCalendarId = calendarId.split('::')[0]
    const calendar = calendars.find(c => c.id === actualCalendarId)
    return calendar?.color
}
