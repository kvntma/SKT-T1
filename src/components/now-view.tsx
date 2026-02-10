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

export function NowView({ isCompact = false }: { isCompact?: boolean }) {
    const { data: currentBlock, isLoading: currentBlockLoading } = useCurrentBlock()
    const { blocks, isLoading: blocksLoading } = useBlocks()
    const { isRunning, elapsedSeconds, currentSessionId, startTimer, stopTimer, resumeTimer, tick, setCurrentBlock, restoreSession, reset } = useExecutionStore()
    const { startSession, abandonSession, resumeSession, endSession, lastSession } = useSession()
    const [mounted, setMounted] = useState(false)
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

                // Safety: Only restore sessions started in the last 24 hours
                const yesterday = new Date()
                yesterday.setHours(yesterday.getHours() - 24)

                // Look for most recent session with no outcome
                const { data: sessionData, error: sessionError } = await supabase
                    .from('sessions')
                    .select(`
                        *,
                        blocks (*)
                    `)
                    .eq('user_id', user.id)
                    .is('outcome', null)
                    .gt('actual_start', yesterday.toISOString())
                    .order('actual_start', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (sessionData && !sessionError && sessionData.actual_start) {
                    const block = sessionData.blocks as unknown as Block
                    const startTime = new Date(sessionData.actual_start)
                    const now = new Date()
                    const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000))

                    restoreSession(block, startTime, elapsed, sessionData.id)
                    setOverrideBlock(block)
                } else if (isRunning) {
                    reset()
                }
            } catch (err) {
                console.error('Error detecting active session:', err)
            } finally {
                setIsRestoring(false)
            }
        }

        detectActiveSession()
    }, [mounted, restoreSession, isRunning, reset])

    // Check for startBlockId in sessionStorage on mount
    useEffect(() => {
        if (!mounted || !isRestoring) return 

        if (currentSessionId) {
            sessionStorage.removeItem('startBlockId')
            return
        }

        const startBlockId = sessionStorage.getItem('startBlockId')
        if (startBlockId) {
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
    }, [mounted, isRestoring, currentSessionId])

    useEffect(() => {
        if (activeBlock) {
            setCurrentBlock(activeBlock)
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
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                </div>
            </div>
        )
    }

    if (!activeBlock) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-3xl shadow-xl ring-1 ring-zinc-800">
                        ⏸️
                    </div>
                    <h1 className="text-xl font-bold text-white">No Active Block</h1>
                    <p className="mt-2 max-w-xs text-sm text-zinc-400">
                        You don&apos;t have a scheduled block right now.
                    </p>
                </div>
            </div>
        )
    }

    const blockDurationMinutes = Math.round(
        (new Date(activeBlock.planned_end).getTime() - new Date(activeBlock.planned_start).getTime()) / 60000
    )

    const handleStart = async () => {
        if (!activeBlock) return
        const now = new Date()
        const blockStart = new Date(activeBlock.planned_start)
        const timeToStart = Math.max(0, Math.floor((now.getTime() - blockStart.getTime()) / 1000))

        try {
            const session = await startSession.mutateAsync({
                blockId: activeBlock.id,
                timeToStart,
            })
            startTimer(session.id)
        } catch (error) {
            console.error('Failed to start session:', error)
        }
    }

    const handleDone = () => {
        const sessionId = currentSessionId
        reset() 
        if (sessionId) {
            window.location.href = `/save?outcome=done&sessionId=${sessionId}`
        } else {
            window.location.href = '/save?outcome=done'
        }
    }

    const handleStop = () => {
        stopTimer()
        setPendingStop(true)
        setUndoCountdown(5)

        if (currentSessionId) {
            abandonSession.mutate({ sessionId: currentSessionId })
        }

        countdownIntervalRef.current = setInterval(() => {
            setUndoCountdown(prev => Math.max(0, prev - 1))
        }, 1000)

        undoTimeoutRef.current = setTimeout(() => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
            const sessionId = currentSessionId
            reset()
            if (sessionId) {
                window.location.href = `/save?outcome=aborted&sessionId=${sessionId}`
            } else {
                window.location.href = '/save?outcome=aborted'
            }
        }, 5000)
    }

    const handleUndoStop = () => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
            undoTimeoutRef.current = null
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
        }
        if (currentSessionId) {
            resumeSession.mutate({ sessionId: currentSessionId })
        }
        setPendingStop(false)
        resumeTimer()
    }

    const handleConfirmStop = () => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        const sessionId = currentSessionId
        reset()
        if (sessionId) {
            window.location.href = `/save?outcome=aborted&sessionId=${sessionId}`
        } else {
            window.location.href = '/save?outcome=aborted'
        }
    }

    const totalSeconds = blockDurationMinutes * 60
    const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100)
    const radius = isCompact ? 80 : 120
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("relative flex flex-col items-center justify-center px-4", isCompact ? "py-4" : "min-h-screen")}>
            <div className={cn("relative z-10 flex w-full flex-col items-center", isCompact ? "" : "max-w-sm")}>
                {/* Block Card */}
                <Card className={cn("mb-6 w-full border-zinc-800 bg-zinc-900/80 backdrop-blur-xl", isCompact && "mb-4")}>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xl">
                                {getBlockTypeEmoji(activeBlock.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-base font-semibold text-white">
                                    {activeBlock.title}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-[10px] py-0", getBlockTypeColor(activeBlock.type))}
                                    >
                                        {activeBlock.type}
                                    </Badge>
                                    <span className="text-xs text-zinc-500">
                                        {blockDurationMinutes} min
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timer Circle */}
                <div className={cn("relative mb-8", isCompact && "mb-4")}>
                    <svg className={cn(isCompact ? "h-48 w-48" : "h-64 w-64", "-rotate-90")} viewBox="0 0 256 256">
                        <circle cx="128" cy="128" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-800" />
                        <circle cx="128" cy="128" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={cn("transition-all duration-300", isRunning ? "text-emerald-500" : "text-zinc-600")} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("font-mono font-bold tracking-tight text-white", isCompact ? "text-3xl" : "text-5xl")}>
                            {formatTime(elapsedSeconds)}
                        </span>
                        {isRunning && (
                            <span className="mt-1 text-[10px] text-zinc-500">
                                of {blockDurationMinutes}:00
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full gap-2">
                    {!isRunning && !pendingStop ? (
                        <Button onClick={handleStart} size="lg" className="h-12 flex-1 bg-emerald-600 text-base font-semibold hover:bg-emerald-500">START</Button>
                    ) : pendingStop ? (
                        <Button size="lg" variant="outline" disabled className="h-12 flex-1 text-base font-semibold opacity-50">Stopping...</Button>
                    ) : (
                        <>
                            <Button onClick={handleDone} size="lg" variant="secondary" className="h-12 flex-1 text-base font-semibold">DONE</Button>
                            <Button onClick={handleStop} size="lg" variant="destructive" className="h-12 flex-1 text-base font-semibold">STOP</Button>
                        </>
                    )}
                </div>

                {/* Info Card (Stop Condition or Last Action) */}
                {(activeBlock.stop_condition || (lastSession?.resume_token && !isRunning)) && (
                    <Card className={cn("mt-4 w-full border-zinc-800 bg-zinc-900/50", isCompact && "mt-3")}>
                        <CardContent className="p-3">
                            {activeBlock.stop_condition ? (
                                <>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                        Stop Condition
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-300">
                                        {activeBlock.stop_condition}
                                    </p>
                                </>
                            ) : lastSession?.resume_token && !isRunning ? (
                                <>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                        Last Action
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-300">
                                        {lastSession.resume_token}
                                    </p>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                )}

                {/* Undo Stop Toast (Overlaid for compact) */}
                {pendingStop && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-900 px-6 py-5 shadow-2xl ring-1 ring-zinc-700/50">
                            <span className="text-lg font-semibold text-white">Session Stopped</span>
                            <span className="text-sm text-zinc-400">Saving in {undoCountdown}s...</span>
                            <div className="mt-2 flex gap-3">
                                <Button onClick={handleUndoStop} className="bg-emerald-600">Undo</Button>
                                <Button onClick={handleConfirmStop} variant="destructive">Confirm</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
