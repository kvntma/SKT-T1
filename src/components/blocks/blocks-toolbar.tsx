'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Wand2 } from 'lucide-react'

type ViewMode = 'day' | '3day' | 'week'
type DisplayMode = 'list' | 'calendar'

interface BlocksToolbarProps {
    // Date nav
    formattedDate: string
    viewMode: ViewMode
    onPrev: () => void
    onNext: () => void
    onToday: () => void
    onViewModeChange: (mode: ViewMode) => void

    // Display mode
    displayMode: DisplayMode
    onDisplayModeChange: (mode: DisplayMode) => void
    blockCount: number

    // PTS Filter
    ptsOnly: boolean
    onPtsOnlyChange: (ptsOnly: boolean) => void

    // Actions
    onRefactor: () => void
    isRefactoring: boolean
    hasBlocks: boolean
    onNewBlock: () => void
    showCreate: boolean
}

export function BlocksToolbar({
    formattedDate,
    viewMode,
    onPrev,
    onNext,
    onToday,
    onViewModeChange,
    displayMode,
    onDisplayModeChange,
    blockCount,
    ptsOnly,
    onPtsOnlyChange,
    onRefactor,
    isRefactoring,
    hasBlocks,
    onNewBlock,
    showCreate,
}: BlocksToolbarProps) {
    return (
        <>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Blocks</h1>
                    <p className="mt-1 text-sm text-zinc-500">Manage your time blocks</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onRefactor}
                        disabled={isRefactoring || !hasBlocks}
                        className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    >
                        {isRefactoring ? (
                            <span className="animate-pulse">Analyzing...</span>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" /> Refactor
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onNewBlock}
                        className="bg-white text-black hover:bg-zinc-200"
                    >
                        {showCreate ? 'Cancel' : '+ New Block'}
                    </Button>
                </div>
            </div>

            {/* Date Nav + View Mode */}
            <div className="mb-6 flex items-center justify-between bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8 text-zinc-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onToday} className="h-8 text-xs text-zinc-400 hover:text-white">
                        Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8 text-zinc-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Button>
                </div>
                <span className="text-sm font-semibold text-white">{formattedDate}</span>
                <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                    {(['day', '3day', 'week'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={cn(
                                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                                viewMode === mode ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            {mode === '3day' ? '3-Day' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Display mode toggle + count */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {blockCount > 0 && (
                        <p className="text-xs text-zinc-600">
                            {blockCount} block{blockCount !== 1 ? 's' : ''} scheduled
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Blocks Only
                        </span>
                        <button
                            onClick={() => onPtsOnlyChange(!ptsOnly)}
                            className={cn(
                                'relative h-4 w-7 rounded-full transition-colors focus:outline-none',
                                ptsOnly ? 'bg-emerald-500' : 'bg-zinc-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
                                    ptsOnly ? 'translate-x-3' : 'translate-x-0'
                                )}
                            />
                        </button>
                    </div>

                    <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                        <button
                            onClick={() => onDisplayModeChange('list')}
                            className={cn(
                                'p-2 rounded-md transition-colors',
                                displayMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDisplayModeChange('calendar')}
                            className={cn(
                                'p-2 rounded-md transition-colors',
                                displayMode === 'calendar' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
                                <path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
