'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type Routine = Database['public']['Tables']['routines']['Row']
export type InsertRoutine = Database['public']['Tables']['routines']['Insert']

export function useRoutines() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const routinesQuery = useQuery({
        queryKey: ['routines'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('routines')
                .select('*')
                .order('start_time', { ascending: true })

            if (error) throw error
            return data as Routine[]
        },
    })

    const createRoutine = useMutation({
        mutationFn: async (params: Omit<InsertRoutine, 'user_id'>) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('routines')
                .insert({
                    ...params,
                    user_id: user.id,
                } as InsertRoutine)
                .select()
                .single()

            if (error) throw error
            return data as Routine
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] })
        },
    })

    const updateRoutine = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Routine> & { id: string }) => {
            const { data, error } = await supabase
                .from('routines')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Routine
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] })
        },
    })

    const deleteRoutine = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('routines')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] })
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
        },
    })

    return {
        routines: routinesQuery.data ?? [],
        isLoading: routinesQuery.isLoading,
        error: routinesQuery.error,
        createRoutine,
        updateRoutine,
        deleteRoutine,
    }
}
