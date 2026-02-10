'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/database'

export function useTasks(type?: 'task' | 'routine' | 'goal') {
    const supabase = createClient()

    return useQuery({
        queryKey: ['tasks', type],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select('*')
                .order('priority', { ascending: true })

            if (type) {
                query = query.eq('task_type', type)
            }

            const { data, error } = await query

            if (error) throw error
            return data as Task[]
        },
    })
}
