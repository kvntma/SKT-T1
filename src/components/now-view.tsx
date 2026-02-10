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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Block } from '@/types'
import { Pencil, Plus, Minus, Check, X } from 'lucide-react'

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
    const { blocks, isLoading: blocksLoading, createBlock, updateBlock } = useBlocks('3day')
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

    // Quick Add Edit State
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')

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

    // Handlers for Quickstart
    const handleQuickStart = async (type: 'focus' | 'admin' | 'recovery', minutes: number) => {
        const now = new Date()
        const end = new Date(now.getTime() + minutes * 60000)

        try {
            const newBlock = await createBlock.mutateAsync({
                title: `Quick ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                type,
                planned_start: now.toISOString(),
                planned_end: end.toISOString(),
                is_quick_add: true,
            })

            setOverrideBlock(newBlock as unknown as Block)

            // Start session immediately
            const session = await startSession.mutateAsync({
                blockId: newBlock.id,
                timeToStart: 0,
            })
            startTimer(session.id)
        } catch (error) {
            console.error('Failed to quickstart:', error)
        }
    }

    const handleStartEarly = async (block: Block) => {
        try {
            // Update the block to start now
            const now = new Date()
            const currentDuration = new Date(block.planned_end).getTime() - new Date(block.planned_start).getTime()
            const newEnd = new Date(now.getTime() + currentDuration)

            const updatedBlock = await updateBlock.mutateAsync({
                id: block.id,
                updates: {
                    planned_start: now.toISOString(),
                    planned_end: newEnd.toISOString()
                }
            })

            setOverrideBlock(updatedBlock as unknown as Block)

            const session = await startSession.mutateAsync({
                blockId: updatedBlock.id,
                timeToStart: 0,
            })
            startTimer(session.id)
        } catch (error) {
            console.error('Failed to start early:', error)
        }
    }

    const handleUpdateTitle = async () => {
        if (!activeBlock || !editedTitle.trim()) return

        try {
            const updatedBlock = await updateBlock.mutateAsync({
                id: activeBlock.id,
                updates: { title: editedTitle }
            })
            setOverrideBlock(updatedBlock as unknown as Block)
            setIsEditingTitle(false)
        } catch (error) {
            console.error('Failed to updating title:', error)
        }
    }

    const handleAdjustDuration = async (minutes: number) => {
        if (!activeBlock) return

        const currentEnd = new Date(activeBlock.planned_end)
        const newEnd = new Date(currentEnd.getTime() + minutes * 60000)
        const now = new Date()

        // Validation: End time cannot be in the past
        if (newEnd <= now) return

        // Validation: Cannot overlap with next block (if expanding)
        if (minutes > 0) {
            const nextBlock = blocks.find(b =>
                new Date(b.planned_start) > new Date(activeBlock.planned_start) &&
                b.id !== activeBlock.id
            )

            if (nextBlock && newEnd > new Date(nextBlock.planned_start)) {
                // Clap to next block start?
                // For now, just return
                return
            }
        }

        try {
            const updatedBlock = await updateBlock.mutateAsync({
                id: activeBlock.id,
                updates: { planned_end: newEnd.toISOString() }
            })
            setOverrideBlock(updatedBlock as unknown as Block)
        } catch (error) {
            console.error('Failed to adjust duration:', error)
        }
    }

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
        // Find upcoming blocks
        const now = new Date()
        const upcomingBlocks = blocks
            .filter(b => new Date(b.planned_start) > now)
            .sort((a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime())
            .slice(0, 5)

        const nextBlock = upcomingBlocks[0]
        const isEarlyStartAvailable = nextBlock &&
            (new Date(nextBlock.planned_start).getTime() - now.getTime() < 60 * 60 * 1000) // Within 60 mins

        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
                <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Status Indicator */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-3xl shadow-xl ring-1 ring-zinc-800">
                            ⏸️
                        </div>
                        <h2 className="text-lg font-medium text-zinc-400">No Active Block</h2>
                    </div>

                    <h1 className="mb-6 text-2xl font-bold text-white">What are you doing?</h1>

                    {/* Quick Buckets */}
                    <div className="grid w-full grid-cols-3 gap-3 mb-8">
                        <button
                            onClick={() => handleQuickStart('focus', 25)}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 transition-all hover:bg-emerald-500/20 active:scale-95"
                        >
                            <span className="text-2xl">🎯</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-emerald-400">Focus</span>
                                <span className="text-[10px] text-emerald-500/70">25m</span>
                            </div>
                        </button>
                        <button
                            onClick={() => handleQuickStart('admin', 15)}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 transition-all hover:bg-blue-500/20 active:scale-95"
                        >
                            <span className="text-2xl">📋</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-400">Admin</span>
                                <span className="text-[10px] text-blue-500/70">15m</span>
                            </div>
                        </button>
                        <button
                            onClick={() => handleQuickStart('recovery', 5)}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 transition-all hover:bg-purple-500/20 active:scale-95"
                        >
                            <span className="text-2xl">🧘</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-purple-400">Rest</span>
                                <span className="text-[10px] text-purple-500/70">5m</span>
                            </div>
                        </button>
                    </div>

                    {/* Early Start / Upcoming */}
                    {upcomingBlocks.length > 0 && (
                        <div className="w-full space-y-3 text-left">
                            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                                {isEarlyStartAvailable ? 'Up Next' : 'Upcoming'}
                            </h2>

                            {isEarlyStartAvailable ? (
                                // Hero Card for Next Block
                                <Card className="w-full border-zinc-700 bg-zinc-800/50 backdrop-blur-xl transition-all hover:border-zinc-600">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-700/50 text-2xl">
                                                {getBlockTypeEmoji(nextBlock.type || 'focus')}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-lg font-semibold text-white">
                                                    {nextBlock.title}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge variant="outline" className={cn("text-[10px] py-0", getBlockTypeColor(nextBlock.type || 'focus'))}>
                                                        {nextBlock.type}
                                                    </Badge>
                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(nextBlock.planned_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleStartEarly(nextBlock as unknown as Block)}
                                                size="sm"
                                                className="shrink-0 bg-white text-zinc-900 hover:bg-zinc-200"
                                            >
                                                Start Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                // Simple List for future blocks
                                <div className="space-y-2">
                                    {upcomingBlocks.map(block => (
                                        <div
                                            key={block.id}
                                            onClick={() => handleStartEarly(block as unknown as Block)}
                                            className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                                        >
                                            <span className="text-lg">{getBlockTypeEmoji(block.type || 'focus')}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium text-zinc-300 group-hover:text-white">
                                                    {block.title}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {new Date(block.planned_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400">
                                                Start
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
        <div className={cn("relative flex flex-col items-center justify-center px-4", isCompact ? "py-4" : "flex-1")}>
            <div className={cn("relative z-10 flex w-full flex-col items-center", isCompact ? "" : "max-w-sm")}>
                {/* Block Card */}
                <Card className={cn("mb-6 w-full border-zinc-800 bg-zinc-900/80 backdrop-blur-xl", isCompact && "mb-4")}>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xl">
                                {getBlockTypeEmoji(activeBlock.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            className="h-8 text-base font-semibold bg-zinc-800 border-zinc-700"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateTitle()
                                                if (e.key === 'Escape') setIsEditingTitle(false)
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:bg-emerald-500/20 hover:text-emerald-400"
                                            onClick={handleUpdateTitle}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                                            onClick={() => setIsEditingTitle(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/title">
                                        <h2 className="truncate text-base font-semibold text-white">
                                            {activeBlock.title}
                                        </h2>
                                        {activeBlock.is_quick_add && (
                                            <button
                                                onClick={() => {
                                                    setEditedTitle(activeBlock.title)
                                                    setIsEditingTitle(true)
                                                }}
                                                className="opacity-0 group-hover/title:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-[10px] py-0", getBlockTypeColor(activeBlock.type))}
                                    >
                                        {activeBlock.type}
                                    </Badge>
                                    {activeBlock.is_quick_add && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] py-0 border-amber-500/20 bg-amber-500/10 text-amber-400"
                                        >
                                            Quick
                                        </Badge>
                                    )}
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        {blockDurationMinutes} min
                                        {activeBlock.is_quick_add && (
                                            <div className="ml-2 flex items-center gap-1">
                                                <button
                                                    onClick={() => handleAdjustDuration(-5)}
                                                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                                                    title="-5 min"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleAdjustDuration(5)}
                                                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                                                    title="+5 min"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
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
