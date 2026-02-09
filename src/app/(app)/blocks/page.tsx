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
import { Sparkles, Wand2, Check, X } from 'lucide-react'

type ViewMode = 'today' | 'week'
type DisplayMode = 'list' | 'calendar'

function getBlockTypeColor(type: string): string {
    const config = BLOCK_CONFIGS[type as BlockType]
    if (config) {
        return `${config.color.bg} ${config.color.text} ${config.color.border}`
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
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

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}

// Helper to get calendar color by ID
function getCalendarColor(calendarId: string | null | undefined, calendars: Array<{ id: string; color?: string }>): string | undefined {
    if (!calendarId) return undefined
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

export default function BlocksPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const supabase = createClient()
    const [viewMode, setViewMode] = useState<ViewMode>('today')
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })
    const { blocks, isLoading, createBlock, updateBlock, deleteBlock } = useBlocks(viewMode, selectedDate)

    const [isRefactoring, setIsRefactoring] = useState(false)
    const [refactorProposal, setRefactorProposal] = useState<DisplayBlock[] | null>(null)

    const {
        isConnected,
        isLoadingCalendars,
        isLoadingEvents,
        connectCalendar,
        events,
        calendars,
        allCalendars,
        syncedCalendarIds,
        lastCalendarSync,
        isCalendarSynced,
        toggleCalendar,
        isTogglingCalendar,
        refreshEvents
    } = useCalendar()
    const { forceSync, isForceSyncing } = useCalendarSync()
    const { preferences: colorPrefs } = useBlockColorPreferences()

    const allBlocks = useMemo<DisplayBlock[]>(() => {
        return blocks.map(block => {
            const isCalendarBlock = !!block.calendar_id
            return {
                id: block.id,
                title: block.title,
                type: isCalendarBlock && !['focus', 'admin', 'recovery'].includes(block.type || '')
                    ? 'busy' as BlockType
                    : (block.type as BlockType) || 'focus',
                planned_start: block.planned_start,
                planned_end: block.planned_end,
                stop_condition: block.stop_condition ?? undefined,
                source: isCalendarBlock ? 'calendar' as const : 'manual' as const,
                calendar_id: block.calendar_id,
                calendar_link: isCalendarBlock ? block.task_link ?? undefined : undefined,
                google_event_id: block.google_event_id,
                linear_issue_id: block.linear_issue_id,
                routine_id: block.routine_id,
                task_link: !isCalendarBlock ? block.task_link : undefined,
                session: (block as { session?: any }).session ?? null,
            }
        }).sort((a, b) =>
            new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
        )
    }, [blocks])

    const handlePrev = () => {
        const d = new Date(selectedDate)
        if (viewMode === 'today') {
            d.setDate(d.getDate() - 1)
        } else {
            d.setDate(d.getDate() - 7)
        }
        setSelectedDate(d)
    }

    const handleNext = () => {
        const d = new Date(selectedDate)
        if (viewMode === 'today') {
            d.setDate(d.getDate() + 1)
        } else {
            d.setDate(d.getDate() + 7)
        }
        setSelectedDate(d)
    }

    const handleToday = () => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        setSelectedDate(d)
    }

    const formattedSelectedDate = useMemo(() => {
        if (viewMode === 'today') {
            const now = new Date()
            if (isSameDay(selectedDate, now)) return 'Today'
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            if (isSameDay(selectedDate, yesterday)) return 'Yesterday'
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow'
            return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        } else {
            const end = new Date(selectedDate)
            end.setDate(end.getDate() + 6)
            return `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
    }, [selectedDate, viewMode])

    const handleBlockUpdate = async (id: string, updates: { planned_start: string; planned_end: string }) => {
        try {
            await updateBlock.mutateAsync({ id, updates })
        } catch (error) {
            console.error('Failed to update block:', error)
        }
    }

    const handleAIRefactor = async () => {
        setIsRefactoring(true)
        try {
            const start = new Date(selectedDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setDate(end.getDate() + 1)
            const blocksToRefactor = allBlocks.filter(b => {
                const bStart = new Date(b.planned_start)
                return bStart >= start && bStart < end
            })
            const response = await fetch('/api/blocks/refactor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks: blocksToRefactor })
            })
            const data = await response.json()
            if (data.proposal) setRefactorProposal(data.proposal)
            else alert(data.message || 'AI could not generate a better schedule.')
        } catch (error) {
            console.error('AI Refactor failed:', error)
        } finally {
            setIsRefactoring(false)
        }
    }

    const commitRefactor = async () => {
        if (!refactorProposal) return
        setIsSubmitting(true)
        try {
            for (const p of refactorProposal) {
                await updateBlock.mutateAsync({ id: p.id, updates: { planned_start: p.planned_start, planned_end: p.planned_end } })
            }
            setRefactorProposal(null)
            alert('✅ Schedule updated!')
        } catch (error) {
            console.error('Failed to commit refactor:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const [currentTime, setCurrentTime] = useState(() => new Date())
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const [showCreate, setShowCreate] = useState(false)
    const [calendarExpanded, setCalendarExpanded] = useState(false)
    const [displayMode, setDisplayMode] = useState<DisplayMode>('list')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPushingToCalendar, setIsPushingToCalendar] = useState(false)
    const [newBlock, setNewBlock] = useState<{
        title: string; type: BlockType; duration: string; stopCondition: string; startTime: Date | undefined; bufferBefore: string; bufferAfter: string
    }>({
        title: '', type: 'focus', duration: '25', stopCondition: '', startTime: undefined, bufferBefore: '0', bufferAfter: '0'
    })

    const SKIP_REASONS = [
        { value: 'no_time', label: 'Ran out of time', emoji: '⏰' },
        { value: 'higher_priority', label: 'Higher priority came up', emoji: '🚨' },
        { value: 'not_ready', label: 'Wasn\'t ready', emoji: '🤷' },
        { value: 'energy_low', label: 'Energy too low', emoji: '😴' },
        { value: 'context_switch', label: 'Too much context switching', emoji: '🔄' },
        { value: 'forgot', label: 'Forgot', emoji: '🙈' },
        { value: 'other', label: 'Other', emoji: '✏️' },
    ]

    const [resolveBlockId, setResolveBlockId] = useState<string | null>(null)
    const [resolveStep, setResolveStep] = useState<'choice' | 'skip_reason'>('choice')
    const [skipReason, setSkipReason] = useState<string>('')
    const [otherReason, setOtherReason] = useState<string>('')

    const handleStart = (blockId: string) => {
        const block = allBlocks.find(b => b.id === blockId)
        if (block) {
            const endTime = new Date(block.planned_end)
            const now = new Date()
            if (now >= endTime) {
                handleResolve(blockId)
                return
            }
        }
        sessionStorage.setItem('startBlockId', blockId)
        router.push('/now')
    }

    const handleResolve = (blockId: string) => {
        setResolveBlockId(blockId)
        setResolveStep('choice')
    }

    const handleResolutionChoice = async (outcome: 'done' | 'skipped', reason?: string) => {
        if (!resolveBlockId) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const block = allBlocks.find(b => b.id === resolveBlockId)
            if (!block) throw new Error('Block not found')
            const sessionData: any = { user_id: user.id, block_id: resolveBlockId, outcome }
            if (outcome === 'done') {
                sessionData.actual_start = block.planned_start
                sessionData.actual_end = block.planned_end
            }
            if (outcome === 'skipped' && reason) sessionData.abort_reason = reason
            const { error } = await supabase.from('sessions').insert(sessionData)
            if (error) throw error
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
        } catch (error) {
            console.error('Failed to resolve block:', error)
        } finally {
            setResolveBlockId(null)
        }
    }

    const handleCreate = async () => {
        if (!newBlock.title || !newBlock.startTime) return
        setIsSubmitting(true)
        try {
            const bufferBeforeMs = parseInt(newBlock.bufferBefore) * 60 * 1000
            const bufferAfterMs = parseInt(newBlock.bufferAfter) * 60 * 1000
            const durationMs = parseInt(newBlock.duration) * 60 * 1000
            const mainBlockStart = new Date(newBlock.startTime)
            const mainBlockEnd = new Date(mainBlockStart.getTime() + durationMs)

            if (bufferBeforeMs > 0) {
                await createBlock.mutateAsync({
                    title: 'Buffer', type: 'recovery',
                    planned_start: new Date(mainBlockStart.getTime() - bufferBeforeMs).toISOString(),
                    planned_end: mainBlockStart.toISOString(),
                })
            }
            await createBlock.mutateAsync({
                title: newBlock.title, type: newBlock.type,
                planned_start: mainBlockStart.toISOString(),
                planned_end: mainBlockEnd.toISOString(),
                stop_condition: newBlock.stopCondition || undefined,
            })
            if (bufferAfterMs > 0) {
                await createBlock.mutateAsync({
                    title: 'Buffer', type: 'recovery',
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
        try { await deleteBlock.mutateAsync(blockId) } catch (error) { console.error(error) }
    }

    const getDefaultStartTime = (): Date => {
        const now = new Date(selectedDate)
        const realNow = new Date()
        if (isSameDay(now, realNow)) now.setHours(realNow.getHours(), realNow.getMinutes(), 0, 0)
        else now.setHours(9, 0, 0, 0)
        const minutes = Math.ceil(now.getMinutes() / 15) * 15
        if (minutes === 60) now.setHours(now.getHours() + 1, 0, 0, 0)
        else now.setMinutes(minutes, 0, 0)
        return now
    }

    const handlePushToCalendar = async () => {
        setIsPushingToCalendar(true)
        try {
            const response = await fetch('/api/calendar/push', { method: 'POST' })
            const data = await response.json()
            if (data.success) alert(`✅ Pushed ${data.pushed} and updated ${data.updated} blocks!`)
            else alert(`❌ Error: ${data.error}`)
        } catch (error) {
            console.error(error)
        } finally {
            setIsPushingToCalendar(false)
        }
    }

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blocks</h1>
                        <p className="mt-1 text-sm text-zinc-500">Manage your time blocks</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleAIRefactor}
                            disabled={isRefactoring || allBlocks.length === 0}
                            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        >
                            {isRefactoring ? <span className="animate-pulse">Analyzing...</span> : <><Wand2 className="mr-2 h-4 w-4" /> Refactor</>}
                        </Button>
                        <Button
                            onClick={() => {
                                if (!showCreate) setNewBlock(prev => ({ ...prev, startTime: getDefaultStartTime() }))
                                setShowCreate(!showCreate)
                            }}
                            className="bg-white text-black hover:bg-zinc-200"
                        >
                            {showCreate ? 'Cancel' : '+ New Block'}
                        </Button>
                    </div>
                </div>

                <div className="mb-6 flex items-center justify-between bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 text-zinc-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-xs text-zinc-400 hover:text-white">Today</Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 text-zinc-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Button>
                    </div>
                    <span className="text-sm font-semibold text-white">{formattedSelectedDate}</span>
                    <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                        <button onClick={() => setViewMode('today')} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === 'today' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}>Day</button>
                        <button onClick={() => setViewMode('week')} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === 'week' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}>Week</button>
                    </div>
                </div>

                {refactorProposal && (
                    <Card className="mb-6 border-emerald-500/50 bg-emerald-500/5 backdrop-blur-xl ring-1 ring-emerald-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-400 text-lg"><Sparkles className="h-5 w-5" /> AI Proposed a New Schedule</CardTitle>
                            <CardDescription className="text-emerald-400/70">The AI has optimized your remaining blocks.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setRefactorProposal(null)} className="text-zinc-400 hover:text-white"><X className="mr-2 h-4 w-4" /> Discard</Button>
                            <Button size="sm" onClick={commitRefactor} disabled={isSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-500"><Check className="mr-2 h-4 w-4" /> Apply Changes</Button>
                        </CardContent>
                    </Card>
                )}

                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" /></svg>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Google Calendar</p>
                                    <p className="text-sm text-zinc-500">{isLoadingCalendars ? 'Checking...' : isConnected ? `${events.length} events today` : 'Import events'}</p>
                                </div>
                            </div>
                            {isConnected ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">✓ Connected</Badge>
                                    <Button variant="ghost" size="sm" onClick={refreshEvents} disabled={isLoadingEvents} className="text-zinc-400 hover:text-white">
                                        <svg className={cn("h-4 w-4", isLoadingEvents && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handlePushToCalendar} disabled={isPushingToCalendar} className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Push</Button>
                                </div>
                            ) : <Button onClick={connectCalendar} size="sm" className="bg-blue-600 hover:bg-blue-500" disabled={isLoadingCalendars}>Connect</Button>}
                        </div>
                    </CardContent>
                </Card>

                {showCreate && (
                    <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader className="relative">
                            <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="h-5 w-5" /></button>
                            <CardTitle className="text-lg">Create Block</CardTitle>
                            <CardDescription>Schedule a new time block</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} placeholder="Title" className="border-zinc-700 bg-zinc-800/50" />
                            <DateTimePicker value={newBlock.startTime} onChange={(date) => setNewBlock({ ...newBlock, startTime: date })} minDate={getDefaultStartTime()} />
                            <div className="flex gap-2">
                                <Select value={newBlock.type} onValueChange={(value: BlockType) => setNewBlock({ ...newBlock, type: value })}><SelectTrigger className="border-zinc-700 bg-zinc-800/50"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-900"><SelectItem value="focus">🎯 Focus</SelectItem><SelectItem value="admin">📋 Admin</SelectItem><SelectItem value="busy">📅 Busy</SelectItem><SelectItem value="recovery">🧘 Recovery</SelectItem></SelectContent></Select>
                                <Select value={newBlock.duration} onValueChange={(value) => setNewBlock({ ...newBlock, duration: value })}><SelectTrigger className="border-zinc-700 bg-zinc-800/50"><SelectValue /></SelectTrigger><SelectContent className="border-zinc-700 bg-zinc-900"><SelectItem value="15">15 min</SelectItem><SelectItem value="25">25 min</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="45">45 min</SelectItem><SelectItem value="60">1 hour</SelectItem></SelectContent></Select>
                            </div>
                            <Button onClick={handleCreate} disabled={!newBlock.title || !newBlock.startTime || isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500">{isSubmitting ? 'Creating...' : 'Create Block'}</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">{allBlocks.length > 0 && <p className="text-xs text-zinc-600">{allBlocks.length} block{allBlocks.length !== 1 ? 's' : ''} scheduled</p>}</div>
                        <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                            <button onClick={() => setDisplayMode('list')} className={cn("p-2 rounded-md transition-colors", displayMode === 'list' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                            <button onClick={() => setDisplayMode('calendar')} className={cn("p-2 rounded-md transition-colors", displayMode === 'calendar' ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg></button>
                        </div>
                    </div>

                    {isLoading || isLoadingEvents ? (
                        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" /></div>
                    ) : allBlocks.length === 0 ? (
                        <Card className="border-zinc-800 bg-zinc-900/50"><CardContent className="flex flex-col items-center py-12 text-center"><span className="text-4xl mb-4">📅</span><p className="text-zinc-400">No blocks scheduled for this period</p></CardContent></Card>
                    ) : displayMode === 'calendar' ? (
                        <CalendarView blocks={allBlocks} viewMode={viewMode} baseDate={selectedDate} colorPrefs={colorPrefs} calendars={allCalendars} onBlockClick={(id) => router.push(`/blocks/${id}`)} onBlockUpdate={handleBlockUpdate} />
                    ) : (
                        allBlocks.map((block) => {
                            const status = getBlockStatus(block, block.session, currentTime)
                            const config = getBlockConfig(block.type)
                            const calendarColor = block.source === 'calendar' ? getCalendarColor(block.calendar_id, allCalendars) : undefined
                            return (
                                <Card key={block.id} className={cn("border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-colors hover:border-zinc-700 border-l-2", block.source === 'manual' && getBlockColorClass(colorPrefs.manualBlockColor), status.status === 'ready' && isTrackable(block.type) && "ring-1 ring-emerald-500/30", status.status === 'done' && "opacity-60")} style={block.source === 'calendar' ? { borderLeftColor: calendarColor ?? '#71717a' } : undefined}>
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800")}>
                                            {(() => {
                                                const Icon = (status.status === 'done' ? STATUS_ICONS.done : status.status === 'skipped' ? STATUS_ICONS.skipped : config.icon)
                                                return <Icon className={cn("h-5 w-5", status.status === 'done' ? "text-emerald-400" : config.color.text)} />
                                            })()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("truncate font-medium", (status.status === 'done' || status.status === 'skipped') ? "text-zinc-400" : "text-white")}>{block.title}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className={cn("text-xs", getBlockTypeColor(block.type))}>{config.label}</Badge>
                                                <span className="text-xs text-zinc-500">{formatTime(block.planned_start)} - {formatTime(block.planned_end)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isTrackable(block.type) && status.canStart && <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => handleStart(block.id)}>{status.status === 'ready' ? 'Start' : 'Start Early'}</Button>}
                                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" onClick={() => router.push(`/blocks/${block.id}`)}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>

            {resolveBlockId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-sm mx-4 border-zinc-700 bg-zinc-900">
                        <CardHeader><CardTitle className="text-lg">Resolve Block</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <Button className="w-full bg-emerald-600" onClick={() => handleResolutionChoice('done')}>I completed it</Button>
                            <Button variant="outline" className="w-full" onClick={() => handleResolutionChoice('skipped')}>I skipped it</Button>
                            <Button variant="ghost" className="w-full" onClick={() => setResolveBlockId(null)}>Cancel</Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}