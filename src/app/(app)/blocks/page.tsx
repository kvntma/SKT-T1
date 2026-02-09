'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { useCalendar } from '@/lib/hooks/useCalendar'
import { useCalendarSync } from '@/lib/hooks/useCalendarSync'
import { cn } from '@/lib/utils'
import {
    type BlockType,
    BLOCK_CONFIGS,
    STATUS_ICONS,
    getBlockConfig,
    getBlockStatus,
    isTrackable
} from '@/lib/blocks/config'
import { CalendarView } from '@/components/calendar-view'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { createClient } from '@/lib/supabase/client'
import { useBlockColorPreferences, getBlockColorClass } from '@/lib/hooks/useBlockColorPreferences'

type ViewMode = 'today' | 'week'
type DisplayMode = 'list' | 'calendar'

function getBlockTypeColor(type: string): string {
    const config = BLOCK_CONFIGS[type as BlockType]
    if (config) {
        return `${config.color.bg} ${config.color.text} ${config.color.border}`
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}

function getBlockTypeEmoji(type: string): string {
    const config = BLOCK_CONFIGS[type as BlockType]
    return config?.emoji ?? '⚡'
}

function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

// Helper to get calendar color by ID
// Note: calendar_id on blocks is stored as "calendarId::eventId" format
function getCalendarColor(calendarId: string | null | undefined, calendars: Array<{ id: string; color?: string }>): string | undefined {
    if (!calendarId) return undefined
    // Extract the actual calendar ID (before the "::")
    const actualCalendarId = calendarId.split('::')[0]
    const calendar = calendars.find(c => c.id === actualCalendarId)
    return calendar?.color
}

// Unified block type for display
interface DisplayBlock {
    id: string
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    source: 'manual' | 'calendar'
    calendar_id?: string | null  // For looking up calendar color
    calendar_link?: string
    google_event_id?: string | null
    linear_issue_id?: string | null
    task_link?: string | null
    session?: {
        id?: string
        outcome?: string | null
        actual_start?: string | null
        actual_end?: string | null
    } | null
}

export default function BlocksPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const supabase = createClient()
    const [viewMode, setViewMode] = useState<ViewMode>('today')
    const { blocks, isLoading, createBlock, deleteBlock } = useBlocks(viewMode)
    const {
        isConnected,
        isLoadingCalendars,
        isLoadingEvents,
        connectCalendar,
        events,
        calendars,      // Filtered list for sync selection (excludes Push To Start calendar)
        allCalendars,   // Full list for color lookups
        syncedCalendarIds,
        lastCalendarSync,
        isCalendarSynced,
        toggleCalendar,
        isTogglingCalendar,
        refreshEvents
    } = useCalendar()
    const { forceSync, isForceSyncing } = useCalendarSync()
    const { preferences: colorPrefs } = useBlockColorPreferences()

    // All blocks come from DB now - calendar events are synced as blocks with calendar_id set
    // No more separate calendar events merging to avoid duplicates
    const allBlocks = useMemo<DisplayBlock[]>(() => {
        return blocks.map(block => {
            // If block has calendar_id, it's a synced calendar event
            const isCalendarBlock = !!block.calendar_id

            return {
                id: block.id,
                title: block.title,
                // Calendar-synced blocks default to 'busy' type unless manually changed
                type: isCalendarBlock && !['focus', 'admin', 'recovery'].includes(block.type || '')
                    ? 'busy' as BlockType
                    : (block.type as BlockType) || 'focus',
                planned_start: block.planned_start,
                planned_end: block.planned_end,
                stop_condition: block.stop_condition ?? undefined,
                source: isCalendarBlock ? 'calendar' as const : 'manual' as const,
                calendar_id: block.calendar_id,  // Pass through for color lookup
                calendar_link: isCalendarBlock ? block.task_link ?? undefined : undefined,
                google_event_id: block.google_event_id,
                linear_issue_id: block.linear_issue_id,
                task_link: !isCalendarBlock ? block.task_link : undefined, // Only for manual blocks
                // Use session data from the joined query
                session: (block as { session?: { id?: string; outcome?: string; actual_start?: string; actual_end?: string } }).session ?? null,
            }
        }).sort((a, b) =>
            new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
        )
    }, [blocks])

    // Current time state - updates every minute to keep block statuses fresh
    const [currentTime, setCurrentTime] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000) // Update every minute

        return () => clearInterval(timer)
    }, [])

    const [showCreate, setShowCreate] = useState(false)
    const [calendarExpanded, setCalendarExpanded] = useState(false)
    const [displayMode, setDisplayMode] = useState<DisplayMode>('list')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPushingToCalendar, setIsPushingToCalendar] = useState(false)
    const [newBlock, setNewBlock] = useState<{
        title: string
        type: BlockType
        duration: string
        stopCondition: string
        startTime: Date | undefined
        bufferBefore: string
        bufferAfter: string
    }>({
        title: '',
        type: 'focus' as BlockType,
        duration: '25',
        stopCondition: '',
        startTime: undefined,
        bufferBefore: '0',  // minutes (0, 5, 10, 15)
        bufferAfter: '0',   // minutes (0, 5, 10, 15)
    })

    // Skip reasons (similar to abort reasons but for blocks that were never started)
    const SKIP_REASONS = [
        { value: 'no_time', label: 'Ran out of time', emoji: '⏰' },
        { value: 'higher_priority', label: 'Higher priority came up', emoji: '🚨' },
        { value: 'not_ready', label: 'Wasn\'t ready for this task', emoji: '🤷' },
        { value: 'energy_low', label: 'Energy too low', emoji: '😴' },
        { value: 'context_switch', label: 'Too much context switching', emoji: '🔄' },
        { value: 'forgot', label: 'Forgot about it', emoji: '🙈' },
        { value: 'other', label: 'Other reason', emoji: '✏️' },
    ]

    // Resolve modal state for missed blocks
    const [resolveBlockId, setResolveBlockId] = useState<string | null>(null)
    const [resolveStep, setResolveStep] = useState<'choice' | 'skip_reason'>('choice')
    const [skipReason, setSkipReason] = useState<string>('')
    const [otherReason, setOtherReason] = useState<string>('')

    // Handle starting a block - navigate to /now with block context
    const handleStart = (blockId: string) => {
        // Safety check: Verify block can still be started (not past end time)
        const block = allBlocks.find(b => b.id === blockId)
        if (block) {
            const startTime = new Date(block.planned_start)
            const endTime = new Date(block.planned_end)
            const now = new Date()

            if (now >= endTime) {
                // Block has passed - show resolve modal instead
                console.log('Block has passed end time, showing resolve modal')
                handleResolve(blockId)
                return
            }

            // Check if more than 4 hours early
            const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
            if (hoursUntilStart > 4) {
                const confirmed = window.confirm(
                    `This block is scheduled to start in ${Math.round(hoursUntilStart)} hours. Are you sure you want to start it now?`
                )
                if (!confirmed) return
            }
        }

        // Store the block ID to start - the /now page will pick it up
        sessionStorage.setItem('startBlockId', blockId)
        router.push('/now')
    }

    // Handle resolving a missed block
    const handleResolve = (blockId: string) => {
        setResolveBlockId(blockId)
        setResolveStep('choice')
        setSkipReason('')
        setOtherReason('')
    }

    // Handle choosing to skip - go to reason selection
    const handleSkipChoice = () => {
        setResolveStep('skip_reason')
    }

    // Handle resolution outcome (called when done is selected, or after skip reason is selected)
    const handleResolutionChoice = async (outcome: 'done' | 'skipped', reason?: string) => {
        if (!resolveBlockId) return

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Find the block to get its times
            const block = allBlocks.find(b => b.id === resolveBlockId)
            if (!block) throw new Error('Block not found')

            // Create a session record for this block
            const sessionData: {
                user_id: string
                block_id: string
                outcome: string
                actual_start?: string
                actual_end?: string
                abort_reason?: string
            } = {
                user_id: user.id,
                block_id: resolveBlockId,
                outcome: outcome,
            }

            // For completed blocks, set the times
            if (outcome === 'done') {
                sessionData.actual_start = block.planned_start
                sessionData.actual_end = block.planned_end
            }

            // For skipped blocks, set the abort reason
            if (outcome === 'skipped' && reason) {
                sessionData.abort_reason = reason
            }

            const { error } = await supabase
                .from('sessions')
                .insert(sessionData)

            if (error) throw error

            // Invalidate blocks query to refresh UI
            queryClient.invalidateQueries({ queryKey: ['blocks'] })

            console.log('Resolved block:', resolveBlockId, 'as', outcome, reason ? `(${reason})` : '')
        } catch (error) {
            console.error('Failed to resolve block:', error)
        } finally {
            setResolveBlockId(null)
            setResolveStep('choice')
            setSkipReason('')
            setOtherReason('')
        }
    }

    // Handle submitting skip with reason
    const handleSkipSubmit = () => {
        const finalReason = skipReason === 'other' ? otherReason : skipReason
        if (!finalReason) return
        handleResolutionChoice('skipped', finalReason)
    }

    const handleCreate = async () => {
        if (!newBlock.title || !newBlock.startTime) return

        setIsSubmitting(true)
        try {
            const bufferBeforeMs = parseInt(newBlock.bufferBefore) * 60 * 1000
            const bufferAfterMs = parseInt(newBlock.bufferAfter) * 60 * 1000
            const durationMs = parseInt(newBlock.duration) * 60 * 1000

            // Calculate actual start time (accounting for buffer before)
            const mainBlockStart = new Date(newBlock.startTime)
            const mainBlockEnd = new Date(mainBlockStart.getTime() + durationMs)

            // Create buffer block BEFORE if specified
            if (bufferBeforeMs > 0) {
                const bufferStart = new Date(mainBlockStart.getTime() - bufferBeforeMs)
                await createBlock.mutateAsync({
                    title: 'Buffer',
                    type: 'recovery',
                    planned_start: bufferStart.toISOString(),
                    planned_end: mainBlockStart.toISOString(),
                })
            }

            // Create the main block
            await createBlock.mutateAsync({
                title: newBlock.title,
                type: newBlock.type,
                planned_start: mainBlockStart.toISOString(),
                planned_end: mainBlockEnd.toISOString(),
                stop_condition: newBlock.stopCondition || undefined,
            })

            // Create buffer block AFTER if specified
            if (bufferAfterMs > 0) {
                await createBlock.mutateAsync({
                    title: 'Buffer',
                    type: 'recovery',
                    planned_start: mainBlockEnd.toISOString(),
                    planned_end: new Date(mainBlockEnd.getTime() + bufferAfterMs).toISOString(),
                })
            }

            setShowCreate(false)
            setNewBlock({ title: '', type: 'focus', duration: '25', stopCondition: '', startTime: undefined, bufferBefore: '0', bufferAfter: '0' })
        } catch (error) {
            console.error('Failed to create block:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (blockId: string) => {
        if (!confirm('Delete this block?')) return
        try {
            await deleteBlock.mutateAsync(blockId)
        } catch (error) {
            console.error('Failed to delete block:', error)
        }
    }

    // Generate a default start time (next 15-min increment) as Date
    const getDefaultStartTime = (): Date => {
        const now = new Date()
        const minutes = Math.ceil(now.getMinutes() / 15) * 15
        if (minutes === 60) {
            now.setHours(now.getHours() + 1, 0, 0, 0)
        } else {
            now.setMinutes(minutes, 0, 0)
        }
        return now
    }

    // Push blocks to Google Calendar
    const handlePushToCalendar = async () => {
        setIsPushingToCalendar(true)
        try {
            const response = await fetch('/api/calendar/push', { method: 'POST' })
            const data = await response.json()

            if (data.success) {
                alert(`✅ Pushed ${data.pushed} new blocks, updated ${data.updated} blocks to Google Calendar!`)
            } else if (data.error === 'Calendar not connected') {
                alert('❌ Calendar not connected.\n\nPlease connect your Google Calendar first.')
            } else if (response.status === 401 || data.error?.includes('Token') || data.error?.includes('scope')) {
                alert('❌ Calendar permissions need to be updated.\n\nPlease disconnect and reconnect your Google Calendar to grant write permissions.\n\nGo to Google Account → Security → Third-party apps → Remove "Push To Start", then reconnect here.')
            } else {
                alert(`❌ Failed to push: ${data.error}\n\nIf this persists, try disconnecting and reconnecting your Google Calendar.`)
            }
        } catch (error) {
            console.error('Failed to push to calendar:', error)
            alert('❌ Failed to push blocks to calendar.\n\nPlease try disconnecting and reconnecting your Google Calendar to grant the required permissions.')
        } finally {
            setIsPushingToCalendar(false)
        }
    }

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blocks</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Manage your time blocks
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            if (!showCreate) {
                                setNewBlock(prev => ({ ...prev, startTime: getDefaultStartTime() }))
                            }
                            setShowCreate(!showCreate)
                        }}
                        className="bg-white text-black hover:bg-zinc-200"
                    >
                        {showCreate ? 'Cancel' : '+ New Block'}
                    </Button>
                </div>

                {/* Google Calendar Connection */}
                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Google Calendar</p>
                                    <p className="text-sm text-zinc-500">
                                        {isLoadingCalendars ? 'Checking...' : isConnected ? `${events.length} events today` : 'Import events as blocks'}
                                    </p>
                                </div>
                            </div>
                            {isConnected ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                        ✓ Connected
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={refreshEvents}
                                        disabled={isLoadingEvents}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        {isLoadingEvents ? (
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePushToCalendar}
                                        disabled={isPushingToCalendar}
                                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    >
                                        {isPushingToCalendar ? (
                                            <svg className="mr-1 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        )}
                                        Push
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={connectCalendar}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500"
                                    disabled={isLoadingCalendars}
                                >
                                    Connect
                                </Button>
                            )}
                        </div>

                        {/* Calendar selector - collapsible */}
                        {isConnected && calendars.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <button
                                    onClick={() => setCalendarExpanded(!calendarExpanded)}
                                    className="w-full flex items-center justify-between text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span>{syncedCalendarIds.length} calendar{syncedCalendarIds.length !== 1 ? 's' : ''} synced</span>
                                        {lastCalendarSync && (
                                            <span className="text-zinc-600 text-[10px]">
                                                Last synced {formatRelativeTime(lastCalendarSync)}
                                            </span>
                                        )}
                                    </div>
                                    <svg
                                        className={cn(
                                            "h-4 w-4 transition-transform",
                                            calendarExpanded ? "rotate-180" : ""
                                        )}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {calendarExpanded && (
                                    <>
                                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {calendars.map((cal) => (
                                                <label
                                                    key={cal.id}
                                                    className="flex items-center gap-3 cursor-pointer group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isCalendarSynced(cal.id)}
                                                        onChange={() => toggleCalendar(cal.id)}
                                                        disabled={isTogglingCalendar}
                                                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/20"
                                                    />
                                                    <span className="flex items-center gap-2 text-sm text-zinc-300 group-hover:text-white transition-colors">
                                                        {cal.color && (
                                                            <span
                                                                className="h-2 w-2 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: cal.color }}
                                                            />
                                                        )}
                                                        <span className="truncate">{cal.name}</span>
                                                        {cal.primary && (
                                                            <span className="text-xs text-zinc-600">(primary)</span>
                                                        )}
                                                        {cal.accessRole === 'freeBusyReader' && (
                                                            <span className="text-xs text-amber-500/70" title="Limited access - only free/busy times visible">
                                                                (busy only)
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex items-center justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => forceSync()}
                                                disabled={isForceSyncing}
                                                className="border-zinc-700 bg-zinc-800/50 text-xs hover:bg-zinc-700"
                                            >
                                                {isForceSyncing ? (
                                                    <>
                                                        <svg className="mr-1.5 h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Syncing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="mr-1.5 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Sync Now
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Block Form */}
                {showCreate && (
                    <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader className="relative">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <CardTitle className="text-lg">Create Block</CardTitle>
                            <CardDescription>
                                Schedule a new time block
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">
                                    Title
                                </label>
                                <Input
                                    value={newBlock.title}
                                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                                    placeholder="Deep Work: Feature X"
                                    className="border-zinc-700 bg-zinc-800/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">
                                    Start Time
                                </label>
                                <DateTimePicker
                                    value={newBlock.startTime}
                                    onChange={(date) => setNewBlock({ ...newBlock, startTime: date })}
                                    minDate={getDefaultStartTime()}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="w-[55%]">
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">
                                        Type
                                    </label>
                                    <Select
                                        value={newBlock.type}
                                        onValueChange={(value: BlockType) =>
                                            setNewBlock({ ...newBlock, type: value })
                                        }
                                    >
                                        <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-zinc-700 bg-zinc-900">
                                            <SelectItem value="focus">🎯 Focus</SelectItem>
                                            <SelectItem value="admin">📋 Admin</SelectItem>
                                            <SelectItem value="busy">📅 Busy</SelectItem>
                                            <SelectItem value="recovery">🧘 Recovery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-[45%]">
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">
                                        Duration
                                    </label>
                                    <Select
                                        value={newBlock.duration}
                                        onValueChange={(value) => setNewBlock({ ...newBlock, duration: value })}
                                    >
                                        <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-zinc-700 bg-zinc-900">
                                            <SelectItem value="15">15 min</SelectItem>
                                            <SelectItem value="25">25 min</SelectItem>
                                            <SelectItem value="30">30 min</SelectItem>
                                            <SelectItem value="45">45 min</SelectItem>
                                            <SelectItem value="60">1 hour</SelectItem>
                                            <SelectItem value="90">1.5 hours</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                            <SelectItem value="150">2.5 hours</SelectItem>
                                            <SelectItem value="180">3 hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">
                                    Stop Condition (optional)
                                </label>
                                <Textarea
                                    value={newBlock.stopCondition}
                                    onChange={(e) => setNewBlock({ ...newBlock, stopCondition: e.target.value })}
                                    placeholder="What signals completion?"
                                    rows={2}
                                    className="resize-none border-zinc-700 bg-zinc-800/50"
                                />
                            </div>

                            {/* Buffer Blocks */}
                            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                                <label className="mb-3 block text-sm font-medium text-zinc-400">
                                    ✨ Add Buffer Blocks (Recovery time)
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-zinc-500">
                                            Before
                                        </label>
                                        <Select
                                            value={newBlock.bufferBefore}
                                            onValueChange={(value) => setNewBlock({ ...newBlock, bufferBefore: value })}
                                        >
                                            <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-zinc-700 bg-zinc-900">
                                                <SelectItem value="0">None</SelectItem>
                                                <SelectItem value="5">5 min</SelectItem>
                                                <SelectItem value="10">10 min</SelectItem>
                                                <SelectItem value="15">15 min</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-zinc-500">
                                            After
                                        </label>
                                        <Select
                                            value={newBlock.bufferAfter}
                                            onValueChange={(value) => setNewBlock({ ...newBlock, bufferAfter: value })}
                                        >
                                            <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-zinc-700 bg-zinc-900">
                                                <SelectItem value="0">None</SelectItem>
                                                <SelectItem value="5">5 min</SelectItem>
                                                <SelectItem value="10">10 min</SelectItem>
                                                <SelectItem value="15">15 min</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-zinc-600">
                                    Buffer blocks help you transition between tasks
                                </p>
                            </div>

                            <Button
                                onClick={handleCreate}
                                disabled={!newBlock.title || !newBlock.startTime || isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-500"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Block'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Block List / Calendar View */}
                <div className="space-y-3">
                    {/* View Mode Controls */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Time Range Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('today')}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                    viewMode === 'today'
                                        ? "bg-white text-black"
                                        : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                )}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                    viewMode === 'week'
                                        ? "bg-white text-black"
                                        : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                )}
                            >
                                Week
                            </button>
                        </div>

                        {/* List/Calendar Toggle + Count */}
                        <div className="flex items-center gap-3">
                            {allBlocks.length > 0 && (
                                <p className="text-xs text-zinc-600">
                                    {allBlocks.length} block{allBlocks.length !== 1 ? 's' : ''}
                                </p>
                            )}
                            <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                                <button
                                    onClick={() => setDisplayMode('list')}
                                    className={cn(
                                        "p-2 rounded-md transition-colors",
                                        displayMode === 'list'
                                            ? "bg-zinc-700 text-white"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                    title="List view"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setDisplayMode('calendar')}
                                    className={cn(
                                        "p-2 rounded-md transition-colors",
                                        displayMode === 'calendar'
                                            ? "bg-zinc-700 text-white"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                    title="Calendar view"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
                                        <path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading || isLoadingEvents ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                        </div>
                    ) : allBlocks.length === 0 ? (
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <span className="text-4xl mb-4">📅</span>
                                <p className="text-zinc-400">No blocks scheduled for today</p>
                                <p className="text-sm text-zinc-600 mt-1">
                                    {isConnected
                                        ? 'Your calendar is empty, or create a manual block'
                                        : 'Connect your calendar or create a manual block'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : displayMode === 'calendar' ? (
                        <CalendarView
                            blocks={allBlocks}
                            viewMode={viewMode}
                            colorPrefs={colorPrefs}
                            calendars={allCalendars}
                            onBlockClick={(blockId) => {
                                // For now, just log - could open a detail modal
                                console.log('Block clicked:', blockId)
                            }}
                        />
                    ) : (
                        allBlocks.map((block) => {
                            const status = getBlockStatus(block, block.session, currentTime)
                            const trackable = isTrackable(block.type)
                            const config = getBlockConfig(block.type)

                            // Get the left border color for this block
                            const calendarColor = block.source === 'calendar' ? getCalendarColor(block.calendar_id, allCalendars) : undefined

                            return (
                                <Card
                                    key={block.id}
                                    className={cn(
                                        "border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-colors hover:border-zinc-700",
                                        // Source indicator - left border
                                        "border-l-2",
                                        // Manual blocks use user preference, calendar blocks use inline style
                                        block.source === 'manual' && getBlockColorClass(colorPrefs.manualBlockColor),
                                        // Status overrides
                                        status.status === 'ready' && trackable && "ring-1 ring-emerald-500/30",
                                        status.status === 'done' && "opacity-60",
                                        status.status === 'missed' && "border-l-amber-500" // Override source color when missed
                                    )}
                                    style={
                                        // For calendar blocks, use the actual calendar color (unless missed)
                                        // Fallback to grey (#71717a = zinc-500) if no color is found
                                        block.source === 'calendar' && status.status !== 'missed'
                                            ? { borderLeftColor: calendarColor ?? '#71717a' }
                                            : undefined
                                    }
                                >
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                            status.status === 'done' ? "bg-emerald-500/20" :
                                                status.status === 'stopped' ? "bg-amber-500/20" :
                                                    status.status === 'missed' ? "bg-red-500/20" :
                                                        status.status === 'skipped' ? "bg-zinc-500/20" :
                                                            "bg-zinc-800"
                                        )}>
                                            {(() => {
                                                // Use status icon for completed/stopped/missed/skipped, otherwise block type icon
                                                if (status.status === 'done') {
                                                    const Icon = STATUS_ICONS.done
                                                    return <Icon className="h-5 w-5 text-emerald-400" />
                                                }
                                                if (status.status === 'stopped') {
                                                    const Icon = STATUS_ICONS.stopped
                                                    return <Icon className="h-5 w-5 text-amber-400" />
                                                }
                                                if (status.status === 'missed') {
                                                    const Icon = STATUS_ICONS.missed
                                                    return <Icon className="h-5 w-5 text-red-400" />
                                                }
                                                if (status.status === 'skipped') {
                                                    const Icon = STATUS_ICONS.skipped
                                                    return <Icon className="h-5 w-5 text-zinc-400" />
                                                }
                                                const Icon = config.icon
                                                return <Icon className={cn("h-5 w-5", config.color.text)} />
                                            })()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn(
                                                "truncate font-medium",
                                                (status.status === 'done' || status.status === 'skipped') ? "text-zinc-400" : "text-white"
                                            )}>
                                                {block.title}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", getBlockTypeColor(block.type))}
                                                >
                                                    {config.label}
                                                </Badge>
                                                {/* Status badge for non-pending states */}
                                                {(status.status === 'done' || status.status === 'stopped' || status.status === 'missed' || status.status === 'skipped') && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("text-xs",
                                                            status.status === 'done' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                            status.status === 'stopped' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                            status.status === 'missed' && "bg-red-500/10 text-red-400 border-red-500/20",
                                                            status.status === 'skipped' && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                        )}
                                                    >
                                                        {status.status === 'skipped' ? '⏭️ Skipped' : status.label}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-zinc-500">
                                                    {viewMode === 'week' && <>{formatDate(block.planned_start)} · </>}
                                                    {formatTime(block.planned_start)} - {formatTime(block.planned_end)}
                                                </span>
                                            </div>
                                            {block.stop_condition && (
                                                <p className="mt-2 text-xs text-zinc-500 truncate">
                                                    🎯 {block.stop_condition}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons based on status and trackability */}
                                        <div className="flex items-center gap-1">
                                            {/* Trackable blocks: Show Start button when ready/upcoming */}
                                            {trackable && status.canStart && (
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        "text-xs",
                                                        status.status === 'ready'
                                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                            : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                                                    )}
                                                    onClick={() => handleStart(block.id)}
                                                >
                                                    {status.status === 'ready' ? 'Start' : 'Start Early'}
                                                </Button>
                                            )}

                                            {/* Resolve button for missed trackable blocks */}
                                            {trackable && status.status === 'missed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs border-amber-600/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                                                    onClick={() => handleResolve(block.id)}
                                                >
                                                    Resolve
                                                </Button>
                                            )}

                                            {/* Calendar link for synced blocks */}
                                            {(block.google_event_id || (block.source === 'calendar' && block.calendar_link)) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-blue-400"
                                                    title="Open in Google Calendar"
                                                    asChild
                                                >
                                                    <a
                                                        href={block.calendar_link || `https://calendar.google.com/calendar/event?eid=${block.google_event_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
                                                            <path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
                                                        </svg>
                                                    </a>
                                                </Button>
                                            )}

                                            {/* Linear ticket link */}
                                            {block.linear_issue_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-indigo-400"
                                                    title={`Open ${block.linear_issue_id}`}
                                                    asChild
                                                >
                                                    <a
                                                        href={`https://linear.app/issue/${block.linear_issue_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                        </svg>
                                                    </a>
                                                </Button>
                                            )}

                                            {/* External task link (for other integrations) */}
                                            {block.task_link && !block.linear_issue_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-purple-400"
                                                    title="Open task link"
                                                    asChild
                                                >
                                                    <a
                                                        href={block.task_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                </Button>
                                            )}

                                            {/* Edit/Details button for completed blocks */}
                                            {(status.status === 'done' || status.status === 'stopped' || status.status === 'skipped') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-white"
                                                    title="View stats & edit"
                                                    onClick={() => router.push(`/blocks/${block.id}`)}
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </Button>
                                            )}

                                            {/* Delete button for manual blocks that haven't started */}
                                            {block.source === 'manual' && (status.status === 'upcoming' || status.status === 'ready') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-red-400"
                                                    onClick={() => handleDelete(block.id)}
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Resolve Modal */}
            {
                resolveBlockId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-sm mx-4 border-zinc-700 bg-zinc-900">
                            {resolveStep === 'choice' ? (
                                <>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Resolve Missed Block</CardTitle>
                                        <CardDescription>
                                            What happened with this block?
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2">
                                        <button
                                            className="w-full flex items-center gap-4 p-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                            onClick={() => handleResolutionChoice('done')}
                                        >
                                            <span className="text-2xl">✅</span>
                                            <div className="text-left">
                                                <p className="font-medium text-white">I completed it</p>
                                                <p className="text-sm text-emerald-100/80">Mark as done</p>
                                            </div>
                                        </button>

                                        <button
                                            className="w-full flex items-center gap-4 p-4 rounded-md border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 transition-colors"
                                            onClick={handleSkipChoice}
                                        >
                                            <span className="text-2xl">⏭️</span>
                                            <div className="text-left">
                                                <p className="font-medium text-zinc-200">I skipped it</p>
                                                <p className="text-sm text-zinc-500">Didn't get to it this time</p>
                                            </div>
                                        </button>

                                        <div className="pt-3">
                                            <Button
                                                variant="ghost"
                                                className="w-full text-zinc-500 hover:text-zinc-300"
                                                onClick={() => setResolveBlockId(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </>
                            ) : (
                                <>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Why did you skip?</CardTitle>
                                        <CardDescription>
                                            This helps identify patterns for better planning
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {SKIP_REASONS.map((reason) => (
                                            <button
                                                key={reason.value}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-md border transition-colors text-left",
                                                    skipReason === reason.value
                                                        ? "border-white/30 bg-zinc-800"
                                                        : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                                                )}
                                                onClick={() => setSkipReason(reason.value)}
                                            >
                                                <span className="text-xl">{reason.emoji}</span>
                                                <span className="text-zinc-200">{reason.label}</span>
                                            </button>
                                        ))}

                                        {skipReason === 'other' && (
                                            <Textarea
                                                placeholder="What happened?"
                                                value={otherReason}
                                                onChange={(e) => setOtherReason(e.target.value)}
                                                className="mt-2 bg-zinc-800 border-zinc-700"
                                            />
                                        )}

                                        <div className="flex gap-2 pt-3">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-zinc-700"
                                                onClick={() => setResolveStep('choice')}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
                                                disabled={!skipReason || (skipReason === 'other' && !otherReason.trim())}
                                                onClick={handleSkipSubmit}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>
                )
            }
        </div>
    )
}
