'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { type BlockType, BLOCK_CONFIGS } from '@/lib/blocks/config'
import { type BlockColorPreferences, getBlockColorClass } from '@/lib/hooks/useBlockColorPreferences'
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
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { Pencil, Lock, Calendar } from 'lucide-react'

interface DisplayBlock {
    id: string
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    source: 'manual' | 'calendar'
    calendar_id?: string | null  // For looking up calendar color
    calendar_link?: string
    routine_id?: string | null
}

interface Calendar {
    id: string
    color?: string
}

interface CalendarViewProps {
    blocks: DisplayBlock[]
    viewMode: 'day' | '3day' | 'week'
    baseDate?: Date
    onBlockClick?: (blockId: string) => void
    onBlockUpdate?: (id: string, updates: { planned_start: string; planned_end: string }) => void
    colorPrefs?: BlockColorPreferences
    calendars?: Calendar[]  // For looking up calendar colors
}

const START_HOUR = 0 // Full day support
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 60 
const SNAP_STEP = 15 

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

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
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

interface DraggableBlockProps {
    block: DisplayBlock
    style: React.CSSProperties
    manualColor: string
    blockCalendarColor?: string
    onBlockClick?: (id: string) => void
    isCompact?: boolean
}

function DraggableBlock({ block, style, manualColor, blockCalendarColor, onBlockClick, isCompact }: DraggableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        disabled: block.source === 'calendar' || !!block.routine_id,
    })

    const config = BLOCK_CONFIGS[block.type]

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "absolute rounded-lg p-1.5 text-left transition-all hover:ring-2 hover:ring-white/20 z-10",
                isDragging ? "opacity-50 z-50 ring-2 ring-emerald-500 shadow-xl" : "",
                block.source === 'manual' && getBlockColor(block.type),
                "overflow-hidden border-l-2",
                block.source === 'manual' && getBlockColorClass(manualColor),
                block.routine_id && "cursor-default"
            )}
            style={{
                ...style,
                ...dragStyle,
                ...(block.source === 'calendar' ? {
                    backgroundColor: blockCalendarColor ? `${blockCalendarColor}33` : '#71717a33',
                    borderLeftColor: blockCalendarColor ?? '#71717a'
                } : {})
            }}
        >
            <div className="relative flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                        {config?.icon && <config.icon className={cn("shrink-0", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />}
                        <span className={cn("truncate font-medium text-white leading-tight", isCompact ? "text-[10px]" : "text-xs")}>{block.title}</span>
                    </div>
                    {block.routine_id ? (
                        <Lock className="h-2.5 w-2.5 shrink-0 opacity-60 text-white" />
                    ) : block.source === 'calendar' ? (
                        <a
                            href={block.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-blue-400 shrink-0"
                        >
                            <Calendar className="h-2.5 w-2.5" />
                        </a>
                    ) : (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation()
                                onBlockClick?.(block.id)
                            }}
                            className="text-white/60 hover:text-white shrink-0 transition-colors"
                        >
                            <Pencil className="h-2.5 w-2.5" />
                        </button>
                    )}
                </div>
                {!isCompact && (
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

export function CalendarView({ blocks, viewMode, baseDate, onBlockClick, onBlockUpdate, colorPrefs, calendars = [] }: CalendarViewProps) {
    const manualColor = colorPrefs?.manualBlockColor ?? 'emerald'
    const [activeId, setActiveId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    // Scroll to current time or start of day on mount
    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date()
            const startHour = Math.max(0, now.getHours() - 2)
            scrollRef.current.scrollTop = startHour * HOUR_HEIGHT
        }
    }, [])

    const getCalendarColorById = (calendarId: string | null | undefined): string | undefined => {
        if (!calendarId) return undefined
        const actualCalendarId = calendarId.split('::')[0]
        const calendar = calendars.find(c => c.id === actualCalendarId)
        return calendar?.color
    }

    const now = useMemo(() => new Date(), [])
    const effectiveBaseDate = baseDate || now
    const displayDays = useMemo(() => getDisplayDays(effectiveBaseDate, viewMode), [effectiveBaseDate, viewMode])

    const getBlockStyle = (block: DisplayBlock, dayIndex: number) => {
        const start = new Date(block.planned_start)
        const end = new Date(block.planned_end)

        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60

        const top = (startHour - START_HOUR) * HOUR_HEIGHT
        const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20)

        const dayWidth = 100 / displayDays.length
        return {
            top: `${top}px`,
            height: `${height}px`,
            left: `${dayIndex * dayWidth}%`,
            width: `${dayWidth - 0.5}%`,
        }
    }

    const currentTimeTop = useMemo(() => {
        const hour = now.getHours() + now.getMinutes() / 60
        return (hour - START_HOUR) * HOUR_HEIGHT
    }, [now])

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event
        setActiveId(null)

        if (!onBlockUpdate || delta.y === 0) return

        const block = blocks.find(b => b.id === active.id)
        if (!block) return

        const rawMinutesDelta = delta.y
        const snappedMinutesDelta = Math.round(rawMinutesDelta / SNAP_STEP) * SNAP_STEP

        if (snappedMinutesDelta === 0) return

        const newStart = new Date(block.planned_start)
        newStart.setMinutes(newStart.getMinutes() + snappedMinutesDelta)

        const newEnd = new Date(block.planned_end)
        newEnd.setMinutes(newEnd.getMinutes() + snappedMinutesDelta)

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
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor, snapModifier]}
                >
                    <div className="flex" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                        {/* Time Axis */}
                        <div className="w-14 shrink-0 border-r border-zinc-800/50 bg-zinc-950/20 relative">
                            {HOURS.map((hour) => (
                                <div key={hour} className="absolute left-0 right-0 h-[60px]" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}>
                                    <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-zinc-600">
                                        {formatHour(hour)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Columns and Blocks */}
                        <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute left-0 right-0 border-t border-zinc-800/30"
                                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: '60px' }}
                                />
                            ))}

                            {/* Vertical day columns */}
                            {displayDays.map((day, i) => {
                                const isToday = isSameDay(day, now)
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "absolute top-0 bottom-0 border-l border-zinc-800/50 first:border-l-0",
                                            isToday && "bg-white/[0.01]"
                                        )}
                                        style={{ left: `${(i * 100) / displayDays.length}%`, width: `${100 / displayDays.length}%` }}
                                    >
                                        {/* Current Time Red Line - Only on the correct day column */}
                                        {isToday && currentTimeTop >= 0 && (
                                            <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                                                <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                <div className="h-0.5 flex-1 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                                            </div>
                                        )}

                                        {/* Blocks for this day */}
                                        {blocks
                                            .filter(block => isSameDay(new Date(block.planned_start), day))
                                            .map((block) => {
                                                const style = getBlockStyle(block, 0) // dayIndex is 0 relative to column
                                                const blockCalendarColor = block.source === 'calendar' ? getCalendarColorById(block.calendar_id) : undefined
                                                return (
                                                    <DraggableBlock
                                                        key={block.id}
                                                        block={block}
                                                        style={{...style, left: '2px', width: '96%'}}
                                                        manualColor={manualColor}
                                                        blockCalendarColor={blockCalendarColor}
                                                        onBlockClick={onBlockClick}
                                                        isCompact={viewMode === 'week' || displayDays.length > 3}
                                                    />
                                                )
                                            })
                                        }
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </DndContext>
            </div>
        </div>
    )
}