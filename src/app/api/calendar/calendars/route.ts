// List user's Google Calendars

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GoogleCalendar {
    id: string
    summary: string
    summaryOverride?: string  // User's custom name for the calendar
    description?: string
    primary?: boolean
    backgroundColor?: string
    accessRole: string
}

interface GoogleCalendarListResponse {
    items: GoogleCalendar[]
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's calendar token
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token')
        .eq('id', user.id)
        .single()

    if (!profile?.google_calendar_token) {
        return NextResponse.json({ error: 'Calendar not connected', connected: false }, { status: 400 })
    }

    // Fetch calendar list
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${profile.google_calendar_token}` },
    })

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 })
    }

    const data: GoogleCalendarListResponse = await response.json()

    const calendars = data.items.map(cal => {
        // Use summaryOverride (user's custom name) > summary > description > fallback
        let name = cal.summaryOverride || cal.summary

        // If name is generic "Calendar", try to use description or ID
        if (name === 'Calendar' || !name) {
            name = cal.description || cal.id.split('@')[0] || 'Untitled Calendar'
        }

        return {
            id: cal.id,
            name,
            primary: cal.primary || false,
            color: cal.backgroundColor,
            accessRole: cal.accessRole, // e.g., "reader", "freeBusyReader", "owner"
        }
    })

    return NextResponse.json({
        connected: true,
        calendars,
    })
}
