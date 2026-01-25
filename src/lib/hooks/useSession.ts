'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useSession() {
    const supabase = createClient()
    const queryClient = useQueryClient()

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
        },
    })

    return {
        startSession,
        endSession,
    }
}
