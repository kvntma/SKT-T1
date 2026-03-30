'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Block, Session } from '@/types'

export function useCurrentBlock() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['currentBlock'],
        queryFn: async (): Promise<(Block & { session?: Session | null }) | null> => {
            const now = new Date().toISOString()

            // Fetch blocks that overlap with current time
            const { data, error } = await supabase
                .from('blocks')
                .select(`
                    *,
                    sessions (
                        id,
                        outcome,
                        actual_start,
                        actual_end,
                        created_at
                    )
                `)
                .lte('planned_start', now)
                .gte('planned_end', now)
                .order('planned_start', { ascending: false })

            if (error) {
                throw error
            }

            if (!data || data.length === 0) return null

            // Find the first block that doesn't have a completed session
            const activeBlock = data.find(block => {
                const sessions = block.sessions || []
                if (sessions.length === 0) return true
                
                // If any session is 'done', 'aborted', or 'skipped', the block is finished
                const isFinished = sessions.some(s => 
                    s.outcome === 'done' || 
                    s.outcome === 'aborted' || 
                    s.outcome === 'skipped'
                )
                return !isFinished
            })

            if (!activeBlock) return null

            // Return the block with its most recent session (if any)
            return {
                ...activeBlock,
                session: (activeBlock.sessions as Session[])?.sort((a, b) => 
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                )[0] || null
            } as Block & { session?: Session | null }
        },
        refetchInterval: 60000, // Refetch every minute
    })
}
