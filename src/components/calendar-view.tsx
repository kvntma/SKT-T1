'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { type BlockType, BLOCK_CONFIGS } from '@/lib/blocks/config'
import { isSameDay, getCalendarColor } from '@/lib/blocks/utils'
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { Lock, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CalendarEditDialog } from '@/components/calendar/calendar-edit-dialog'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface DisplayBlock {
    id: string
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    source: 'manual' | 'calendar'
    calendar_id?: string | null
    calendar_link?: string
    routine_id?: string | null
    session?: {
        outcome?: string | null
    } | null
}

interface Calendar {
    id: string
    color?: string
}

interface CalendarViewProps {
    blocks: DisplayBlock[]
    viewMode: 'day' | '3day' | 'week'
    baseDate?: Date
    onBlockUpdate?: (id: string, updates: { title?: string; planned_start?: string; planned_end?: string }) => void
    colorPrefs?: { manualBlockColor: string }
    calendars?: Calendar[]
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const START_HOUR = 0
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 60
const SNAP_STEP = 15

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

function formatHour(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h} ${ampm}`
}

function getBlockColor(type: BlockType): string {
    const config = BLOCK_CONFIGS[type]
    if (!config) return 'bg-zinc-700'
    return config.color.solid
}

function getDisplayDays(baseDate: Date, viewMode: 'day' | '3day' | 'week'): Date[] {
    const days: Date[] = []
    const start = new Date(baseDate)
    start.setHours(0, 0, 0, 0)

    if (viewMode === 'day') {
        days.push(start)
    } else if (viewMode === '3day') {
        for (let i = 0; i < 3; i++) {
            const day = new Date(start)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
    } else {
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        for (let i = 0; i < 7; i++) {
            const day = new Date(start)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
    }
    return days
}

// ──────────────────────────────────────────────
// DraggableBlock component
// ──────────────────────────────────────────────

interface DraggableBlockProps {
    block: DisplayBlock
    style: React.CSSProperties
    manualColor: string
    blockCalendarColor?: string
    onClick?: () => void
    isCompact?: boolean
}

function DraggableBlock({ block, style, manualColor, blockCalendarColor, onClick, isCompact: isCompactProp }: DraggableBlockProps) {
    const isCompleted = block.session?.outcome === 'done' || block.session?.outcome === 'skipped'
    const isReadOnly = block.source === 'calendar' || !!block.routine_id || isCompleted

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        disabled: isReadOnly,
    })

    const config = BLOCK_CONFIGS[block.type]
    const heightVal = style.height ? parseInt(String(style.height)) : 0
    const isSmallHeight = heightVal < 32
    const isCompact = isCompactProp || isSmallHeight

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined

    // Simplified color mapping for local-first obsidian pivot
    const getLegacyColorClass = (color: string) => {
        switch (color) {
            case 'emerald': return 'border-l-emerald-500'
            case 'blue': return 'border-l-blue-500'
            case 'purple': return 'border-l-purple-500'
            default: return 'border-l-zinc-500'
        }
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={() => {
                if (!isDragging) onClick?.()
            }}
            className={cn(
                "absolute rounded-lg text-left transition-all hover:ring-2 hover:ring-white/20 z-10 cursor-pointer",
                "p-1.5",
                isSmallHeight && "p-1",
                heightVal < 30 && "p-0.5",
                isDragging ? "opacity-50 ring-2 ring-emerald-500 shadow-xl" : "",
                block.source === 'manual' && getBlockColor(block.type),
                "overflow-hidden border-l-2",
                block.source === 'manual' && getLegacyColorClass(manualColor),
                isReadOnly && "cursor-default opacity-80"
            )}
            style={{
                ...style,
                ...dragStyle,
                ...(block.source === 'calendar' ? {
                    backgroundColor: blockCalendarColor ? `${blockCalendarColor}33` : '#71717a33',
                    borderLeftColor: blockCalendarColor ?? '#71717a'
                } : {}),
                ...(isCompleted ? { opacity: 0.6, filter: 'grayscale(0.5)' } : {})
            }}
        >
            <div className="relative flex flex-col h-full overflow-hidden justify-center pointer-events-none">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                        {config?.icon && <config.icon className={cn("shrink-0", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />}
                        <span className={cn("truncate font-medium text-white leading-none", isCompact ? "text-[10px]" : "text-xs", isCompleted && "line-through text-white/70")}>{block.title}</span>
                    </div>
                    {block.routine_id ? (
                        <Lock className="h-2.5 w-2.5 shrink-0 opacity-60 text-white" />
                    ) : block.source === 'calendar' ? (
                        <a
                            href={block.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 shrink-0 pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <CalendarIcon className="h-2.5 w-2.5" />
                        </a>
                    ) : isCompleted ? (
                        <CheckIcon className="h-2.5 w-2.5 text-emerald-400" />
                    ) : null}
                </div>
                {!isCompact && heightVal >= 45 && (
                    <p className="truncate text-[10px] text-white/60 mt-0.5">
                        {new Date(block.planned_start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })}
                    </p>
                )}
            </div>
        </div>
    )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

// ──────────────────────────────────────────────
// Layout algorithm
// ──────────────────────────────────────────────

interface LayoutBlock extends DisplayBlock {
    top: number
    height: number
    startMs: number
    endMs: number
    colIndex?: number
    colSpan?: number
}

function getLayoutForDay(dayBlocks: DisplayBlock[]) {
    const layoutBlocks: LayoutBlock[] = dayBlocks.map(b => {
        const start = new Date(b.planned_start)
        const end = new Date(b.planned_end)
        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60
        return {
            ...b,
            top: (startHour - START_HOUR) * HOUR_HEIGHT,
            height: Math.max((endHour - startHour) * HOUR_HEIGHT, 28),
            startMs: start.getTime(),
            endMs: end.getTime(),
            colIndex: 0
        }
    }).sort((a, b) => a.startMs - b.startMs || b.endMs - a.endMs)

    const columns: LayoutBlock[][] = []

    layoutBlocks.forEach(block => {
        let placed = false
        for (let i = 0; i < columns.length; i++) {
            const lastInCol = columns[i][columns[i].length - 1]
            if (block.startMs >= lastInCol.endMs) {
                columns[i].push(block)
                block.colIndex = i
                placed = true
                break
            }
        }
        if (!placed) {
            columns.push([block])
            block.colIndex = columns.length - 1
        }
    })

    return layoutBlocks.map(block => {
        let concurrentCols = 0
        for (const col of columns) {
            const hasOverlap = col.some(other =>
                other !== block &&
                other.startMs < block.endMs &&
                other.endMs > block.startMs
            )
            if (hasOverlap || col.includes(block)) {
                concurrentCols++
            }
        }

        const maxCols = Math.max(concurrentCols, 1)

        if (maxCols <= 1) {
            return {
                ...block,
                style: {
                    top: `${block.top}px`,
                    height: `${block.height}px`,
                    left: '0%',
                    width: '100%',
                    zIndex: block.colIndex! + 10
                }
            }
        }

        const visCols = Math.min(maxCols, 3)
        const width = (100 - 2) / visCols
        return {
            ...block,
            style: {
                top: `${block.top}px`,
                height: `${block.height}px`,
                left: `${block.colIndex! * width}%`,
                width: `${width}%`,
                zIndex: block.colIndex! + 10
            }
        }
    })
}

// ──────────────────────────────────────────────
// Main CalendarView component
// ──────────────────────────────────────────────

export function CalendarView({ blocks, viewMode, baseDate, onBlockUpdate, colorPrefs, calendars = [] }: CalendarViewProps) {
    const router = useRouter()
    const manualColor = colorPrefs?.manualBlockColor ?? 'emerald'
    const [activeId, setActiveId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [editingBlock, setEditingBlock] = useState<DisplayBlock | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    )

    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date()
            const startHour = Math.max(0, now.getHours() - 2)
            scrollRef.current.scrollTop = startHour * HOUR_HEIGHT
        }
    }, [])

    const getCalendarColorById = (calendarId: string | null | undefined): string | undefined => {
        return getCalendarColor(calendarId, calendars)
    }

    const now = useMemo(() => new Date(), [])
    const effectiveBaseDate = baseDate || now
    const displayDays = useMemo(() => getDisplayDays(effectiveBaseDate, viewMode), [effectiveBaseDate, viewMode])

    const currentTimeTop = useMemo(() => {
        const hour = now.getHours() + now.getMinutes() / 60
        return (hour - START_HOUR) * HOUR_HEIGHT
    }, [now])

    // ── Overlap constraint ──

    const checkOverlapConstraint = (targetDate: Date, targetBlockId: string, durationMs: number): boolean => {
        const newStartMs = targetDate.getTime()
        const newEndMs = newStartMs + durationMs

        const dayBlocks = blocks.filter(b =>
            b.id !== targetBlockId &&
            isSameDay(new Date(b.planned_start), targetDate)
        )

        const events = [
            ...dayBlocks.map(b => ({ start: new Date(b.planned_start).getTime(), end: new Date(b.planned_end).getTime() })),
            { start: newStartMs, end: newEndMs }
        ].sort((a, b) => a.start - b.start)

        let maxConcurrent = 0
        for (let i = 0; i < events.length; i++) {
            let concurrent = 0
            for (let j = 0; j < events.length; j++) {
                if (events[j].start < events[i].end && events[j].end > events[i].start) {
                    concurrent++
                }
            }
            maxConcurrent = Math.max(maxConcurrent, concurrent)
        }

        return maxConcurrent <= 4
    }

    // ── Drag handlers ──

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event
        setActiveId(null)

        if (!onBlockUpdate) return

        const block = blocks.find(b => b.id === active.id)
        if (!block) return

        if (!scrollRef.current) return
        const containerWidth = scrollRef.current.clientWidth - 56
        const dayWidth = containerWidth / displayDays.length

        const dayIndexDelta = Math.round(delta.x / dayWidth)

        const originalStart = new Date(block.planned_start)
        const originalEnd = new Date(block.planned_end)
        const durationMs = originalEnd.getTime() - originalStart.getTime()

        const snappedMinutesDelta = Math.round(delta.y / SNAP_STEP) * SNAP_STEP

        const newStart = new Date(originalStart)
        newStart.setDate(newStart.getDate() + dayIndexDelta)
        newStart.setMinutes(newStart.getMinutes() + snappedMinutesDelta)
        const newEnd = new Date(newStart.getTime() + durationMs)

        if (!checkOverlapConstraint(newStart, block.id, durationMs)) {
            toast.error("Too many overlapping items (max 4).")
            return
        }

        onBlockUpdate(block.id, {
            planned_start: newStart.toISOString(),
            planned_end: newEnd.toISOString(),
        })
    }

    const snapModifier = ({ transform }: { transform: { x: number; y: number; scaleX: number; scaleY: number } }) => {
        return {
            ...transform,
            y: Math.round(transform.y / SNAP_STEP) * SNAP_STEP,
        }
    }

    // ── Block click ──

    const handleBlockClick = (block: DisplayBlock) => {
        if (block.session?.outcome === 'done' || block.session?.outcome === 'skipped' || block.routine_id || block.source === 'calendar') {
            router.push(`/blocks/${block.id}`)
            return
        }

        setEditingBlock(block)
        setIsDialogOpen(true)
    }

    const handleSaveEdit = (id: string, updates: { title?: string; planned_start?: string; planned_end?: string }) => {
        onBlockUpdate?.(id, updates)
        setEditingBlock(null)
    }

    // ── Render ──

    return (
        <div className="flex flex-col h-full min-h-[600px] rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                <div className="w-14 shrink-0" />
                {displayDays.map((day, i) => {
                    const isToday = isSameDay(day, now)
                    return (
                        <div key={i} className={cn("flex-1 border-l border-zinc-800 py-3 text-center", isToday && "bg-white/[0.03]")}>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={cn("text-xl font-bold mt-0.5", isToday ? "text-emerald-400" : "text-zinc-300")}>
                                {day.getDate()}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Grid Body */}
            <div ref={scrollRef} className="flex-1 overflow-auto relative">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToFirstScrollableAncestor, snapModifier]}
                >
                    <div className="flex" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                        {/* Time Axis */}
                        <div className="w-14 shrink-0 border-r border-zinc-800/50 bg-zinc-950/20 relative">
                            {HOURS.map((hour) => (
                                <div key={hour} className="absolute left-0 right-0" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                                    <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-zinc-600">
                                        {formatHour(hour)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        <div className="flex-1 relative">
                            {/* Grid lines */}
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute left-0 right-0 border-t border-zinc-800/30"
                                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                                />
                            ))}

                            {/* Day columns with blocks */}
                            {displayDays.map((day, i) => {
                                const isToday = isSameDay(day, now)
                                const dayBlocks = blocks.filter(block => isSameDay(new Date(block.planned_start), day))
                                const layoutBlocks = getLayoutForDay(dayBlocks)

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "absolute top-0 bottom-0 border-l border-zinc-800/50 first:border-l-0",
                                            isToday && "bg-white/[0.01]"
                                        )}
                                        style={{ left: `${(i * 100) / displayDays.length}%`, width: `${100 / displayDays.length}%` }}
                                    >
                                        {/* Current Time Red Line */}
                                        {isToday && currentTimeTop >= 0 && (
                                            <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                                                <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                <div className="h-0.5 flex-1 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                                            </div>
                                        )}

                                        {/* Blocks */}
                                        {layoutBlocks.map((block) => {
                                            const blockCalendarColor = block.source === 'calendar' ? getCalendarColorById(block.calendar_id) : undefined
                                            return (
                                                <DraggableBlock
                                                    key={block.id}
                                                    block={block}
                                                    style={block.style}
                                                    manualColor={manualColor}
                                                    blockCalendarColor={blockCalendarColor}
                                                    onClick={() => handleBlockClick(block)}
                                                    isCompact={viewMode === 'week' || displayDays.length > 3}
                                                />
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </DndContext>
            </div>

            {/* Edit Dialog (extracted) */}
            <CalendarEditDialog
                block={editingBlock}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveEdit}
            />
        </div>
    )
}
