'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Block } from '@/types'
import { Pencil, Plus, Minus, Check, X, ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react'
import { formatTime, getBlockTypeEmoji, getBlockTypeColor } from './utils'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { playBellSound } from '@/lib/sounds'

interface ExecutionPanelProps {
    isCompact: boolean
    activeBlock: Block
    isRunning: boolean
    elapsedSeconds: number
    pendingStop: boolean
    undoCountdown: number
    isEditingTitle: boolean
    editedTitle: string
    stopCondition?: string | null
    resumeToken?: string | null
    blocks?: Array<{
        id: string
        title: string
        type: string | null
        planned_start: string
        planned_end: string
        [key: string]: unknown
    }>
    // Handlers
    onStart: () => void
    onStop: () => void
    onDone: () => void
    onUndoStop: () => void
    onConfirmStop: () => void
    onUpdateTitle: () => void
    onAdjustDuration: (minutes: number) => void
    onEditTitleChange: (value: string) => void
    onStartEditing: () => void
    onCancelEditing: () => void
}

export function ExecutionPanel({
    isCompact,
    activeBlock,
    isRunning,
    elapsedSeconds,
    pendingStop,
    undoCountdown,
    isEditingTitle,
    editedTitle,
    stopCondition,
    resumeToken,
    blocks = [],
    onStart,
    onStop,
    onDone,
    onUndoStop,
    onConfirmStop,
    onUpdateTitle,
    onAdjustDuration,
    onEditTitleChange,
    onStartEditing,
    onCancelEditing,
}: ExecutionPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const bellPlayedRef = useRef(false)
    const {
        timerExceededSound,
        timerExceededFlash,
        blockCollisionWarning,
        blockCollisionMinutes,
        volume,
    } = useNotificationStore()

    // Timer Visuals
    const radius = 120
    const circumference = 2 * Math.PI * radius
    const totalDuration = (new Date(activeBlock.planned_end).getTime() - new Date(activeBlock.planned_start).getTime()) / 1000
    const isOvertime = elapsedSeconds > totalDuration && isRunning
    const progress = Math.min(Math.max(elapsedSeconds / totalDuration, 0), 1)
    const strokeDashoffset = circumference - progress * circumference
    const durationMinutes = Math.round((new Date(activeBlock.planned_end).getTime() - new Date(activeBlock.planned_start).getTime()) / 60000)
    const overtimeSeconds = isOvertime ? Math.floor(elapsedSeconds - totalDuration) : 0

    const upcomingBlocks = blocks
        .filter(b => new Date(b.planned_start) > new Date() && b.id !== activeBlock.id)
        .sort((a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime())
        .slice(0, 3)

    // Next block collision detection
    const nextBlock = upcomingBlocks[0]
    const minutesToNextBlock = nextBlock
        ? (new Date(nextBlock.planned_start).getTime() - Date.now()) / 60000
        : Infinity
    const isCollisionWarning = blockCollisionWarning && minutesToNextBlock <= blockCollisionMinutes && minutesToNextBlock > 0

    // Play bell sound once when timer exceeds duration
    useEffect(() => {
        if (isOvertime && timerExceededSound && !bellPlayedRef.current) {
            bellPlayedRef.current = true
            playBellSound(volume)
        }
        // Reset when block changes or timer resets
        if (!isRunning || elapsedSeconds === 0) {
            bellPlayedRef.current = false
        }
    }, [isOvertime, timerExceededSound, volume, isRunning, elapsedSeconds])

    return (
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
                                        onChange={(e) => onEditTitleChange(e.target.value)}
                                        className="h-8 text-base font-semibold bg-zinc-800 border-zinc-700"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') onUpdateTitle()
                                            if (e.key === 'Escape') onCancelEditing()
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 hover:bg-emerald-500/20 hover:text-emerald-400"
                                        onClick={onUpdateTitle}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                                        onClick={onCancelEditing}
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
                                            onClick={onStartEditing}
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
                                    {durationMinutes} min
                                    {activeBlock.is_quick_add && (
                                        <div className="ml-2 flex items-center gap-1">
                                            <button
                                                onClick={() => onAdjustDuration(-5)}
                                                className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                                                title="-5 min"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => onAdjustDuration(5)}
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

            {/* Block Collision Warning */}
            {isCollisionWarning && nextBlock && (
                <div className="mb-3 w-full flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-amber-300">
                            Next block in {Math.ceil(minutesToNextBlock)} min
                        </p>
                        <p className="truncate text-[10px] text-amber-400/70">
                            {nextBlock.title}
                        </p>
                    </div>
                </div>
            )}

            {/* Timer Circle */}
            <div className={cn("relative mb-8", isCompact && "mb-4")}>
                <svg
                    className={cn(
                        isCompact ? "h-48 w-48" : "h-64 w-64",
                        "-rotate-90",
                        isOvertime && timerExceededFlash && "animate-pulse"
                    )}
                    viewBox="0 0 256 256"
                >
                    <circle cx="128" cy="128" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-800" />
                    <circle
                        cx="128" cy="128" r={radius}
                        fill="none" stroke="currentColor" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={isOvertime ? 0 : strokeDashoffset}
                        className={cn(
                            "transition-all duration-300",
                            isOvertime ? "text-red-500" : isRunning ? "text-emerald-500" : "text-zinc-600"
                        )}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                        "font-mono font-bold tracking-tight",
                        isCompact ? "text-3xl" : "text-5xl",
                        isOvertime ? "text-red-400" : "text-white"
                    )}>
                        {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(elapsedSeconds)}
                    </span>
                    {isRunning && (
                        <span className={cn("mt-1 text-[10px]", isOvertime ? "text-red-400/60" : "text-zinc-500")}>
                            {isOvertime ? 'overtime' : `of ${durationMinutes}:00`}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-2">
                {!isRunning && !pendingStop ? (
                    <Button onClick={onStart} size="lg" className="h-12 flex-1 bg-emerald-600 text-base font-semibold hover:bg-emerald-500">START</Button>
                ) : pendingStop ? (
                    <Button size="lg" variant="outline" disabled className="h-12 flex-1 text-base font-semibold opacity-50">Stopping...</Button>
                ) : (
                    <>
                        <Button onClick={onDone} size="lg" variant="secondary" className="h-12 flex-1 text-base font-semibold">DONE</Button>
                        <Button onClick={onStop} size="lg" variant="destructive" className="h-12 flex-1 text-base font-semibold">STOP</Button>
                    </>
                )}
            </div>

            {/* Collapsible Details */}
            <div className="mt-6 w-full space-y-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-800/50 transition-colors"
                >
                    <span>Future Blocks</span>
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                {isExpanded && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Info Card (Stop Condition or Last Action) */}
                        {(stopCondition || (resumeToken && !isRunning)) && (
                            <Card className="w-full border-zinc-800 bg-zinc-900/50">
                                <CardContent className="p-3">
                                    {stopCondition ? (
                                        <>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                                Stop Condition
                                            </p>
                                            <p className="mt-0.5 text-xs text-zinc-300">
                                                {stopCondition}
                                            </p>
                                        </>
                                    ) : resumeToken && !isRunning ? (
                                        <>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                                Last Action
                                            </p>
                                            <p className="mt-0.5 text-xs text-zinc-300">
                                                {resumeToken}
                                            </p>
                                        </>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Links */}
                        {(activeBlock.linear_issue_id || activeBlock.task_link) && (
                            <div className="flex flex-wrap gap-2 px-1">
                                {activeBlock.linear_issue_id && (
                                    <a
                                        href={`https://linear.app/issue/${activeBlock.linear_issue_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-400 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20"
                                    >
                                        📐 {activeBlock.linear_issue_id}
                                        <ExternalLink className="h-2 w-2" />
                                    </a>
                                )}
                                {activeBlock.task_link && (
                                    <a
                                        href={activeBlock.task_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-[10px] font-medium text-purple-400 ring-1 ring-purple-500/20 hover:bg-purple-500/20"
                                    >
                                        🔗 Link
                                        <ExternalLink className="h-2 w-2" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Next Up */}
                        {upcomingBlocks.length > 0 && (
                            <div className="space-y-1.5 px-1">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                                    Next Up
                                </p>
                                {upcomingBlocks.map(block => (
                                    <div key={block.id} className="flex items-center gap-2 rounded-md bg-zinc-900/50 p-2 border border-zinc-800/50">
                                        <span className="text-xs">{getBlockTypeEmoji(block.type || 'focus')}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-medium text-zinc-300">{block.title}</p>
                                            <p className="text-[9px] text-zinc-500">
                                                {new Date(block.planned_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Undo Stop Toast */}
            {pendingStop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-900 px-6 py-5 shadow-2xl ring-1 ring-zinc-700/50">
                        <span className="text-lg font-semibold text-white">Session Stopped</span>
                        <span className="text-sm text-zinc-400">Saving in {undoCountdown}s...</span>
                        <div className="mt-2 flex gap-3">
                            <Button onClick={onUndoStop} className="bg-emerald-600">Undo</Button>
                            <Button onClick={onConfirmStop} variant="destructive">Confirm</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
