'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Session, Block } from '@/types/database'

interface SessionWithBlock extends Session {
    block?: Block | null
}

interface Stats {
    avgTimeToStart: number
    completionRate: number
    overrunRate: number
    bestHour: number | null
    totalFocusMinutes: number
    blocksCompleted: number
    blocksAborted: number
}

interface StatsData {
    stats: Stats
    sessions: SessionWithBlock[]
    isLoading: boolean
    error: Error | null
}

export function useStats(days: number = 7): StatsData {
    const supabase = createClient()

    const sessionsQuery = useQuery({
        queryKey: ['sessions', 'stats', days],
        queryFn: async (): Promise<SessionWithBlock[]> => {
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)
            startDate.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('sessions')
                .select(`
                    *,
                    block:blocks(*)
                `)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as SessionWithBlock[]
        },
    })

    const sessions = sessionsQuery.data ?? []

    // Calculate stats from sessions
    const completedSessions = sessions.filter(s => s.outcome === 'done')
    const abortedSessions = sessions.filter(s => s.outcome === 'aborted')
    const sessionsWithTTS = sessions.filter(s => s.time_to_start !== null)

    // Average Time-to-Start
    const avgTimeToStart = sessionsWithTTS.length > 0
        ? Math.round(sessionsWithTTS.reduce((sum, s) => sum + (s.time_to_start || 0), 0) / sessionsWithTTS.length)
        : 0

    // Completion Rate
    const totalFinished = completedSessions.length + abortedSessions.length
    const completionRate = totalFinished > 0
        ? Math.round((completedSessions.length / totalFinished) * 100)
        : 0

    // Overrun Rate (sessions that went past block planned_end)
    const sessionsWithBlocks = sessions.filter(s => s.block && s.actual_end)
    const overrunSessions = sessionsWithBlocks.filter(s => {
        if (!s.block || !s.actual_end) return false
        return new Date(s.actual_end) > new Date(s.block.planned_end)
    })
    const overrunRate = sessionsWithBlocks.length > 0
        ? Math.round((overrunSessions.length / sessionsWithBlocks.length) * 100)
        : 0

    // Best Execution Hour (hour with highest completion rate)
    const hourlyStats: Record<number, { completed: number; total: number }> = {}
    completedSessions.forEach(s => {
        if (s.actual_start) {
            const hour = new Date(s.actual_start).getHours()
            if (!hourlyStats[hour]) hourlyStats[hour] = { completed: 0, total: 0 }
            hourlyStats[hour].completed++
            hourlyStats[hour].total++
        }
    })
    abortedSessions.forEach(s => {
        if (s.actual_start) {
            const hour = new Date(s.actual_start).getHours()
            if (!hourlyStats[hour]) hourlyStats[hour] = { completed: 0, total: 0 }
            hourlyStats[hour].total++
        }
    })

    let bestHour: number | null = null
    let bestRate = 0
    Object.entries(hourlyStats).forEach(([hour, data]) => {
        if (data.total >= 2) { // Need at least 2 sessions to be meaningful
            const rate = data.completed / data.total
            if (rate > bestRate) {
                bestRate = rate
                bestHour = parseInt(hour)
            }
        }
    })

    // Total Focus Minutes
    const totalFocusMinutes = sessions.reduce((sum, s) => {
        if (s.actual_start && s.actual_end && s.block?.type === 'focus') {
            const duration = (new Date(s.actual_end).getTime() - new Date(s.actual_start).getTime()) / 60000
            return sum + Math.round(duration)
        }
        return sum
    }, 0)

    const stats: Stats = {
        avgTimeToStart,
        completionRate,
        overrunRate,
        bestHour,
        totalFocusMinutes,
        blocksCompleted: completedSessions.length,
        blocksAborted: abortedSessions.length,
    }

    return {
        stats,
        sessions,
        isLoading: sessionsQuery.isLoading,
        error: sessionsQuery.error as Error | null,
    }
}
