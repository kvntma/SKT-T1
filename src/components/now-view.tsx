'use client'

import { useTasks, type ObsidianTask } from '@/lib/hooks/useTasks'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { IdleView } from './now/idle-view'
import { ExecutionPanel } from './now/execution-panel'

export function NowView({ isCompact = false }: { isCompact?: boolean }) {
    const { data: tasks, isLoading: tasksLoading, completeTask } = useTasks()
    const { isRunning, elapsedSeconds, currentSessionId, startTimer, stopTimer, resumeTimer, tick, setCurrentBlock, reset } = useExecutionStore()
    const [mounted, setMounted] = useState(false)
    const [activeTask, setActiveTask] = useState<ObsidianTask | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    const handleStartTask = (task: ObsidianTask) => {
        setActiveTask(task)
        // Mock a block for the execution store
        const mockBlock = {
            id: task.id,
            title: task.text,
            type: 'focus' as const,
            planned_start: new Date().toISOString(),
            planned_end: new Date(Date.now() + 25 * 60000).toISOString(),
            user_id: 'local',
            created_at: new Date().toISOString(),
            goal_id: null,
            calendar_id: null,
            task_link: null,
            stop_condition: null,
            linear_issue_id: null
        }
        setCurrentBlock(mockBlock)
        startTimer('local-session-' + Date.now())
    }

    const handleQuickStart = (type: 'focus' | 'admin' | 'recovery', minutes: number) => {
        const mockTask: ObsidianTask = {
            id: 'quick-' + Date.now(),
            text: `Quick ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            completed: false,
            lineIndex: -1
        }
        handleStartTask(mockTask)
    }

    const handleDone = async () => {
        if (activeTask && activeTask.lineIndex !== -1) {
            await completeTask.mutateAsync({
                lineIndex: activeTask.lineIndex,
                completed: true
            })
        }
        stopTimer()
        reset()
        setActiveTask(null)
    }

    const handleStop = () => {
        stopTimer()
        reset()
        setActiveTask(null)
    }

    if (!mounted || tasksLoading) {
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
            {!isRunning ? (
                <IdleView
                    isCompact={isCompact}
                    tasks={tasks || []}
                    onStartTask={handleStartTask}
                    onQuickStart={handleQuickStart}
                />
            ) : (
                <ExecutionPanel
                    isCompact={isCompact}
                    activeBlock={{
                        id: activeTask?.id || 'unknown',
                        title: activeTask?.text || 'Task',
                        type: 'focus',
                        planned_start: new Date().toISOString(),
                        planned_end: new Date(Date.now() + 25 * 60000).toISOString()
                    } as any}
                    isRunning={isRunning}
                    elapsedSeconds={elapsedSeconds}
                    onStart={() => {}} // Already started
                    onStop={handleStop}
                    onDone={handleDone}
                    onUndoStop={() => {}} // Simplified for now
                    onConfirmStop={handleStop}
                    onUpdateTitle={() => {}}
                    onAdjustDuration={() => {}}
                    onEditTitleChange={() => {}}
                    onStartEditing={() => {}}
                    onCancelEditing={() => {}}
                />
            )}
        </div>
    )
}
