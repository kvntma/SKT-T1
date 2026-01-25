'use client'

import { useCurrentBlock } from '@/lib/hooks/useCurrentBlock'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { useEffect } from 'react'

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function NowPage() {
    const { data: currentBlock, isLoading } = useCurrentBlock()
    const { isRunning, elapsedSeconds, startTimer, stopTimer, tick, reset, setCurrentBlock } = useExecutionStore()

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

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse text-zinc-500">Loading...</div>
            </div>
        )
    }

    if (!currentBlock) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-2xl font-bold text-white mb-2">No Active Block</h1>
                <p className="text-zinc-400 max-w-sm">
                    You don&apos;t have a scheduled block right now. Create one or wait for your next block.
                </p>
                <a
                    href="/blocks"
                    className="mt-6 rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                >
                    Manage Blocks
                </a>
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

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            {/* Block Card */}
            <div className="mb-8 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <h2 className="text-xl font-semibold text-white">{currentBlock.title}</h2>
                        <p className="mt-1 text-sm text-zinc-400">
                            {currentBlock.type.charAt(0).toUpperCase() + currentBlock.type.slice(1)} Block • {blockDurationMinutes} min
                        </p>
                    </div>
                </div>
            </div>

            {/* Timer Display */}
            <div className="mb-12 flex h-48 w-48 items-center justify-center rounded-full border-4 border-zinc-700 bg-zinc-900">
                <span className="font-mono text-5xl font-bold text-white">
                    {formatTime(elapsedSeconds)}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        className="rounded-lg bg-emerald-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                        START
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleDone}
                            className="rounded-lg bg-zinc-700 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-600"
                        >
                            DONE
                        </button>
                        <button
                            onClick={handleStop}
                            className="rounded-lg bg-red-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-red-500"
                        >
                            STOP
                        </button>
                    </>
                )}
            </div>

            {/* Stop Condition */}
            {currentBlock.stop_condition && (
                <p className="mt-8 text-sm text-zinc-500">
                    Stop condition: &quot;{currentBlock.stop_condition}&quot;
                </p>
            )}
        </div>
    )
}
