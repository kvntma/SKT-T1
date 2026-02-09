'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Block } from '@/types'

export function useCurrentBlock() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['currentBlock'],
        queryFn: async (): Promise<Block | null> => {
            const now = new Date().toISOString()

            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .lte('planned_start', now)
                .gte('planned_end', now)
                .order('planned_start', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) {
                throw error
            }

            return data as Block | null
        },
        refetchInterval: 60000, // Refetch every minute
    })
}
