'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '@/types/database'

const BLOCK_CONFIGS = {
    focus: { label: 'Focus', emoji: '🎯', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    admin: { label: 'Admin', emoji: '📋', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    recovery: { label: 'Recovery', emoji: '✨', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    busy: { label: 'Busy', emoji: '📅', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
}

export default function BlockDetailPage() {
    const router = useRouter()
    const params = useParams()
    const blockId = params.id as string

    const [block, setBlock] = useState<Block | null>(null)
    const [session, setSession] = useState<{ id: string; actual_start: string; actual_end?: string; time_to_start?: number; outcome?: string; abort_reason?: string; resume_token?: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Editable fields
    const [title, setTitle] = useState('')
    const [type, setType] = useState<BlockType>('focus')
    const [stopCondition, setStopCondition] = useState('')
    const [taskLink, setTaskLink] = useState('')
    const [linearIssueId, setLinearIssueId] = useState('')
    const [plannedStart, setPlannedStart] = useState('')
    const [plannedEnd, setPlannedEnd] = useState('')

    // Session editable fields
    const [outcome, setOutcome] = useState<string>('')
    const [abortReason, setAbortReason] = useState<string>('')
    const [resumeToken, setResumeToken] = useState<string>('')

    useEffect(() => {
        async function loadBlock() {
            const supabase = createClient()

            // Fetch block
            const { data: blockData, error: blockError } = await supabase
                .from('blocks')
                .select('*')
                .eq('id', blockId)
                .single()

            if (blockError || !blockData) {
                console.error('Failed to load block:', blockError)
                router.push('/blocks')
                return
            }

            setBlock(blockData)
            setTitle(blockData.title)
            setType(blockData.type as BlockType)
            setStopCondition(blockData.stop_condition || '')
            setTaskLink(blockData.task_link || '')
            setLinearIssueId(blockData.linear_issue_id || '')
            setPlannedStart(formatDateTimeLocal(blockData.planned_start))
            setPlannedEnd(formatDateTimeLocal(blockData.planned_end))

            // Fetch associated session if exists
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('id, actual_start, actual_end, time_to_start, outcome, abort_reason, resume_token')
                .eq('block_id', blockId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (sessionData && sessionData.actual_start) {
                setSession({
                    id: sessionData.id,
                    actual_start: sessionData.actual_start,
                    actual_end: sessionData.actual_end ?? undefined,
                    time_to_start: sessionData.time_to_start ?? undefined,
                    outcome: sessionData.outcome ?? undefined,
                    abort_reason: sessionData.abort_reason ?? undefined,
                    resume_token: sessionData.resume_token ?? undefined,
                })
                setOutcome(sessionData.outcome ?? '')
                setAbortReason(sessionData.abort_reason ?? '')
                setResumeToken(sessionData.resume_token ?? '')
            }

            setIsLoading(false)
        }

        loadBlock()
    }, [blockId, router])

    function formatDateTimeLocal(isoString: string): string {
        const date = new Date(isoString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const mins = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${mins}`
    }

    async function handleSave() {
        if (!block) return
        setIsSaving(true)

        const supabase = createClient()
        
        try {
            // Update block
            const { error: blockError } = await supabase
                .from('blocks')
                .update({
                    title,
                    type,
                    stop_condition: stopCondition || null,
                    task_link: taskLink || null,
                    linear_issue_id: linearIssueId || null,
                    planned_start: new Date(plannedStart).toISOString(),
                    planned_end: new Date(plannedEnd).toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', block.id)

            if (blockError) throw blockError

            // Update session if it exists
            if (session) {
                const { error: sessionError } = await supabase
                    .from('sessions')
                    .update({
                        outcome: outcome || null,
                        abort_reason: abortReason || null,
                        resume_token: resumeToken || null,
                    })
                    .eq('id', session.id)

                if (sessionError) throw sessionError
            }

            alert('✅ Block updated!')
            router.push('/blocks')
        } catch (error) {
            alert('❌ Failed to save changes')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete() {
        if (!block) return
        if (!confirm('Are you sure you want to delete this block?\n\nThis action cannot be undone.')) return

        setIsDeleting(true)
        const supabase = createClient()

        // Delete associated sessions first
        await supabase.from('sessions').delete().eq('block_id', block.id)

        // Delete the block
        const { error } = await supabase.from('blocks').delete().eq('id', block.id)

        if (error) {
            alert('❌ Failed to delete block')
            console.error(error)
            setIsDeleting(false)
        } else {
            router.push('/blocks')
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
            </div>
        )
    }

    if (!block) return null

    const config = BLOCK_CONFIGS[block.type as keyof typeof BLOCK_CONFIGS] || BLOCK_CONFIGS.focus
    const plannedDuration = Math.round(
        (new Date(block.planned_end).getTime() - new Date(block.planned_start).getTime()) / 60000
    )

    // Calculate actual duration if session exists
    let actualDuration: number | null = null
    if (session?.actual_start && session?.actual_end) {
        actualDuration = Math.round(
            (new Date(session.actual_end).getTime() - new Date(session.actual_start).getTime()) / 60000
        )
    }

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/blocks')}
                        className="text-zinc-500 hover:text-white"
                    >
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Button>
                    <h1 className="text-xl font-bold text-white">Block Details</h1>
                    <div className="w-16" />
                </div>

                {/* Block Header Card */}
                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                                {config.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-white truncate">{block.title}</h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge className={cn("text-xs font-medium", config.color)}>
                                        {config.label}
                                    </Badge>
                                    <span className="text-sm text-zinc-500">{plannedDuration} min</span>
                                    {block.calendar_id && (
                                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs">
                                            📅 Calendar
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Card */}
                {session && (
                    <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>📊</span> Session Stats
                            </CardTitle>
                            <CardDescription>Performance data from this block</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-zinc-800/50 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Time to Start</p>
                                    <p className="mt-1 text-2xl font-bold text-white">
                                        {session.time_to_start !== undefined
                                            ? session.time_to_start < 60
                                                ? `${session.time_to_start}s`
                                                : `${Math.floor(session.time_to_start / 60)}m`
                                            : '—'}
                                    </p>
                                    {session.time_to_start !== undefined && session.time_to_start <= 60 && (
                                        <p className="mt-1 text-xs text-emerald-400">🔥 Quick start!</p>
                                    )}
                                </div>
                                <div className="rounded-lg bg-zinc-800/50 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Actual Duration</p>
                                    <p className="mt-1 text-2xl font-bold text-white">
                                        {actualDuration !== null ? `${actualDuration}m` : '—'}
                                    </p>
                                    {actualDuration !== null && (
                                        <p className={cn(
                                            "mt-1 text-xs",
                                            actualDuration <= plannedDuration ? "text-emerald-400" : "text-amber-400"
                                        )}>
                                            {actualDuration <= plannedDuration
                                                ? '✓ On time'
                                                : `+${actualDuration - plannedDuration}m overrun`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                                <span>Started:</span>
                                <span>{new Date(session.actual_start).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Edit Form */}
                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <span>✏️</span> Edit Block
                        </CardTitle>
                        <CardDescription>Update block details and links</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="border-zinc-700 bg-zinc-800/50"
                            />
                        </div>

                        {/* Type & Times Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Type</label>
                                <Select value={type} onValueChange={(v: BlockType) => setType(v)}>
                                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-zinc-700 bg-zinc-900">
                                        <SelectItem value="focus">🎯 Focus</SelectItem>
                                        <SelectItem value="admin">📋 Admin</SelectItem>
                                        <SelectItem value="busy">📅 Busy</SelectItem>
                                        <SelectItem value="recovery">✨ Recovery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={plannedStart}
                                    onChange={(e) => setPlannedStart(e.target.value)}
                                    className="w-full h-9 px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">End Time</label>
                            <input
                                type="datetime-local"
                                value={plannedEnd}
                                onChange={(e) => setPlannedEnd(e.target.value)}
                                className="w-full h-9 px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]"
                            />
                        </div>

                        {/* Stop Condition */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">Stop Condition</label>
                            <Input
                                value={stopCondition}
                                onChange={(e) => setStopCondition(e.target.value)}
                                placeholder="e.g., Complete 3 Pomodoros, finish code review"
                                className="border-zinc-700 bg-zinc-800/50"
                            />
                            <p className="mt-1 text-xs text-zinc-600">Define what "done" looks like for this block</p>
                        </div>

                        {/* Session Section (if exists) */}
                        {session && (
                            <div className="border-t border-zinc-800 pt-4">
                                <p className="mb-3 text-sm font-medium text-zinc-300">⏱️ Session Details</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-400">Outcome</label>
                                        <Select value={outcome} onValueChange={setOutcome}>
                                            <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                                <SelectValue placeholder="Select outcome" />
                                            </SelectTrigger>
                                            <SelectContent className="border-zinc-700 bg-zinc-900">
                                                <SelectItem value="done">✅ Done</SelectItem>
                                                <SelectItem value="aborted">⏹️ Stopped</SelectItem>
                                                <SelectItem value="skipped">⏭️ Skipped</SelectItem>
                                                <SelectItem value="abandoned">⚠️ Abandoned (Unsaved)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(outcome === 'aborted' || outcome === 'skipped' || outcome === 'abandoned') && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-zinc-400">Reason</label>
                                            <Input
                                                value={abortReason}
                                                onChange={(e) => setAbortReason(e.target.value)}
                                                placeholder="Why was it stopped/skipped?"
                                                className="border-zinc-700 bg-zinc-800/50"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-400">Next Obvious Step</label>
                                        <Input
                                            value={resumeToken}
                                            onChange={(e) => setResumeToken(e.target.value)}
                                            placeholder="What's next?"
                                            className="border-zinc-700 bg-zinc-800/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Links Section */}
                        <div className="border-t border-zinc-800 pt-4">
                            <p className="mb-3 text-sm font-medium text-zinc-300">🔗 Links</p>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">Linear Issue ID</label>
                                    <Input
                                        value={linearIssueId}
                                        onChange={(e) => setLinearIssueId(e.target.value)}
                                        placeholder="e.g., SKT-123"
                                        className="border-zinc-700 bg-zinc-800/50"
                                    />
                                    <p className="mt-1 text-xs text-zinc-600">Link to a Linear issue (just the ID like SKT-123)</p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">Task Link</label>
                                    <Input
                                        value={taskLink}
                                        onChange={(e) => setTaskLink(e.target.value)}
                                        placeholder="https://..."
                                        className="border-zinc-700 bg-zinc-800/50"
                                    />
                                    <p className="mt-1 text-xs text-zinc-600">External link (Notion, GitHub PR, etc.)</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 border-t border-zinc-800 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !title}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Links Card */}
                {(block.task_link || block.linear_issue_id || block.google_event_id) && (
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Quick Links</p>
                            <div className="flex flex-wrap gap-2">
                                {block.linear_issue_id && (
                                    <a
                                        href={`https://linear.app/issue/${block.linear_issue_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20"
                                    >
                                        📐 {block.linear_issue_id}
                                    </a>
                                )}
                                {block.task_link && (
                                    <a
                                        href={block.task_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 ring-1 ring-purple-500/20 hover:bg-purple-500/20"
                                    >
                                        🔗 Open Link
                                    </a>
                                )}
                                {block.google_event_id && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                                        📅 Synced to Calendar
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
