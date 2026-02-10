'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Block } from '@/types'
import { BlockDetailModal } from './block-detail-modal'
import { getBlockTypeEmoji, getBlockTypeColor } from './utils'

interface IdleViewProps {
    isCompact: boolean
    blocks: Array<{
        id: string
        title: string
        type: string | null
        planned_start: string
        planned_end: string
        stop_condition?: string | null
        [key: string]: unknown
    }>
    selectedUpcomingBlock: Block | null
    showStartConfirmation: boolean
    onQuickStart: (type: 'focus' | 'admin' | 'recovery', minutes: number) => void
    onStartEarly: (block: Block) => void
    onExecuteStartEarly: (block: Block) => void
    onSelectBlock: (block: Block | null) => void
    onCancelConfirmation: () => void
}

export function IdleView({
    isCompact,
    blocks,
    selectedUpcomingBlock,
    showStartConfirmation,
    onQuickStart,
    onStartEarly,
    onExecuteStartEarly,
    onSelectBlock,
    onCancelConfirmation,
}: IdleViewProps) {
    const now = new Date()
    const upcomingBlocks = blocks
        .filter(b => new Date(b.planned_start) > now)
        .sort((a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime())
        .slice(0, 5)

    const nextBlock = upcomingBlocks[0]
    const isEarlyStartAvailable = nextBlock &&
        (new Date(nextBlock.planned_start).getTime() - now.getTime() < 60 * 60 * 1000)

    return (
        <>
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
                        ⏸️
                    </div>
                    <h2 className="text-sm font-medium text-zinc-400">No Active Block</h2>
                </div>

                <h1 className={cn("font-bold text-white", isCompact ? "text-lg mb-4" : "text-2xl mb-6")}>
                    What are you doing?
                </h1>

                {/* Quick Buckets */}
                <div className={cn("grid w-full gap-3", isCompact ? "grid-cols-1 mb-6" : "grid-cols-3 mb-8")}>
                    <button
                        onClick={() => onQuickStart('focus', 25)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 transition-all hover:bg-emerald-500/20 active:scale-95",
                            isCompact ? "p-3" : "flex-col p-4 justify-center"
                        )}
                    >
                        <span className="text-2xl">🎯</span>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-emerald-400">Focus</span>
                            <span className="text-[10px] text-emerald-500/70">25m</span>
                        </div>
                    </button>
                    <button
                        onClick={() => onQuickStart('admin', 15)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 transition-all hover:bg-blue-500/20 active:scale-95",
                            isCompact ? "p-3" : "flex-col p-4 justify-center"
                        )}
                    >
                        <span className="text-2xl">📋</span>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-blue-400">Admin</span>
                            <span className="text-[10px] text-blue-500/70">15m</span>
                        </div>
                    </button>
                    <button
                        onClick={() => onQuickStart('recovery', 5)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 transition-all hover:bg-purple-500/20 active:scale-95",
                            isCompact ? "p-3" : "flex-col p-4 justify-center"
                        )}
                    >
                        <span className="text-2xl">🧘</span>
                        <div className="flex flex-col text-left">
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
                            <Card
                                className="w-full border-zinc-700 bg-zinc-800/50 backdrop-blur-xl transition-all hover:border-zinc-600 cursor-pointer"
                                onClick={() => onSelectBlock(nextBlock as unknown as Block)}
                            >
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartEarly(nextBlock as unknown as Block);
                                            }}
                                            size="sm"
                                            className="shrink-0 bg-white text-zinc-900 hover:bg-zinc-200"
                                        >
                                            Start Now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {upcomingBlocks.map(block => (
                                    <div
                                        key={block.id}
                                        onClick={() => onSelectBlock(block as unknown as Block)}
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
                                            View
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Block Detail Modal */}
            {selectedUpcomingBlock && (
                <BlockDetailModal
                    block={selectedUpcomingBlock}
                    showStartConfirmation={showStartConfirmation}
                    onStartEarly={onStartEarly}
                    onExecuteStartEarly={onExecuteStartEarly}
                    onClose={() => onSelectBlock(null)}
                    onCancelConfirmation={onCancelConfirmation}
                />
            )}
        </>
    )
}
