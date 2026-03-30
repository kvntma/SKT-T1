'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ObsidianTask } from '@/lib/hooks/useTasks'

interface IdleViewProps {
    isCompact: boolean
    tasks: ObsidianTask[]
    onStartTask: (task: ObsidianTask) => void
    onQuickStart: (type: 'focus' | 'admin' | 'recovery', minutes: number) => void
}

export function IdleView({
    isCompact,
    tasks,
    onStartTask,
    onQuickStart,
}: IdleViewProps) {
    const incompleteTasks = tasks.filter(t => !t.completed);

    return (
        <div className={cn(
            "relative z-10 w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500",
            isCompact ? "" : "flex-1 justify-center px-6 pb-20 text-center max-w-md"
        )}>
            {/* Status Indicator */}
            <div className={cn("flex flex-col items-center", isCompact ? "mb-4" : "mb-8")}>
                <div className={cn(
                    "flex items-center justify-center rounded-2xl bg-zinc-900 shadow-xl ring-1 ring-zinc-800",
                    isCompact ? "h-12 w-12 text-2xl mb-2" : "h-16 w-16 text-3xl mb-4"
                )}>
                    🎯
                </div>
                <h2 className="text-sm font-medium text-zinc-400">Ready to Execute</h2>
            </div>

            <h1 className={cn("font-bold text-white", isCompact ? "text-lg mb-4" : "text-2xl mb-6")}>
                Pick a task from your vault
            </h1>

            {/* Obsidian Tasks */}
            <div className="w-full space-y-3 text-left mb-8">
                {incompleteTasks.length > 0 ? (
                    incompleteTasks.map(task => (
                        <Card
                            key={task.id}
                            className="w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl transition-all hover:border-zinc-700 cursor-pointer group"
                            onClick={() => onStartTask(task)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                                        {task.text}
                                    </span>
                                </div>
                                <Button size="sm" variant="ghost" className="text-xs text-zinc-400 group-hover:text-white">
                                    Start
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-sm text-zinc-500">No pending tasks in today's note.</p>
                        <Button variant="link" className="text-blue-500" onClick={() => window.location.href='/review'}>
                            Plan your day
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Timers */}
            <div className="w-full">
                <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 text-left mb-3 ml-1">Quick Timers</h2>
                <div className={cn("grid w-full gap-3", isCompact ? "grid-cols-1" : "grid-cols-3")}>
                    <button
                        onClick={() => onQuickStart('focus', 25)}
                        className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 transition-all hover:bg-emerald-500/20"
                    >
                        <span className="text-xl">🎯</span>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-emerald-400">Focus</span>
                            <span className="text-[10px] text-emerald-500/70">25m</span>
                        </div>
                    </button>
                    <button
                        onClick={() => onQuickStart('admin', 15)}
                        className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 transition-all hover:bg-blue-500/20"
                    >
                        <span className="text-xl">📋</span>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-blue-400">Admin</span>
                            <span className="text-[10px] text-blue-500/70">15m</span>
                        </div>
                    </button>
                    <button
                        onClick={() => onQuickStart('recovery', 5)}
                        className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 transition-all hover:bg-purple-500/20"
                    >
                        <span className="text-xl">🧘</span>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-purple-400">Rest</span>
                            <span className="text-[10px] text-purple-500/70">5m</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
