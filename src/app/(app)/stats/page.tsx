'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useStats } from '@/lib/hooks/useStats'

function formatTimeToStart(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatHour(hour: number | null): string {
    if (hour === null) return '--'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h} ${ampm}`
}

function formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

function formatDuration(startDate: string, endDate: string): string {
    const minutes = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function getCompletionColor(rate: number): string {
    if (rate >= 80) return 'text-emerald-400'
    if (rate >= 60) return 'text-yellow-400'
    return 'text-red-400'
}

function getTTSColor(seconds: number): string {
    if (seconds <= 30) return 'text-emerald-400'
    if (seconds <= 60) return 'text-yellow-400'
    return 'text-red-400'
}

function getBlockTypeColor(type: string): string {
    switch (type) {
        case 'focus': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        case 'admin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'recovery': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
}

function getOutcomeStyle(outcome: string | null): { bg: string; text: string; label: string } {
    switch (outcome) {
        case 'done':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '✅ Completed' }
        case 'aborted':
            return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '⏹️ Stopped' }
        case 'continue':
            return { bg: 'bg-blue-500/10', text: 'text-blue-400', label: '🔄 Continue' }
        default:
            return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: '⏳ In Progress' }
    }
}

export default function StatsPage() {
    const { stats, sessions, isLoading, error } = useStats(7)

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                    <p className="text-sm text-zinc-500">Loading stats...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400">Failed to load stats</p>
                    <p className="text-sm text-zinc-500 mt-2">{error.message}</p>
                </div>
            </div>
        )
    }

    const hasData = sessions.length > 0

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header with Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white"
                        asChild
                    >
                        <a href="/now">
                            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </a>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white">Stats & History</h1>
                        <p className="text-sm text-zinc-500">
                            Last 7 days of execution
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white"
                        asChild
                    >
                        <a href="/settings">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </a>
                    </Button>
                </div>

                <Tabs defaultValue="stats" className="w-full">
                    <TabsList className="mb-6 grid w-full grid-cols-2 bg-zinc-900">
                        <TabsTrigger value="stats" className="data-[state=active]:bg-zinc-800">
                            📊 Stats
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-zinc-800">
                            📜 History ({sessions.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Stats Tab */}
                    <TabsContent value="stats" className="space-y-4">
                        {!hasData ? (
                            <Card className="border-zinc-800 bg-zinc-900/50">
                                <CardContent className="flex flex-col items-center py-12 text-center">
                                    <span className="text-4xl mb-4">📊</span>
                                    <p className="text-zinc-400">No session data yet</p>
                                    <p className="text-sm text-zinc-600 mt-1">
                                        Complete some blocks to see your stats
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {/* Quick Stats */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                                        {stats.blocksCompleted} completed
                                    </Badge>
                                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                                        {stats.totalFocusMinutes} min focused
                                    </Badge>
                                </div>

                                {/* Time-to-Start */}
                                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <span>⏱️</span>
                                            Avg Time-to-Start
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <span className={`text-4xl font-bold ${getTTSColor(stats.avgTimeToStart)}`}>
                                                {formatTimeToStart(stats.avgTimeToStart)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-zinc-500">
                                            How quickly you start after a block begins
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Completion Rate */}
                                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <span>✅</span>
                                            Completion Rate
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <span className={`text-4xl font-bold ${getCompletionColor(stats.completionRate)}`}>
                                                {stats.completionRate}%
                                            </span>
                                            <span className="text-sm text-zinc-500">
                                                {stats.blocksCompleted}/{stats.blocksCompleted + stats.blocksAborted} blocks
                                            </span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${stats.completionRate}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Overrun Rate */}
                                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <span>⏰</span>
                                            Overrun Rate
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <span className={`text-4xl font-bold ${stats.overrunRate > 30 ? 'text-red-400' : stats.overrunRate > 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                {stats.overrunRate}%
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-zinc-500">
                                            Blocks that ran past their planned end time
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Best Execution Hour */}
                                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <span>🌟</span>
                                            Best Execution Hour
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-4xl font-bold text-white">
                                                {formatHour(stats.bestHour)}
                                            </span>
                                            <span className="text-sm text-zinc-500">
                                                {stats.bestHour !== null ? 'Highest completion rate' : 'Not enough data'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-zinc-500">
                                            Schedule important blocks around this time
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Insight Card */}
                                {stats.overrunRate > 20 && (
                                    <Card className="border-amber-500/20 bg-amber-500/5">
                                        <CardContent className="flex items-start gap-3 p-4">
                                            <span className="text-xl">💡</span>
                                            <div>
                                                <p className="font-medium text-amber-200">Insight</p>
                                                <p className="mt-1 text-sm text-amber-200/70">
                                                    Your overrun rate is above 20%. Consider adding more buffer time or breaking blocks into shorter chunks.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
                            Recent Sessions
                        </p>

                        {sessions.length === 0 ? (
                            <Card className="border-zinc-800 bg-zinc-900/50">
                                <CardContent className="flex flex-col items-center py-12 text-center">
                                    <span className="text-4xl mb-4">📜</span>
                                    <p className="text-zinc-400">No sessions yet</p>
                                    <p className="text-sm text-zinc-600 mt-1">
                                        Complete some blocks to see your history
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            sessions.map((session) => {
                                const outcomeStyle = getOutcomeStyle(session.outcome)
                                const blockType = session.block?.type || 'focus'

                                return (
                                    <Card
                                        key={session.id}
                                        className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-colors hover:border-zinc-700"
                                    >
                                        <CardContent className="p-4">
                                            {/* Header Row */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate font-medium text-white">
                                                        {session.block?.title || 'Untitled Block'}
                                                    </h3>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-xs", getBlockTypeColor(blockType))}
                                                        >
                                                            {blockType}
                                                        </Badge>
                                                        <span className={cn("text-xs font-medium", outcomeStyle.text)}>
                                                            {outcomeStyle.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Linear Link */}
                                                {session.block?.linear_issue_id && (
                                                    <a
                                                        href={`https://linear.app/issue/${session.block.linear_issue_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="shrink-0 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition-colors hover:bg-indigo-500/20"
                                                    >
                                                        {session.block.linear_issue_id}
                                                    </a>
                                                )}
                                            </div>

                                            {/* Time Info */}
                                            {session.actual_start && (
                                                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-3">
                                                    <div>
                                                        <p className="text-xs text-zinc-500">Started</p>
                                                        <p className="text-sm text-zinc-300">
                                                            {formatDateTime(session.actual_start)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-zinc-500">Duration</p>
                                                        <p className="text-sm text-zinc-300">
                                                            {session.actual_end
                                                                ? formatDuration(session.actual_start, session.actual_end)
                                                                : '--'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-zinc-500">TTS</p>
                                                        <p className={cn("text-sm font-medium",
                                                            session.time_to_start !== null
                                                                ? getTTSColor(session.time_to_start)
                                                                : 'text-zinc-400'
                                                        )}>
                                                            {session.time_to_start !== null
                                                                ? formatTimeToStart(session.time_to_start)
                                                                : '--'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resume Token */}
                                            {session.resume_token && (
                                                <div className="mt-3 rounded-lg bg-zinc-800/50 p-2.5">
                                                    <p className="text-xs text-zinc-500">Next Step</p>
                                                    <p className="mt-0.5 text-sm text-zinc-300">
                                                        {session.resume_token}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Abort Reason */}
                                            {session.abort_reason && (
                                                <div className="mt-2 text-xs text-amber-400/70">
                                                    Stopped: {session.abort_reason.replace(/_/g, ' ')}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
