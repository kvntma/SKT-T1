// Block type configuration and utilities
import {
    Focus,
    ClipboardList,
    Sparkles,
    Users,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    SkipForward,
    type LucideIcon
} from 'lucide-react'

export type BlockType = 'focus' | 'admin' | 'recovery' | 'busy'

export interface BlockConfig {
    label: string
    emoji: string  // Keep for backwards compatibility
    icon: LucideIcon
    description: string
    trackable: boolean        // Requires Start → Done/Stop flow
    countsTowardStats: boolean // Included in execution metrics
    color: {
        bg: string
        text: string
        border: string
        solid: string  // For calendar view
    }
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
    focus: {
        label: 'Focus',
        emoji: '🎯',
        icon: Focus,
        description: 'Deep work requiring concentration',
        trackable: true,
        countsTowardStats: true,
        color: {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            border: 'border-emerald-500/20',
            solid: 'bg-emerald-600',
        },
    },
    admin: {
        label: 'Admin',
        emoji: '📋',
        icon: ClipboardList,
        description: 'Light tasks and administrative work',
        trackable: true,
        countsTowardStats: true,
        color: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            solid: 'bg-blue-600',
        },
    },
    recovery: {
        label: 'Recovery',
        emoji: '🧘',
        icon: Sparkles,
        description: 'Breaks, rest, and recharge time',
        trackable: false,
        countsTowardStats: false,
        color: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            border: 'border-purple-500/20',
            solid: 'bg-purple-600',
        },
    },
    busy: {
        label: 'Busy',
        emoji: '📅',
        icon: Users,
        description: 'Meetings, calls, and committed time',
        trackable: false,
        countsTowardStats: false,
        color: {
            bg: 'bg-zinc-500/10',
            text: 'text-zinc-400',
            border: 'border-zinc-500/20',
            solid: 'bg-zinc-600',
        },
    },
}

// Status icons
export const STATUS_ICONS = {
    done: CheckCircle2,
    stopped: XCircle,
    missed: AlertTriangle,
    skipped: SkipForward,
    upcoming: Clock,
    ready: Clock,
    active: Clock,
} as const

// Block lifecycle states
export type BlockStatus =
    | 'upcoming'    // Scheduled for later
    | 'ready'       // It's time or next up
    | 'active'      // Currently running (has active session)
    | 'done'        // Completed successfully
    | 'stopped'     // Ended early with reason
    | 'skipped'     // Intentionally skipped
    | 'missed'      // Time passed, never started
    | 'acknowledged' // For non-trackable blocks, time has passed

export interface BlockStatusInfo {
    status: BlockStatus
    label: string
    canStart: boolean
    canSkip: boolean
    showsInStats: boolean
}

// Helper to get block config
export function getBlockConfig(type: BlockType): BlockConfig {
    return BLOCK_CONFIGS[type] || BLOCK_CONFIGS.focus
}

// Helper to check if a block type is trackable
export function isTrackable(type: BlockType): boolean {
    return BLOCK_CONFIGS[type]?.trackable ?? false
}

// Helper to check if block counts toward stats
export function countsTowardStats(type: BlockType): boolean {
    return BLOCK_CONFIGS[type]?.countsTowardStats ?? false
}

// Determine block status based on times and session data
export function getBlockStatus(
    block: {
        type: BlockType
        planned_start: string
        planned_end: string
    },
    session?: {
        outcome?: string | null
        actual_start?: string | null
    } | null,
    now: Date = new Date()
): BlockStatusInfo {
    const startTime = new Date(block.planned_start)
    const endTime = new Date(block.planned_end)
    const config = getBlockConfig(block.type)

    // Non-trackable blocks have simpler status
    if (!config.trackable) {
        if (now < startTime) {
            return {
                status: 'upcoming',
                label: 'Scheduled',
                canStart: false,
                canSkip: false,
                showsInStats: false,
            }
        }
        // Time has passed or is ongoing
        return {
            status: 'acknowledged',
            label: now < endTime ? 'In Progress' : 'Done',
            canStart: false,
            canSkip: false,
            showsInStats: false,
        }
    }

    // Trackable blocks - check session status
    if (session?.outcome === 'done') {
        return {
            status: 'done',
            label: 'Completed',
            canStart: false,
            canSkip: false,
            showsInStats: true,
        }
    }

    if (session?.outcome === 'aborted') {
        return {
            status: 'stopped',
            label: 'Stopped',
            canStart: false,
            canSkip: false,
            showsInStats: true,
        }
    }

    if (session?.outcome === 'skipped') {
        return {
            status: 'skipped',
            label: 'Skipped',
            canStart: false,
            canSkip: false,
            showsInStats: true,
        }
    }

    // Has started but no outcome yet = active
    if (session?.actual_start) {
        return {
            status: 'active',
            label: 'In Progress',
            canStart: false,
            canSkip: false,
            showsInStats: true,
        }
    }

    // Not started yet - check timing
    const bufferMs = 15 * 60 * 1000 // 15 min buffer for "ready"

    if (now < new Date(startTime.getTime() - bufferMs)) {
        return {
            status: 'upcoming',
            label: 'Upcoming',
            canStart: true, // Can start early
            canSkip: true,
            showsInStats: false,
        }
    }

    if (now < endTime) {
        return {
            status: 'ready',
            label: 'Ready',
            canStart: true,
            canSkip: true,
            showsInStats: false,
        }
    }

    // Time passed, never started
    return {
        status: 'missed',
        label: 'Missed',
        canStart: false,
        canSkip: true, // Can still mark as skipped
        showsInStats: true,
    }
}
