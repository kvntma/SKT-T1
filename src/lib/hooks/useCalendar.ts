'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface CalendarEvent {
    google_id: string
    title: string
    planned_start: string
    planned_end: string
    description?: string
    calendar_link?: string
    type: 'focus' | 'admin' | 'recovery'
}

interface Calendar {
    id: string
    name: string
    primary: boolean
    color?: string
    accessRole?: string  // e.g., "owner", "reader", "freeBusyReader"
}

interface CalendarsResponse {
    connected: boolean
    calendars: Calendar[]
}

interface EventsResponse {
    connected: boolean
    calendarId: string
    events: CalendarEvent[]
}

export function useCalendar() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [syncedCalendarIds, setSyncedCalendarIds] = useState<string[]>([])
    const [lastCalendarSync, setLastCalendarSync] = useState<string | null>(null)
    const [pushCalendarId, setPushCalendarId] = useState<string | null>(null)

    // Load synced calendar IDs and last sync time from profile
    useEffect(() => {
        const loadSyncedCalendars = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('synced_calendar_ids, last_calendar_sync, push_calendar_id')
                .eq('id', user.id)
                .maybeSingle()

            if (profile?.synced_calendar_ids) {
                setSyncedCalendarIds(profile.synced_calendar_ids)
            }
            if (profile?.last_calendar_sync) {
                setLastCalendarSync(profile.last_calendar_sync)
            }
            if (profile?.push_calendar_id) {
                setPushCalendarId(profile.push_calendar_id)
            }
        }
        loadSyncedCalendars()
    }, [supabase])

    // Check if calendar is connected and list available calendars
    const calendarsQuery = useQuery<CalendarsResponse>({
        queryKey: ['calendars'],
        queryFn: async () => {
            const res = await fetch('/api/calendar/calendars')
            if (!res.ok) {
                const data = await res.json()
                if (data.connected === false) {
                    return { connected: false, calendars: [] }
                }
                throw new Error(data.error)
            }
            return res.json()
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    })

    // Save synced calendars to database
    const saveSyncedCalendars = useCallback(async (ids: string[]) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('[useCalendar] No user found when saving synced calendars')
            return
        }

        console.log('[useCalendar] Saving synced calendars:', ids)

        // Use upsert to handle case where profile doesn't exist yet
        const { error } = await supabase
            .from('profiles')
            .upsert(
                {
                    id: user.id,
                    synced_calendar_ids: ids,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'id' }
            )

        if (error) {
            console.error('[useCalendar] Error saving synced calendars:', error)
        } else {
            console.log('[useCalendar] Successfully saved synced calendars')
        }
    }, [supabase])

    // Auto-select primary calendar when calendars load (if no selection yet)
    useEffect(() => {
        if (calendarsQuery.data?.calendars && syncedCalendarIds.length === 0) {
            const primary = calendarsQuery.data.calendars.find(c => c.primary)
            if (primary) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSyncedCalendarIds([primary.id])
                // Save to DB
                saveSyncedCalendars([primary.id])
            }
        }
    }, [calendarsQuery.data?.calendars, syncedCalendarIds.length, saveSyncedCalendars])

    // Toggle a calendar's sync state
    const toggleCalendar = useMutation({
        mutationFn: async (calendarId: string) => {
            console.log('[useCalendar] Toggling calendar:', calendarId)
            console.log('[useCalendar] Current synced IDs:', syncedCalendarIds)

            const newIds = syncedCalendarIds.includes(calendarId)
                ? syncedCalendarIds.filter(id => id !== calendarId)
                : [...syncedCalendarIds, calendarId]

            console.log('[useCalendar] New synced IDs:', newIds)

            setSyncedCalendarIds(newIds)
            await saveSyncedCalendars(newIds)
            return newIds
        },
        onSuccess: (newIds) => {
            console.log('[useCalendar] Toggle successful, new IDs:', newIds)
            // Trigger a re-sync with new calendar selection
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
        },
        onError: (error) => {
            console.error('[useCalendar] Toggle failed:', error)
        },
    })

    // Fetch events - this is still used for real-time display
    const eventsQuery = useQuery<EventsResponse>({
        queryKey: ['calendar-events', syncedCalendarIds[0]],
        queryFn: async () => {
            const calendarId = syncedCalendarIds[0]
            const url = calendarId
                ? `/api/calendar/events?calendarId=${encodeURIComponent(calendarId)}`
                : '/api/calendar/events'
            const res = await fetch(url)
            if (!res.ok) {
                const data = await res.json()
                if (data.connected === false) {
                    return { connected: false, calendarId: '', events: [] }
                }
                throw new Error(data.error)
            }
            return res.json()
        },
        enabled: calendarsQuery.data?.connected ?? false,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })

    // Helper to connect calendar
    const connectCalendar = () => {
        window.location.href = '/api/calendar?action=connect'
    }

    // Invalidate queries after import
    const refreshEvents = () => {
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    }

    // Check if a specific calendar is synced
    const isCalendarSynced = (calendarId: string) => syncedCalendarIds.includes(calendarId)

    return {
        isConnected: calendarsQuery.data?.connected ?? false,
        // Filter out the Push To Start calendar to prevent circular sync
        calendars: (calendarsQuery.data?.calendars ?? []).filter(cal => cal.id !== pushCalendarId),
        // Also provide the raw list for color lookups (includes push calendar)
        allCalendars: calendarsQuery.data?.calendars ?? [],
        events: eventsQuery.data?.events ?? [],
        syncedCalendarIds,
        lastCalendarSync,
        pushCalendarId,
        isCalendarSynced,
        toggleCalendar: toggleCalendar.mutate,
        isTogglingCalendar: toggleCalendar.isPending,
        isLoadingCalendars: calendarsQuery.isLoading,
        isLoadingEvents: eventsQuery.isLoading,
        connectCalendar,
        refreshEvents,
        // Legacy support
        selectedCalendarId: syncedCalendarIds[0] ?? null,
        setSelectedCalendarId: (id: string) => {
            setSyncedCalendarIds([id])
            saveSyncedCalendars([id])
        },
    }
}
