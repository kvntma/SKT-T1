'use client'

import { useCurrentBlock } from '@/lib/hooks/useCurrentBlock'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { useSession } from '@/lib/hooks/useSession'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Block } from '@/types'
import { IdleView } from './now/idle-view'
import { ExecutionPanel } from './now/execution-panel'

export function NowView({ isCompact = false }: { isCompact?: boolean }) {
    const { data: currentBlock, isLoading: currentBlockLoading } = useCurrentBlock()
    const { blocks, isLoading: blocksLoading, createBlock, updateBlock } = useBlocks('3day')
    const { isRunning, elapsedSeconds, currentSessionId, startTimer, stopTimer, resumeTimer, tick, setCurrentBlock, restoreSession, reset } = useExecutionStore()
    const { startSession, abandonSession, resumeSession, lastSession } = useSession()
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

    // Details Modal State
    const [selectedUpcomingBlock, setSelectedUpcomingBlock] = useState<Block | null>(null)
    const [showStartConfirmation, setShowStartConfirmation] = useState(false)

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

    // ─── Handlers ───────────────────────────────────────────────

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
        const now = new Date()
        const diffMs = new Date(block.planned_start).getTime() - now.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins > 60) {
            setSelectedUpcomingBlock(block)
            setShowStartConfirmation(true)
            return
        }

        await executeStartEarly(block)
    }

    const executeStartEarly = async (block: Block) => {
        try {
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
            setSelectedUpcomingBlock(null)
            setShowStartConfirmation(false)

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
            console.error('Failed to update title:', error)
        }
    }

    const handleAdjustDuration = async (minutes: number) => {
        if (!activeBlock) return

        const currentEnd = new Date(activeBlock.planned_end)
        const newEnd = new Date(currentEnd.getTime() + minutes * 60000)
        const now = new Date()

        if (newEnd <= now) return

        if (minutes > 0) {
            const nextBlock = blocks.find(b =>
                new Date(b.planned_start) > new Date(activeBlock.planned_start) &&
                b.id !== activeBlock.id
            )

            if (nextBlock && newEnd > new Date(nextBlock.planned_start)) {
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

    const handleStart = async () => {
        if (!activeBlock) return
        try {
            const session = await startSession.mutateAsync({
                blockId: activeBlock.id,
                timeToStart: 0
            })
            startTimer(session.id)
        } catch (error) {
            console.error('Failed to start session:', error)
        }
    }

    const handleStop = () => {
        setPendingStop(true)
        setUndoCountdown(5)

        if (currentSessionId) {
            stopTimer()
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
        setPendingStop(false)
        if (currentSessionId) {
            resumeTimer()
            resumeSession.mutate({ sessionId: currentSessionId })
        }
    }

    const handleConfirmStop = () => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
        }
        reset()
        if (currentSessionId) {
            window.location.href = `/save?outcome=aborted&sessionId=${currentSessionId}`
        } else {
            window.location.href = '/save?outcome=aborted'
        }
    }

    const handleDone = async () => {
        if (!currentSessionId) return
        stopTimer()
        window.location.href = `/save?outcome=done&sessionId=${currentSessionId}`
    }

    // ─── Render ─────────────────────────────────────────────────

    if (!mounted || isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative flex flex-col items-center px-4",
            isCompact ? "py-4" : "flex-1 justify-center"
        )}>
            {!activeBlock ? (
                <IdleView
                    isCompact={isCompact}
                    blocks={blocks}
                    selectedUpcomingBlock={selectedUpcomingBlock}
                    showStartConfirmation={showStartConfirmation}
                    onQuickStart={handleQuickStart}
                    onStartEarly={handleStartEarly}
                    onExecuteStartEarly={executeStartEarly}
                    onSelectBlock={setSelectedUpcomingBlock}
                    onCancelConfirmation={() => setShowStartConfirmation(false)}
                />
            ) : (
                <ExecutionPanel
                    isCompact={isCompact}
                    activeBlock={activeBlock}
                    isRunning={isRunning}
                    elapsedSeconds={elapsedSeconds}
                    pendingStop={pendingStop}
                    undoCountdown={undoCountdown}
                    isEditingTitle={isEditingTitle}
                    editedTitle={editedTitle}
                    stopCondition={activeBlock.stop_condition}
                    resumeToken={lastSession?.resume_token}
                    onStart={handleStart}
                    onStop={handleStop}
                    onDone={handleDone}
                    onUndoStop={handleUndoStop}
                    onConfirmStop={handleConfirmStop}
                    onUpdateTitle={handleUpdateTitle}
                    onAdjustDuration={handleAdjustDuration}
                    onEditTitleChange={setEditedTitle}
                    onStartEditing={() => {
                        if (activeBlock) {
                            setEditedTitle(activeBlock.title)
                            setIsEditingTitle(true)
                        }
                    }}
                    onCancelEditing={() => setIsEditingTitle(false)}
                />
            )}
        </div>
    )
}
