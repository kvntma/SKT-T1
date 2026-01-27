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
    task_link?: string
    linear_issue_id?: string
}

type BlockView = 'today' | 'week'

export function useBlocks(view: BlockView = 'today') {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Calculate date range based on view
    const getDateRange = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (view === 'week') {
            const endOfWeek = new Date(today)
            endOfWeek.setDate(endOfWeek.getDate() + 7)
            return { start: today, end: endOfWeek }
        }

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return { start: today, end: tomorrow }
    }

    // Fetch blocks for the selected view with their sessions
    const blocksQuery = useQuery({
        queryKey: ['blocks', view],
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
        },
    })

    return {
        blocks: blocksQuery.data ?? [],
        isLoading: blocksQuery.isLoading,
        error: blocksQuery.error,
        createBlock,
        deleteBlock,
    }
}
