'use client'

import { useMemo, useState } from 'react'
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
import { GripVertical } from 'lucide-react'

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
}

interface Calendar {
    id: string
    color?: string
}

interface CalendarViewProps {
    blocks: DisplayBlock[]
    viewMode: 'today' | 'week'
    onBlockClick?: (blockId: string) => void
    onBlockUpdate?: (id: string, updates: { planned_start: string; planned_end: string }) => void
    colorPrefs?: BlockColorPreferences
    calendars?: Calendar[]  // For looking up calendar colors
}

// Hours to display (6 AM to 11 PM)
const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 60 // pixels per hour (1px = 1min)
const SNAP_STEP = 15 // minutes

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

function getWeekDays(baseDate: Date): Date[] {
    const days: Date[] = []
    const startOfWeek = new Date(baseDate)
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek) // Go to Sunday

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek)
        day.setDate(day.getDate() + i)
        days.push(day)
    }
    return days
}

interface DraggableBlockProps {
    block: DisplayBlock
    style: React.CSSProperties
    manualColor: string
    blockCalendarColor?: string
    onBlockClick?: (id: string) => void
}

function DraggableBlock({ block, style, manualColor, blockCalendarColor, onBlockClick }: DraggableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        disabled: block.source === 'calendar',
    })

    const config = BLOCK_CONFIGS[block.type]

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "absolute rounded-lg p-1 text-left transition-all hover:ring-2 hover:ring-white/20 z-10",
                isDragging ? "opacity-50 z-50 ring-2 ring-emerald-500 shadow-xl" : "",
                block.source === 'manual' && getBlockColor(block.type),
                "overflow-hidden border-l-2",
                block.source === 'manual' && getBlockColorClass(manualColor)
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
            <div className="flex items-start h-full gap-0.5">
                {/* Drag Handle */}
                {block.source === 'manual' && (
                    <div
                        {...listeners}
                        {...attributes}
                        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded shrink-0 self-stretch flex items-center"
                        title="Drag to reschedule"
                    >
                        <GripVertical className="h-3.5 w-3.5 text-white/40" />
                    </div>
                )}

                <button
                    onClick={() => onBlockClick?.(block.id)}
                    className="flex-1 min-w-0 text-left h-full"
                >
                    <div className="flex items-center gap-1.5 text-white">
                        {config?.icon && <config.icon className="h-3 w-3 shrink-0" />}
                        <span className="truncate text-xs font-medium">{block.title}</span>
                    </div>
                    <p className="truncate text-[10px] text-white/60">
                        {new Date(block.planned_start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })}
                    </p>
                </button>
            </div>
        </div>
    )
}

