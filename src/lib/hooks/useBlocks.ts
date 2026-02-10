'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Block } from '@/types/database'
import type { BlockType } from '@/lib/blocks/config'

interface CreateBlockParams {
    title: string
    type: BlockType
    planned_start: string
    planned_end: string
    stop_condition?: string
    goal_id?: string
    routine_id?: string
    task_link?: string
    linear_issue_id?: string
}

interface UpdateBlockParams {
    id: string
    updates: Partial<CreateBlockParams>
}

type BlockView = 'today' | '3day' | 'week'

export function useBlocks(view: BlockView = 'today', baseDate: Date = new Date()) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Calculate date range based on view and baseDate
    const getDateRange = () => {
        const start = new Date(baseDate)
        start.setHours(0, 0, 0, 0)

        if (view === 'week') {
            // Align to Sunday for consistent week display
            const dayOfWeek = start.getDay()
            const weekStart = new Date(start)
            weekStart.setDate(start.getDate() - dayOfWeek)
            
            const end = new Date(weekStart)
            end.setDate(end.getDate() + 7)
            return { start: weekStart, end }
        }

        if (view === '3day') {
            const end = new Date(start)
            end.setDate(end.getDate() + 3)
            return { start, end }
        }

        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        return { start, end }
    }

    // Fetch blocks for the selected view with their sessions
    const blocksQuery = useQuery({
        queryKey: ['blocks', view, baseDate.toISOString().split('T')[0]],
        queryFn: async () => {
            const { start, end } = getDateRange()

            const { data, error } = await supabase
                .from('blocks')
                .select(`
                    *,
                    sessions (
                        id,
                        outcome,
                        actual_start,
                        actual_end
                    )
                `)
                .gte('planned_start', start.toISOString())
                .lt('planned_start', end.toISOString())
                .order('planned_start', { ascending: true })

            if (error) throw error

            // Flatten session data - take the first session if exists
            return (data ?? []).map(block => ({
                ...block,
                session: block.sessions?.[0] ?? null,
            }))
        },
    })

    // Create a new block
    const createBlock = useMutation({
        mutationFn: async (params: CreateBlockParams) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('blocks')
                .insert({
                    user_id: user.id,
                    ...params,
                })
                .select()
                .single()

            if (error) throw error
            return data as Block
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    // Update an existing block
    const updateBlock = useMutation({
        mutationFn: async ({ id, updates }: UpdateBlockParams) => {
            const { data, error } = await supabase
                .from('blocks')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Block
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
        },
    })

    // Delete a block
    const deleteBlock = useMutation({
        mutationFn: async (blockId: string) => {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('id', blockId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    return {
        blocks: blocksQuery.data ?? [],
        isLoading: blocksQuery.isLoading,
        error: blocksQuery.error,
        createBlock,
        updateBlock,
        deleteBlock,
    }
}
