'use client'

import { useCurrentBlock } from '@/lib/hooks/useCurrentBlock'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { useSession } from '@/lib/hooks/useSession'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Block } from '@/types'

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getBlockTypeEmoji(type: string): string {
    switch (type) {
        case 'focus': return '🎯'
        case 'admin': return '📋'
        case 'recovery': return '🧘'
        default: return '⚡'
    }
}

function getBlockTypeColor(type: string): string {
    switch (type) {
        case 'focus': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        case 'admin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'recovery': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
}

export default function NowPage() {
    const { data: currentBlock, isLoading: currentBlockLoading } = useCurrentBlock()
    const { blocks, isLoading: blocksLoading } = useBlocks()
    const { isRunning, elapsedSeconds, startTimer, stopTimer, resumeTimer, tick, setCurrentBlock, restoreSession } = useExecutionStore()
    const { startSession, abandonSession, resumeSession, endSession } = useSession()
    const [mounted, setMounted] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const blockStartTimeRef = useRef<Date | null>(null)
    const [overrideBlock, setOverrideBlock] = useState<Block | null>(null)
    const [isRestoring, setIsRestoring] = useState(true)

    // Undo stop functionality
    const [pendingStop, setPendingStop] = useState(false)
    const [undoCountdown, setUndoCountdown] = useState(5)
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // The block to display - prefer override (from blocks page), fallback to current
    const activeBlock = overrideBlock || currentBlock

    useEffect(() => {
        setMounted(true)
    }, [])

    // Check for active session in DB on mount (handles page refresh)
    useEffect(() => {
        if (!mounted) return

        const detectActiveSession = async () => {
            try {
                const supabase = (await import('@/lib/supabase/client')).createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Look for most recent session with no outcome
                const { data: sessionData, error: sessionError } = await supabase
                    .from('sessions')
                    .select(`
                        *,
                        blocks (*)
                    `)
                    .eq('user_id', user.id)
                    .is('outcome', null)
                    .order('actual_start', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (sessionData && !sessionError && sessionData.actual_start) {
                    const block = sessionData.blocks as unknown as Block
                    const startTime = new Date(sessionData.actual_start)
                    const now = new Date()
                    const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000))

                    setCurrentSessionId(sessionData.id)
                    restoreSession(block, startTime, elapsed)
                    setOverrideBlock(block)
                    console.log('Restored active session:', sessionData.id)
                }
            } catch (err) {
                console.error('Error detecting active session:', err)
            } finally {
                setIsRestoring(false)
            }
        }

        detectActiveSession()
    }, [mounted, restoreSession])

    // Check for startBlockId in sessionStorage on mount - fetch directly by ID
    useEffect(() => {
        if (!mounted || !isRestoring) return // Wait for restoration check to finish

        // Only use sessionStorage if we didn't just restore a session
        if (currentSessionId) {
            sessionStorage.removeItem('startBlockId')
            return
        }

        const startBlockId = sessionStorage.getItem('startBlockId')
        if (startBlockId) {
            // Fetch the specific block directly - works for any block regardless of date
            const fetchBlock = async () => {
                const supabase = (await import('@/lib/supabase/client')).createClient()
                const { data, error } = await supabase
                    .from('blocks')
                    .select('*')
                    .eq('id', startBlockId)
                    .single()

                if (data && !error) {
                    setOverrideBlock(data as unknown as Block)
                }
                sessionStorage.removeItem('startBlockId')
            }
            fetchBlock()
        }
    }, [mounted])

    useEffect(() => {
        if (activeBlock) {
            setCurrentBlock(activeBlock)
            // Track when the block becomes current for TTS calculation
            if (!blockStartTimeRef.current) {
                blockStartTimeRef.current = new Date(activeBlock.planned_start)
            }
        }
    }, [activeBlock, setCurrentBlock])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning) {
            interval = setInterval(() => {
                tick()
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, tick])

    const isLoading = currentBlockLoading || blocksLoading

    if (!mounted || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            </div>
        )
    }

    if (!activeBlock) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                {/* Ambient glow effect */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/30 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-900 text-5xl shadow-xl ring-1 ring-zinc-800">
                        ⏸️
                    </div>
                    <h1 className="text-2xl font-bold text-white">No Active Block</h1>
                    <p className="mt-2 max-w-xs text-zinc-400">
                        You don&apos;t have a scheduled block right now. Create one or wait for your next block.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-8 h-12 px-6 text-base"
                        asChild
                    >
                        <Link href="/blocks">Manage Blocks</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const blockDurationMinutes = Math.round(
        (new Date(activeBlock.planned_end).getTime() - new Date(activeBlock.planned_start).getTime()) / 60000
    )

    const handleStart = async () => {
        if (!activeBlock) return

        // Calculate time-to-start (seconds since block started)
        const now = new Date()
        const blockStart = new Date(activeBlock.planned_start)
        const timeToStart = Math.max(0, Math.floor((now.getTime() - blockStart.getTime()) / 1000))

        try {
            const session = await startSession.mutateAsync({
                blockId: activeBlock.id,
                timeToStart,
            })
            setCurrentSessionId(session.id)
            startTimer()
        } catch (error) {
            console.error('Failed to start session:', error)
        }
    }

    const handleDone = () => {
        const sessionId = currentSessionId
        reset() // Clear store immediately
        if (sessionId) {
            window.location.href = `/save?outcome=done&sessionId=${sessionId}`
        } else {
            window.location.href = '/save?outcome=done'
        }
    }

    const handleStop = () => {
        // Stop timer immediately for visual feedback
        stopTimer()
        setPendingStop(true)
        setUndoCountdown(5)

        // Immediately mark session as abandoned in DB (data safety)
        if (currentSessionId) {
            abandonSession.mutate({ sessionId: currentSessionId })
        }

        // Start countdown interval
        countdownIntervalRef.current = setInterval(() => {
            setUndoCountdown(prev => {
                if (prev <= 1) {
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Set timeout to finalize stop after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
            }
            // Navigate to save page
            const sessionId = currentSessionId
            reset() // Clear store immediately
            if (sessionId) {
                window.location.href = `/save?outcome=aborted&sessionId=${sessionId}`
            } else {
                window.location.href = '/save?outcome=aborted'
            }
        }, 5000)
    }

    const handleUndoStop = () => {
        // Cancel the pending stop
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
            undoTimeoutRef.current = null
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
        }

        // Clear abandoned status in DB
        if (currentSessionId) {
            resumeSession.mutate({ sessionId: currentSessionId })
        }

        // Resume the session
        setPendingStop(false)
        setUndoCountdown(5)
        resumeTimer() // Resume timer from where we left off
    }

    const handleConfirmStop = () => {
        // Clear timers and navigate immediately
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
        }

        // Navigate to save page immediately
        const sessionId = currentSessionId
        reset() // Clear store immediately
        if (sessionId) {
            window.location.href = `/save?outcome=aborted&sessionId=${sessionId}`
        } else {
            window.location.href = '/save?outcome=aborted'
        }
    }

    // Calculate progress for the ring
    const totalSeconds = blockDurationMinutes * 60
    const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100)
    const circumference = 2 * Math.PI * 120 // radius = 120
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
            {/* Ambient glow effect */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className={cn(
                        "absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000",
                        isRunning ? "bg-emerald-500/10" : "bg-zinc-800/30"
                    )}
                />
            </div>

            <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
                {/* Block Card */}
                <Card className="mb-10 w-full border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                                {getBlockTypeEmoji(activeBlock.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-lg font-semibold text-white">
                                    {activeBlock.title}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs font-medium", getBlockTypeColor(activeBlock.type))}
                                    >
                                        {activeBlock.type.charAt(0).toUpperCase() + activeBlock.type.slice(1)}
                                    </Badge>
                                    <span className="text-sm text-zinc-500">
                                        {blockDurationMinutes} min
                                    </span>
                                </div>

                                {/* Time Range */}
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                                    <span>🕐</span>
                                    <span>
                                        {new Date(activeBlock.planned_start).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                        {' → '}
                                        {new Date(activeBlock.planned_end).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        {(activeBlock.task_link || activeBlock.linear_issue_id || activeBlock.calendar_id) && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                                {activeBlock.task_link && (
                                    <a
                                        href={activeBlock.task_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition-colors hover:bg-indigo-500/20"
                                    >
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                        </svg>
                                        {activeBlock.linear_issue_id || 'Linear'}
                                    </a>
                                )}
                                {activeBlock.calendar_id && (
                                    <a
                                        href={`https://calendar.google.com/calendar/event?eid=${activeBlock.calendar_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/20"
                                    >
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                                        </svg>
                                        Calendar
                                    </a>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Timer Circle */}
                <div className="relative mb-10">
                    {/* SVG Progress Ring */}
                    <svg className="h-64 w-64 -rotate-90" viewBox="0 0 256 256">
                        {/* Background ring */}
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-zinc-800"
                        />
                        {/* Progress ring */}
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={cn(
                                "transition-all duration-300",
                                isRunning ? "text-emerald-500" : "text-zinc-600"
                            )}
                        />
                    </svg>

                    {/* Timer Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-mono text-5xl font-bold tracking-tight text-white">
                            {formatTime(elapsedSeconds)}
                        </span>
                        {isRunning && (
                            <span className="mt-2 text-sm text-zinc-500">
                                of {blockDurationMinutes}:00
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full gap-3">
                    {!isRunning && !pendingStop ? (
                        <Button
                            onClick={handleStart}
                            size="lg"
                            className="h-14 flex-1 bg-emerald-600 text-lg font-semibold hover:bg-emerald-500"
                        >
                            START
                        </Button>
                    ) : pendingStop ? (
                        <Button
                            size="lg"
                            variant="outline"
                            disabled
                            className="h-14 flex-1 text-lg font-semibold opacity-50"
                        >
                            Stopping...
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleDone}
                                size="lg"
                                variant="secondary"
                                className="h-14 flex-1 text-lg font-semibold"
                            >
                                DONE
                            </Button>
                            <Button
                                onClick={handleStop}
                                size="lg"
                                variant="destructive"
                                className="h-14 flex-1 text-lg font-semibold"
                            >
                                STOP
                            </Button>
                        </>
                    )}
                </div>

                {/* Info Card (Stop Condition or Last Action) */}
                {(activeBlock.stop_condition || (lastSession?.resume_token && !isRunning)) && (
                    <Card className="mt-6 w-full border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4">
                            {activeBlock.stop_condition ? (
                                <>
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                        Stop Condition
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-300">
                                        {activeBlock.stop_condition}
                                    </p>
                                </>
                            ) : lastSession?.resume_token && !isRunning ? (
                                <>
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                        Last Action
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-300">
                                        {lastSession.resume_token}
                                    </p>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" asChild>
                        <Link href="/blocks">Blocks</Link>
                    </Button>
                    <span className="text-zinc-700">•</span>
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" asChild>
                        <Link href="/stats">Stats</Link>
                    </Button>
                </div>

                {/* Debug: Show block ID */}
                <p className="mt-4 text-[10px] text-zinc-600 font-mono">
                    Block ID: {activeBlock?.id || 'none'}
                </p>
            </div>

            {/* Undo Stop Toast */}
            {pendingStop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-900 px-6 py-5 shadow-2xl ring-1 ring-zinc-700/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-lg font-semibold text-white">Session Stopped</span>
                            <span className="mt-1 text-sm text-zinc-400">
                                Saving in {undoCountdown} seconds...
                            </span>
                        </div>
                        <div className="mt-2 flex w-full gap-3">
                            <Button
                                onClick={handleUndoStop}
                                size="lg"
                                className="h-12 flex-1 bg-emerald-600 text-base font-semibold hover:bg-emerald-500"
                            >
                                Undo
                            </Button>
                            <Button
                                onClick={handleConfirmStop}
                                size="lg"
                                variant="destructive"
                                className="h-12 flex-1 text-base font-semibold"
                            >
                                Confirm Stop
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
