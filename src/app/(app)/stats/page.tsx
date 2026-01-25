'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Placeholder stats for demo
const STATS = {
    avgTimeToStart: 47, // seconds
    completionRate: 78, // percent
    overrunRate: 23, // percent
    bestHour: 9, // 9 AM
    totalFocusMinutes: 185,
    blocksCompleted: 7,
    blocksAborted: 2,
}

function formatTimeToStart(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatHour(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h} ${ampm}`
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

export default function StatsPage() {
    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Stats</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Friction metrics for the last 7 days
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="mb-6 flex items-center gap-3">
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                        {STATS.blocksCompleted} completed
                    </Badge>
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                        {STATS.totalFocusMinutes} min focused
                    </Badge>
                </div>

                {/* Main Metrics */}
                <div className="grid gap-4">
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
                                <span className={`text-4xl font-bold ${getTTSColor(STATS.avgTimeToStart)}`}>
                                    {formatTimeToStart(STATS.avgTimeToStart)}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                >
                                    ↓ 12s from last week
                                </Badge>
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
                                <span className={`text-4xl font-bold ${getCompletionColor(STATS.completionRate)}`}>
                                    {STATS.completionRate}%
                                </span>
                                <span className="text-sm text-zinc-500">
                                    {STATS.blocksCompleted}/{STATS.blocksCompleted + STATS.blocksAborted} blocks
                                </span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${STATS.completionRate}%` }}
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
                                <span className={`text-4xl font-bold ${STATS.overrunRate > 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {STATS.overrunRate}%
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                >
                                    Needs attention
                                </Badge>
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
                                    {formatHour(STATS.bestHour)}
                                </span>
                                <span className="text-sm text-zinc-500">
                                    Highest completion rate
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">
                                Schedule important blocks around this time
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Insight Card */}
                <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
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

                {/* Navigation */}
                <div className="mt-8 flex justify-center">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white" asChild>
                        <a href="/now">← Back to Now</a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