export function CalendarView({ blocks, viewMode, onBlockClick, onBlockUpdate, colorPrefs, calendars = [] }: CalendarViewProps) {
    const manualColor = colorPrefs?.manualBlockColor ?? 'emerald'
    const [activeId, setActiveId] = useState<string | null>(null)

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

    const getCalendarColorById = (calendarId: string | null | undefined): string | undefined => {
        if (!calendarId) return undefined
        const actualCalendarId = calendarId.split('::')[0]
        const calendar = calendars.find(c => c.id === actualCalendarId)
        return calendar?.color
    }

    const now = useMemo(() => new Date(), [])
    const weekDays = useMemo(() => getWeekDays(now), [now])

    const getBlockStyle = (block: DisplayBlock, dayIndex?: number) => {
        const start = new Date(block.planned_start)
        const end = new Date(block.planned_end)

        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60

        const top = (startHour - START_HOUR) * HOUR_HEIGHT
        const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24)

        if (viewMode === 'week' && dayIndex !== undefined) {
            const dayWidth = 100 / 7
            return {
                top: `${top}px`,
                height: `${height}px`,
                left: `${dayIndex * dayWidth}%`,
                width: `${dayWidth - 0.5}%`,
            }
        }

        return {
            top: `${top}px`,
            height: `${height}px`,
            left: '60px',
            right: '8px',
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

        // Calculate minute shift
        // delta.y is in pixels, 1px = 1min
        // Snap to SNAP_STEP
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

    // Custom snapping modifier
    const snapModifier = ({ transform }: { transform: { x: number; y: number; scaleX: number; scaleY: number } }) => {
        return {
            ...transform,
            y: Math.round(transform.y / SNAP_STEP) * SNAP_STEP,
        }
    }

    if (viewMode === 'today') {
        const todayBlocks = blocks.filter(block => {
            const blockStart = new Date(block.planned_start)
            return isSameDay(blockStart, now)
        })

        return (
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor, snapModifier]}
            >
                <div className="relative overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
                    <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="absolute left-0 right-0 border-t border-zinc-800"
                                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                            >
                                <span className="absolute -top-3 left-2 text-xs text-zinc-600 bg-zinc-900 px-1">
                                    {formatHour(hour)}
                                </span>
                            </div>
                        ))}

                        {currentTimeTop >= 0 && currentTimeTop <= HOURS.length * HOUR_HEIGHT && (
                            <div
                                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                                style={{ top: `${currentTimeTop}px` }}
                            >
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <div className="h-0.5 flex-1 bg-red-500" />
                            </div>
                        )}

                        {todayBlocks.map((block) => {
                            const style = getBlockStyle(block)
                            const blockCalendarColor = block.source === 'calendar' ? getCalendarColorById(block.calendar_id) : undefined

                            return (
                                <DraggableBlock
                                    key={block.id}
                                    block={block}
                                    style={style}
                                    manualColor={manualColor}
                                    blockCalendarColor={blockCalendarColor}
                                    onBlockClick={onBlockClick}
                                />
                            )
                        })}
                    </div>
                </div>
            </DndContext>
        )
    }

    // Week view (simplified, non-draggable for now to avoid complexity with multi-column drag)
    return (
        <div className="overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="sticky top-0 z-10 flex border-b border-zinc-800 bg-zinc-900">
                <div className="w-14 shrink-0" />
                {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, now)
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 border-l border-zinc-800 py-2 text-center",
                                isToday && "bg-white/5"
                            )}
                        >
                            <p className="text-xs text-zinc-500">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={cn(
                                "text-lg font-semibold",
                                isToday ? "text-white" : "text-zinc-400"
                            )}>
                                {day.getDate()}
                            </p>
                        </div>
                    )
                })}
            </div>

            <div className="relative flex" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                <div className="relative w-14 shrink-0 border-r border-zinc-800">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="absolute left-0 right-0"
                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                        >
                            <span className="absolute -top-2.5 right-2 text-[10px] text-zinc-600">
                                {formatHour(hour)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="relative flex-1">
                    {weekDays.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute top-0 bottom-0 border-l border-zinc-800",
                                isSameDay(weekDays[i], now) && "bg-white/[0.02]"
                            )}
                            style={{ left: `${(i * 100) / 7}%`, width: `${100 / 7}%` }}
                        />
                    ))}

                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-zinc-800/50"
                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                        />
                    ))}

                    {currentTimeTop >= 0 && currentTimeTop <= HOURS.length * HOUR_HEIGHT && (
                        <div
                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${currentTimeTop}px` }}
                        >
                            <div className="h-0.5 flex-1 bg-red-500" />
                        </div>
                    )}

                    {weekDays.map((day, dayIndex) => {
                        const dayBlocks = blocks.filter(block => isSameDay(new Date(block.planned_start), day))
                        return dayBlocks.map((block) => {
                            const style = getBlockStyle(block, dayIndex)
                            const config = BLOCK_CONFIGS[block.type]
                            const blockCalendarColor = block.source === 'calendar' ? getCalendarColorById(block.calendar_id) : undefined

                            return (
                                <button
                                    key={block.id}
                                    onClick={() => onBlockClick?.(block.id)}
                                    className={cn(
                                        "absolute rounded px-1 py-0.5 text-left transition-all hover:ring-1 hover:ring-white/30",
                                        block.source === 'manual' && getBlockColor(block.type),
                                        "overflow-hidden border-l-2",
                                        block.source === 'manual' && getBlockColorClass(manualColor)
                                    )}
                                    style={{
                                        ...style,
                                        ...(block.source === 'calendar' ? {
                                            backgroundColor: blockCalendarColor ? `${blockCalendarColor}33` : '#71717a33',
                                            borderLeftColor: blockCalendarColor ?? '#71717a'
                                        } : {})
                                    }}
                                >
                                    <div className="flex items-center gap-1 text-white leading-tight">
                                        {config?.icon && <config.icon className="h-2.5 w-2.5 shrink-0" />}
                                        <span className="truncate text-[10px] font-medium">{block.title}</span>
                                    </div>
                                </button>
                            )
                        })
                    })}
                </div>
            </div>
        </div>
    )
}
