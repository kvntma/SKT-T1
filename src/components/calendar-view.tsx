'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { type BlockType, BLOCK_CONFIGS } from '@/lib/blocks/config'

interface DisplayBlock {
    id: string
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    source: 'manual' | 'calendar'
    calendar_link?: string
}

interface CalendarViewProps {
    blocks: DisplayBlock[]
    viewMode: 'today' | 'week'
    onBlockClick?: (blockId: string) => void
}

// Hours to display (6 AM to 11 PM)
const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 60 // pixels per hour

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

function getDayOfWeek(date: Date): number {
    return date.getDay() // 0 = Sunday, 1 = Monday, etc.
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

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}

export function CalendarView({ blocks, viewMode, onBlockClick }: CalendarViewProps) {
    const now = new Date()
    const weekDays = useMemo(() => getWeekDays(now), [])

    // Position a block on the calendar
    const getBlockStyle = (block: DisplayBlock, dayIndex?: number) => {
        const start = new Date(block.planned_start)
        const end = new Date(block.planned_end)

        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60

        const top = (startHour - START_HOUR) * HOUR_HEIGHT
        const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24) // Min height

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

    // Current time indicator
    const currentTimeTop = useMemo(() => {
        const hour = now.getHours() + now.getMinutes() / 60
        return (hour - START_HOUR) * HOUR_HEIGHT
    }, [now])

    // Filter blocks for each day in week view
    const getBlocksForDay = (day: Date) => {
        return blocks.filter(block => {
            const blockStart = new Date(block.planned_start)
            return isSameDay(blockStart, day)
        })
    }

    if (viewMode === 'today') {
        const todayBlocks = blocks.filter(block => {
            const blockStart = new Date(block.planned_start)
            return isSameDay(blockStart, now)
        })

        return (
            <div className="relative overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
                {/* Time grid */}
                <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                    {/* Hour lines */}
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

                    {/* Current time indicator */}
                    {currentTimeTop >= 0 && currentTimeTop <= HOURS.length * HOUR_HEIGHT && (
                        <div
                            className="absolute left-0 right-0 z-20 flex items-center"
                            style={{ top: `${currentTimeTop}px` }}
                        >
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <div className="h-0.5 flex-1 bg-red-500" />
                        </div>
                    )}

                    {/* Blocks */}
                    {todayBlocks.map((block) => {
                        const style = getBlockStyle(block)
                        const config = BLOCK_CONFIGS[block.type]

                        return (
                            <button
                                key={block.id}
                                onClick={() => onBlockClick?.(block.id)}
                                className={cn(
                                    "absolute rounded-lg px-2 py-1 text-left transition-all hover:ring-2 hover:ring-white/20",
                                    getBlockColor(block.type),
                                    "overflow-hidden"
                                )}
                                style={style}
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
                        )
                    })}
                </div>
            </div>
        )
    }

    // Week view
    return (
        <div className="overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            {/* Day headers */}
            <div className="sticky top-0 z-10 flex border-b border-zinc-800 bg-zinc-900">
                <div className="w-14 shrink-0" /> {/* Spacer for time column */}
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

            {/* Time grid */}
            <div className="relative flex" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                {/* Time labels */}
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

                {/* Day columns */}
                <div className="relative flex-1">
                    {/* Vertical day dividers */}
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

                    {/* Hour lines */}
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-zinc-800/50"
                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                        />
                    ))}

                    {/* Current time indicator */}
                    {currentTimeTop >= 0 && currentTimeTop <= HOURS.length * HOUR_HEIGHT && (
                        <div
                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${currentTimeTop}px` }}
                        >
                            <div className="h-0.5 flex-1 bg-red-500" />
                        </div>
                    )}

                    {/* Blocks for each day */}
                    {weekDays.map((day, dayIndex) => {
                        const dayBlocks = getBlocksForDay(day)
                        return dayBlocks.map((block) => {
                            const style = getBlockStyle(block, dayIndex)
                            const config = BLOCK_CONFIGS[block.type]

                            return (
                                <button
                                    key={block.id}
                                    onClick={() => onBlockClick?.(block.id)}
                                    className={cn(
                                        "absolute rounded px-1 py-0.5 text-left transition-all hover:ring-1 hover:ring-white/30",
                                        getBlockColor(block.type),
                                        "overflow-hidden"
                                    )}
                                    style={style}
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
