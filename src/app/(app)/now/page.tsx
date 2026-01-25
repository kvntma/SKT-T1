'use client'

import { useCurrentBlock } from '@/lib/hooks/useCurrentBlock'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    const { data: currentBlock, isLoading } = useCurrentBlock()
    const { isRunning, elapsedSeconds, startTimer, stopTimer, tick, setCurrentBlock } = useExecutionStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (currentBlock) {
            setCurrentBlock(currentBlock)
        }
    }, [currentBlock, setCurrentBlock])

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

    if (!currentBlock) {
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
                        <a href="/blocks">Manage Blocks</a>
                    </Button>
                </div>
            </div>
        )
    }

    const blockDurationMinutes = Math.round(
        (new Date(currentBlock.planned_end).getTime() - new Date(currentBlock.planned_start).getTime()) / 60000
    )

    const handleStart = () => {
        startTimer()
    }

    const handleDone = () => {
        stopTimer()
        window.location.href = '/save?outcome=done'
    }

    const handleStop = () => {
        stopTimer()
        window.location.href = '/save?outcome=aborted'
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
                                {getBlockTypeEmoji(currentBlock.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-lg font-semibold text-white">
                                    {currentBlock.title}
                                </h2>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs font-medium", getBlockTypeColor(currentBlock.type))}
                                    >
                                        {currentBlock.type.charAt(0).toUpperCase() + currentBlock.type.slice(1)}
                                    </Badge>
                                    <span className="text-sm text-zinc-500">
                                        {blockDurationMinutes} min
                                    </span>
                                </div>
                            </div>
                        </div>
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
                    {!isRunning ? (
                        <Button
                            onClick={handleStart}
                            size="lg"
                            className="h-14 flex-1 bg-emerald-600 text-lg font-semibold hover:bg-emerald-500"
                        >
                            START
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

                {/* Stop Condition */}
                {currentBlock.stop_condition && (
                    <Card className="mt-6 w-full border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Stop Condition
                            </p>
                            <p className="mt-1 text-sm text-zinc-300">
                                {currentBlock.stop_condition}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" asChild>
                        <a href="/blocks">Blocks</a>
                    </Button>
                    <span className="text-zinc-700">•</span>
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" asChild>
                        <a href="/stats">Stats</a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
