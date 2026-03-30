'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRoutines } from './useRoutines'
import { useQueryClient } from '@tanstack/react-query'
import type { Block } from '@/types'
import type { InsertBlock } from '@/types/database'

export function useRoutineSync() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const { routines, isLoading: isLoadingRoutines } = useRoutines()
    const [isSyncing, setIsSyncing] = useState(false)

    useEffect(() => {
        if (isLoadingRoutines || routines.length === 0 || isSyncing) return

        const syncRoutines = async () => {
            setIsSyncing(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const now = new Date()
                const startRange = new Date(now)
                startRange.setHours(0, 0, 0, 0)
                const endRange = new Date(now)
                endRange.setDate(now.getDate() + 7)
                endRange.setHours(23, 59, 59, 999)

                // 1. Fetch ALL existing routine blocks in the 7-day range
                const { data: existingBlocks } = await supabase
                    .from('blocks')
                    .select('routine_id, planned_start')
                    .not('routine_id', 'is', null)
                    .gte('planned_start', startRange.toISOString())
                    .lte('planned_start', endRange.toISOString())

                // Create a lookup key: "routineId::dateString"
                const existingKeys = new Set(
                    existingBlocks?.map(b => {
                        const date = new Date(b.planned_start).toISOString().split('T')[0]
                        return `${b.routine_id}::${date}`
                    }) || []
                )

                const blocksToInsert: InsertBlock[] = []

                // 2. Iterate through next 7 days and identify missing blocks
                for (let i = 0; i < 7; i++) {
                    const targetDate = new Date(now)
                    targetDate.setDate(now.getDate() + i)
                    const dateString = targetDate.toISOString().split('T')[0]
                    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay()

                    const routinesForDay = routines.filter(routine => {
                        const recurrence = routine.recurrence as { days: number[] }
                        const key = `${routine.id}::${dateString}`
                        return recurrence.days.includes(dayOfWeek) && !existingKeys.has(key)
                    })

                    for (const routine of routinesForDay) {
                        const [hours, minutes] = routine.start_time.split(':').map(Number)
                        const plannedStart = new Date(targetDate)
                        plannedStart.setHours(hours, minutes, 0, 0)
                        
                        const plannedEnd = new Date(plannedStart.getTime() + routine.duration_minutes * 60000)

                        blocksToInsert.push({
                            user_id: user.id,
                            routine_id: routine.id,
                            title: routine.title,
                            type: routine.type as Block['type'],
                            planned_start: plannedStart.toISOString(),
                            planned_end: plannedEnd.toISOString(),
                        })
                    }
                }

                if (blocksToInsert.length > 0) {
                    const { error } = await supabase.from('blocks').insert(blocksToInsert)
                    if (!error) {
                        queryClient.invalidateQueries({ queryKey: ['blocks'] })
                    }
                }
            } catch (error) {
                console.error('[RoutineSync] Failed to sync routines:', error)
            } finally {
                setIsSyncing(false)
            }
        }

        syncRoutines()
        // We intentionally omit isSyncing from dependencies to avoid re-triggering 
        // when the sync finishes and sets isSyncing to false.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routines, isLoadingRoutines, queryClient, supabase])

    return { isSyncing }
}
