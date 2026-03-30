// List user's Google Calendar events
// Fetches events from the selected calendar (or primary)

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
    nextPageToken?: string
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

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's calendar tokens
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expires, selected_calendar_id')
        .eq('id', user.id)
        .single()

    if (!profile?.google_calendar_token) {
        return NextResponse.json({ error: 'Calendar not connected', connected: false }, { status: 400 })
    }

    // Check if token needs refresh
    let accessToken = profile.google_calendar_token
    const tokenExpiresStr = profile.google_calendar_token_expires
    const tokenExpires = tokenExpiresStr ? new Date(tokenExpiresStr) : new Date(0)

    if (tokenExpires < new Date() && profile.google_calendar_refresh_token) {
        const newToken = await refreshAccessToken(profile.google_calendar_refresh_token)
        if (newToken) {
            accessToken = newToken
            // Update token in database
            await supabase
                .from('profiles')
                .update({
                    google_calendar_token: newToken,
                    google_calendar_token_expires: new Date(Date.now() + 3600 * 1000).toISOString(),
                })
                .eq('id', user.id)
        } else {
            return NextResponse.json({ error: 'Token refresh failed', connected: false }, { status: 401 })
        }
    }

    // Fetch events from Google Calendar
    const calendarId = profile.selected_calendar_id || 'primary'
    const searchParams = request.nextUrl.searchParams
    const timeMin = searchParams.get('timeMin') || new Date().toISOString()
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
    eventsUrl.searchParams.set('timeMin', timeMin)
    eventsUrl.searchParams.set('timeMax', timeMax)
    eventsUrl.searchParams.set('singleEvents', 'true')
    eventsUrl.searchParams.set('orderBy', 'startTime')
    eventsUrl.searchParams.set('maxResults', '50')

    const eventsResponse = await fetch(eventsUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json()
        console.error('Failed to fetch events:', errorData)
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const eventsData: GoogleCalendarEventsResponse = await eventsResponse.json()

    // Transform to our block format
    const blocks = eventsData.items
        .filter(event => event.start?.dateTime) // Only timed events, not all-day
        .map(event => ({
            google_id: event.id,
            title: event.summary || 'Untitled Event',
            planned_start: event.start.dateTime,
            planned_end: event.end.dateTime,
            description: event.description,
            calendar_link: event.htmlLink,
            type: 'focus' as const, // Default type
        }))

    return NextResponse.json({
        connected: true,
        calendarId,
        events: blocks,
    })
}
