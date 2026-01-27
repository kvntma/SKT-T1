'use client'

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCalendar } from './useCalendar'

interface SyncResponse {
    synced: boolean
    reason?: string
    blockCount?: number
    totalEvents?: number
    lastSync?: string
}

export function useCalendarSync() {
    const queryClient = useQueryClient()
    const { isConnected } = useCalendar()

    const syncMutation = useMutation<SyncResponse>({
        mutationFn: async () => {
            const res = await fetch('/api/calendar/sync', { method: 'POST' })
            if (!res.ok) {
                throw new Error('Sync failed')
            }
            return res.json()
        },
        onSuccess: (data) => {
            if (data.synced) {
                // Invalidate blocks query to show new blocks
                queryClient.invalidateQueries({ queryKey: ['blocks'] })
                queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
            }
        },
    })

    const forceSyncMutation = useMutation<SyncResponse>({
        mutationFn: async () => {
            const res = await fetch('/api/calendar/sync?force=true', { method: 'POST' })
            if (!res.ok) {
                throw new Error('Force sync failed')
            }
            return res.json()
        },
        onSuccess: (data) => {
            if (data.synced) {
                queryClient.invalidateQueries({ queryKey: ['blocks'] })
                queryClient.invalidateQueries({ queryKey: ['currentBlock'] })
                queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
            }
        },
    })

    // Auto-sync on mount when calendar is connected
    useEffect(() => {
        if (isConnected && !syncMutation.isPending && !syncMutation.isSuccess) {
            syncMutation.mutate()
        }
    }, [isConnected])

    return {
        isSyncing: syncMutation.isPending || forceSyncMutation.isPending,
        syncResult: syncMutation.data,
        syncError: syncMutation.error,
        forceSync: forceSyncMutation.mutate,
        isForceSyncing: forceSyncMutation.isPending,
    }
}
