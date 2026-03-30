'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@/types'

interface StartSessionParams {
    blockId: string
    timeToStart: number
}

interface EndSessionParams {
    sessionId: string
    outcome: 'done' | 'aborted' | 'continue'
    abortReason?: string
    resumeToken?: string
}

interface AbandonSessionParams {
    sessionId: string
}

export function useSession() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const lastSessionQuery = useQuery({
        queryKey: ['sessions', 'last'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user.id)
                .not('resume_token', 'is', null)
                .neq('resume_token', '')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw error
            return data as Session | null
        },
    })

    const startSession = useMutation({
        mutationFn: async ({ blockId, timeToStart }: StartSessionParams) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('sessions')
                .insert({
                    user_id: user.id,
                    block_id: blockId,
                    actual_start: new Date().toISOString(),
                    time_to_start: timeToStart,
                })
                .select()
                .single()

            if (error) throw error
            return data as Session
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    // Mark session as abandoned (user clicked Stop but hasn't saved yet)
    const abandonSession = useMutation({
        mutationFn: async ({ sessionId }: AbandonSessionParams) => {
            const { data, error } = await supabase
                .from('sessions')
                .update({
                    outcome: 'abandoned',
                })
                .eq('id', sessionId)
                .select()
                .single()

            if (error) throw error
            return data as Session
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
        },
    })

    // Resume session (user clicked Undo after Stop)
    const resumeSession = useMutation({
        mutationFn: async ({ sessionId }: AbandonSessionParams) => {
            const { data, error } = await supabase
                .from('sessions')
                .update({
                    outcome: null, // Clear the abandoned status
                })
                .eq('id', sessionId)
                .select()
                .single()

            if (error) throw error
            return data as Session
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
        },
    })

    // Finalize session with outcome and reason
    const endSession = useMutation({
        mutationFn: async ({ sessionId, outcome, abortReason, resumeToken }: EndSessionParams) => {
            const { data, error } = await supabase
                .from('sessions')
                .update({
                    actual_end: new Date().toISOString(),
                    outcome,
                    abort_reason: abortReason,
                    resume_token: resumeToken,
                })
                .eq('id', sessionId)
                .select()
                .single()

            if (error) throw error
            return data as Session
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
            queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
        },
    })

    return {
        startSession,
        abandonSession,
        resumeSession,
        endSession,
        lastSession: lastSessionQuery.data,
        isLoadingLastSession: lastSessionQuery.isLoading,
        refreshLastSession: () => queryClient.invalidateQueries({ queryKey: ['sessions', 'last'] }),
    }
}
