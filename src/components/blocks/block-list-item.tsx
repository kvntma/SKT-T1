'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type DisplayBlock, formatTime, formatDate, isSameDay, getBlockTypeColor } from '@/lib/blocks/utils'
import { getBlockConfig, getBlockStatus, isTrackable, STATUS_ICONS } from '@/lib/blocks/config'

interface BlockListItemProps {
    block: DisplayBlock
    currentTime: Date
    manualBlockColor: string
    calendarColor?: string
    onStart: (blockId: string) => void
    onEdit: (blockId: string) => void
}

export function BlockListItem({
    block,
    currentTime,
    manualBlockColor,
    calendarColor,
    onStart,
    onEdit,
}: BlockListItemProps) {
    const status = getBlockStatus(block, block.session, currentTime)
    const config = getBlockConfig(block.type)

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
        <Card
            className={cn(
                'border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-colors hover:border-zinc-700 border-l-2',
                block.source === 'manual' && getLegacyColorClass(manualBlockColor),
                status.status === 'ready' && isTrackable(block.type) && 'ring-1 ring-emerald-500/30',
                (status.status === 'done' || status.status === 'skipped') && 'opacity-60'
            )}
            style={
                block.source === 'calendar'
                    ? { borderLeftColor: calendarColor ?? '#71717a' }
                    : undefined
            }
        >
            <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    {(() => {
                        const Icon =
                            status.status === 'done'
                                ? STATUS_ICONS.done
                                : status.status === 'skipped'
                                    ? STATUS_ICONS.skipped
                                    : config.icon
                        return (
                            <Icon
                                className={cn(
                                    'h-5 w-5',
                                    status.status === 'done' ? 'text-emerald-400' : config.color.text
                                )}
                            />
                        )
                    })()}
                </div>
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'truncate font-medium',
                            status.status === 'done' || status.status === 'skipped'
                                ? 'text-zinc-400 line-through'
                                : 'text-white'
                        )}
                    >
                        {block.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', getBlockTypeColor(block.type))}>
                            {config.label}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                            {!isSameDay(new Date(block.planned_start), currentTime) && (
                                <>{formatDate(block.planned_start)} · </>
                            )}
                            {formatTime(block.planned_start)} - {formatTime(block.planned_end)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {isTrackable(block.type) && status.canStart && (
                        <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => onStart(block.id)}
                        >
                            {status.status === 'ready' ? 'Start' : 'Start Early'}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white"
                        onClick={() => onEdit(block.id)}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
