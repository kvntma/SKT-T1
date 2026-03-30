'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type BlockType } from '@/lib/blocks/config'
import { type DisplayBlock, isSameDay } from '@/lib/blocks/utils'
import { PanelRightClose, PanelRightOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { useBreakpoint } from '@/lib/hooks/useBreakpoint'
import { NowView } from '@/components/now-view'
import { useUIStore } from '@/lib/stores/ui-store'
import { Badge } from '@/components/ui/badge'

// Extracted components
import { BlocksToolbar } from '@/components/blocks/blocks-toolbar'
import { BlockListItem } from '@/components/blocks/block-list-item'

type ViewMode = 'day' | '3day' | 'week'
type DisplayMode = 'list' | 'calendar'

export default function BlocksPage() {
    const router = useRouter()
    const { isDesktop } = useBreakpoint()
    const [viewMode, setViewMode] = useState<ViewMode>('day')
    const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true)
    const [displayMode, setDisplayMode] = useState<DisplayMode>('list')
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })

    // TODO: Wire up useObsidianTasks hook
    const blocks: DisplayBlock[] = [] 
    const isLoading = false

    const { executionCollapsed, toggleExecution } = useUIStore()

    const [currentTime, setCurrentTime] = useState(() => new Date())
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    // ──────────────────────────────────────────────
    // Date navigation
    // ──────────────────────────────────────────────

    const handlePrev = () => {
        const d = new Date(selectedDate)
        const offset = viewMode === 'day' ? 1 : viewMode === '3day' ? 3 : 7
        d.setDate(d.getDate() - offset)
        setSelectedDate(d)
    }

    const handleNext = () => {
        const d = new Date(selectedDate)
        const offset = viewMode === 'day' ? 1 : viewMode === '3day' ? 3 : 7
        d.setDate(d.getDate() + offset)
        setSelectedDate(d)
    }

    const handleToday = () => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        setSelectedDate(d)
    }

    const formattedSelectedDate = useMemo(() => {
        if (viewMode === 'day') {
            const now = new Date()
            if (isSameDay(selectedDate, now)) return 'Today'
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            if (isSameDay(selectedDate, yesterday)) return 'Yesterday'
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow'
            return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        }
        return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }, [selectedDate, viewMode])

    return (
        <div className={cn(
            "min-h-screen px-4 py-8 md:px-8 transition-all duration-300",
            isDesktop && executionCollapsed ? "md:pr-20" : "",
            isDesktop ? "max-w-none" : ""
        )}>
            <div className={cn("mx-auto flex gap-8", isDesktop ? "flex-row" : "flex-col max-w-2xl")}>
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <BlocksToolbar
                        formattedDate={formattedSelectedDate}
                        viewMode={viewMode}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onToday={handleToday}
                        onViewModeChange={setViewMode}
                        displayMode={displayMode}
                        onDisplayModeChange={setDisplayMode}
                        blockCount={blocks.length}
                        ptsOnly={false}
                        onPtsOnlyChange={() => {}}
                        onRefactor={() => {}}
                        isRefactoring={false}
                        hasBlocks={blocks.length > 0}
                        onNewBlock={() => {}}
                        showCreate={false}
                    />

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                            </div>
                        ) : blocks.length === 0 ? (
                            <Card className="border-zinc-800 bg-zinc-900/50">
                                <CardContent className="flex flex-col items-center py-12 text-center">
                                    <span className="text-4xl mb-4">📅</span>
                                    <p className="text-zinc-400">No tasks found in Obsidian for this date</p>
                                    <p className="text-xs text-zinc-500 mt-2">Check your daily note: {selectedDate.toISOString().split('T')[0]}.md</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {blocks.map((block) => (
                                    <BlockListItem
                                        key={block.id}
                                        block={block}
                                        currentTime={currentTime}
                                        manualBlockColor="emerald"
                                        onStart={(id) => router.push('/now')}
                                        onEdit={(id) => router.push(`/blocks/${id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel (NowView) - Desktop Only */}
                {isDesktop && (
                    <div className={cn(
                        "shrink-0 transition-all duration-300 relative",
                        executionCollapsed ? "w-0 overflow-hidden" : "w-80"
                    )}>
                        {!executionCollapsed && (
                            <div className="sticky top-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Execution</h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleExecution}
                                        className="h-8 w-8 text-zinc-500 hover:text-white"
                                    >
                                        <PanelRightClose className="h-4 w-4" />
                                    </Button>
                                </div>
                                <NowView isCompact />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
