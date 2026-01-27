// Calendar sync endpoint - fetches events and upserts as blocks
// Called on app open to keep blocks in sync with calendar

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

interface GoogleEvent {
    id: string
    summary: string
    start: { dateTime?: string; date?: string }
    end: { dateTime?: string; date?: string }
    description?: string
    htmlLink?: string
}

interface GoogleCalendarEventsResponse {
    items: GoogleEvent[]
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.access_token
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check force parameter
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Get user's calendar tokens and last sync time
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expires, synced_calendar_ids, last_calendar_sync')
        .eq('id', user.id)
        .single()

    if (!profile?.google_calendar_token) {
        return NextResponse.json({ synced: false, reason: 'not_connected' })
    }

    // Check if we need to sync (1-hour cache)
    if (!force && profile.last_calendar_sync) {
        const lastSync = new Date(profile.last_calendar_sync)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (lastSync > hourAgo) {
            return NextResponse.json({ synced: false, reason: 'cache_valid', lastSync: profile.last_calendar_sync })
        }
    }

    // Check if token needs refresh
    let accessToken = profile.google_calendar_token
    const tokenExpiresStr = profile.google_calendar_token_expires
    const tokenExpires = tokenExpiresStr ? new Date(tokenExpiresStr) : new Date(0)

    if (tokenExpires < new Date() && profile.google_calendar_refresh_token) {
        const newToken = await refreshAccessToken(profile.google_calendar_refresh_token)
        if (newToken) {
            accessToken = newToken
            await supabase
                .from('profiles')
                .update({
                    google_calendar_token: newToken,
                    google_calendar_token_expires: new Date(Date.now() + 3600 * 1000).toISOString(),
                })
                .eq('id', user.id)
        } else {
            return NextResponse.json({ error: 'Token refresh failed', synced: false }, { status: 401 })
        }
    }

    // Fetch this week's events from selected calendars
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Get user's selected calendars (or fetch all if none selected)
    let calendarIds: string[] = profile.synced_calendar_ids || []

    // If no calendars selected, fetch all available calendars
    if (calendarIds.length === 0) {
        const calendarsResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (calendarsResponse.ok) {
            const calendarsData = await calendarsResponse.json()
            calendarIds = calendarsData.items?.map((cal: { id: string }) => cal.id) || []
        }
    }

    // Collect all events from selected calendars
    interface CalendarEvent {
        id: string
        summary?: string
        start: { dateTime?: string; date?: string }
        end: { dateTime?: string; date?: string }
        htmlLink?: string
        visibility?: string
    }

    const allEvents: CalendarEvent[] = []

    for (const calendarId of calendarIds) {
        try {
            const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
            eventsUrl.searchParams.set('timeMin', today.toISOString())
            eventsUrl.searchParams.set('timeMax', nextWeek.toISOString())
            eventsUrl.searchParams.set('singleEvents', 'true')
            eventsUrl.searchParams.set('orderBy', 'startTime')
            eventsUrl.searchParams.set('maxResults', '100')

            const eventsResponse = await fetch(eventsUrl.toString(), {
                headers: { Authorization: `Bearer ${accessToken}` },
            })

            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json()
                if (eventsData.items) {
                    // Prefix event IDs with calendar ID to ensure uniqueness
                    const prefixedEvents = eventsData.items.map((event: CalendarEvent) => ({
                        ...event,
                        id: `${calendarId}::${event.id}`,
                    }))
                    allEvents.push(...prefixedEvents)
                }
            }
        } catch (err) {
            // Skip calendars that fail (permission issues, etc.)
            console.warn(`Skipping calendar ${calendarId}:`, err)
        }
    }

    // Filter to timed events only (skip all-day events)
    const timedEvents = allEvents.filter(event => event.start?.dateTime)

    // Upsert blocks from calendar events
    console.log('[Calendar Sync] Processing events:', {
        totalEvents: allEvents.length,
        timedEvents: timedEvents.length,
        calendarsChecked: calendarIds.length,
    })

    // Log sample of events for debugging
    timedEvents.slice(0, 5).forEach((event, i) => {
        console.log(`[Calendar Sync] Event ${i + 1}:`, {
            id: event.id,
            summary: event.summary,
            visibility: event.visibility,
            start: event.start?.dateTime,
        })
    })

    let syncedCount = 0
    const errors: string[] = []

    for (const event of timedEvents) {
        // Handle private/busy events gracefully
        const title = event.summary || (event.visibility === 'private' ? 'Busy' : 'Untitled Event')

        // Check if block already exists for this calendar event
        const { data: existing } = await supabase
            .from('blocks')
            .select('id')
            .eq('user_id', user.id)
            .eq('calendar_id', event.id)
            .single()

        let error
        if (existing) {
            // Update existing block
            const result = await supabase
                .from('blocks')
                .update({
                    title,
                    planned_start: event.start.dateTime!,
                    planned_end: event.end.dateTime!,
                    task_link: event.htmlLink || null,
                })
                .eq('id', existing.id)
            error = result.error
        } else {
            // Insert new block
            const result = await supabase
                .from('blocks')
                .insert({
                    user_id: user.id,
                    calendar_id: event.id,
                    title,
                    planned_start: event.start.dateTime!,
                    planned_end: event.end.dateTime!,
                    type: 'focus',
                    task_link: event.htmlLink || null,
                })
            error = result.error
        }

        if (error) {
            errors.push(`${event.id}: ${error.message}`)
            console.error('[Calendar Sync] Upsert error:', error)
        } else {
            syncedCount++
        }
    }

    // Update last sync timestamp
    await supabase
        .from('profiles')
        .update({ last_calendar_sync: new Date().toISOString() })
        .eq('id', user.id)

    console.log('[Calendar Sync] Complete:', {
        synced: syncedCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 3), // Only log first 3 errors
    })

    return NextResponse.json({
        synced: true,
        blockCount: syncedCount,
        totalEvents: timedEvents.length,
        calendarsChecked: calendarIds.length,
        errors: errors.length > 0 ? errors : undefined,
    })
}
