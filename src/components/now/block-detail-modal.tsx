'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { Block } from '@/types'
import { getBlockTypeEmoji, getBlockTypeColor } from './utils'

interface BlockDetailModalProps {
    block: Block
    showStartConfirmation: boolean
    onStartEarly: (block: Block) => void
    onExecuteStartEarly: (block: Block) => void
    onClose: () => void
    onCancelConfirmation: () => void
}

export function BlockDetailModal({
    block,
    showStartConfirmation,
    onStartEarly,
    onExecuteStartEarly,
    onClose,
    onCancelConfirmation,
}: BlockDetailModalProps) {
    if (showStartConfirmation) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <Card className="w-full max-w-sm border-amber-500/20 bg-zinc-900 shadow-2xl animate-in fade-in zoom-in-95">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Start Early?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            This task is scheduled for {new Date(block.planned_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Are you sure you want to start it now?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
                                onClick={() => onExecuteStartEarly(block)}
                            >
                                YES, START
                            </Button>
                            <Button
                                variant="ghost"
                                className="flex-1 text-zinc-400 hover:text-white"
                                onClick={onCancelConfirmation}
                            >
                                CANCEL
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 shadow-2xl animate-in zoom-in-95 duration-200">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-3xl shadow-inner">
                                {getBlockTypeEmoji(block.type || 'focus')}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">
                                    {block.title}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-[10px]", getBlockTypeColor(block.type || 'focus'))}>
                                        {block.type}
                                    </Badge>
                                    <span className="text-xs text-zinc-500">
                                        Scheduled for {new Date(block.planned_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                                Duration
                            </h4>
                            <p className="text-sm text-zinc-300">
                                {Math.round((new Date(block.planned_end).getTime() - new Date(block.planned_start).getTime()) / 60000)} minutes
                            </p>
                        </div>

                        {block.stop_condition && (
                            <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                                    Stop Condition
                                </h4>
                                <p className="text-sm text-zinc-300 italic">
                                    &quot;{block.stop_condition}&quot;
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-white text-zinc-900 hover:bg-zinc-200 font-bold h-11"
                            onClick={() => onStartEarly(block)}
                        >
                            START EARLY
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800 font-bold h-11"
                            onClick={onClose}
                        >
                            CLOSE
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
