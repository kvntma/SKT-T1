'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

// Available Tailwind colors for block indicators
export const BLOCK_COLORS = [
    { value: 'zinc', label: 'Zinc', class: 'bg-zinc-500' },
    { value: 'slate', label: 'Slate', class: 'bg-slate-500' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
    { value: 'lime', label: 'Lime', class: 'bg-lime-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { value: 'sky', label: 'Sky', class: 'bg-sky-500' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'fuchsia', label: 'Fuchsia', class: 'bg-fuchsia-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
] as const

export type BlockColor = typeof BLOCK_COLORS[number]['value']

// Helper to get Tailwind border-l class for a color value
// Uses static map instead of string interpolation for Tailwind JIT compatibility
export function getBlockColorClass(color: string | null | undefined): string {
    const colorMap: Record<string, string> = {
        zinc: 'border-l-zinc-500',
        slate: 'border-l-slate-500',
        gray: 'border-l-gray-500',
        red: 'border-l-red-500',
        orange: 'border-l-orange-500',
        amber: 'border-l-amber-500',
        yellow: 'border-l-yellow-500',
        lime: 'border-l-lime-500',
        green: 'border-l-green-500',
        emerald: 'border-l-emerald-500',
        teal: 'border-l-teal-500',
        cyan: 'border-l-cyan-500',
        sky: 'border-l-sky-500',
        blue: 'border-l-blue-500',
        indigo: 'border-l-indigo-500',
        violet: 'border-l-violet-500',
        purple: 'border-l-purple-500',
        fuchsia: 'border-l-fuchsia-500',
        pink: 'border-l-pink-500',
        rose: 'border-l-rose-500',
    }
    const validColor = color && colorMap[color] ? color : 'zinc'
    return colorMap[validColor]
}

export interface BlockColorPreferences {
    manualBlockColor: BlockColor
    calendarBlockColor: BlockColor
}

export function useBlockColorPreferences() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Fetch user's color preferences
    const preferencesQuery = useQuery({
        queryKey: ['blockColorPreferences'],
        queryFn: async (): Promise<BlockColorPreferences> => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                return { manualBlockColor: 'emerald', calendarBlockColor: 'zinc' }
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('manual_block_color, calendar_block_color')
                .eq('id', user.id)
                .single()

            return {
                manualBlockColor: (profile?.manual_block_color as BlockColor) || 'emerald',
                calendarBlockColor: (profile?.calendar_block_color as BlockColor) || 'zinc',
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Update color preferences
    const updatePreferences = useMutation({
        mutationFn: async (preferences: Partial<BlockColorPreferences>) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const updates: Partial<Profile> = {}
            if (preferences.manualBlockColor) {
                updates.manual_block_color = preferences.manualBlockColor
            }
            if (preferences.calendarBlockColor) {
                updates.calendar_block_color = preferences.calendarBlockColor
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blockColorPreferences'] })
        },
    })

    return {
        preferences: preferencesQuery.data ?? { manualBlockColor: 'emerald', calendarBlockColor: 'zinc' },
        isLoading: preferencesQuery.isLoading,
        updatePreferences,
    }
}
