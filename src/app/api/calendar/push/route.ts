// Push blocks to Google Calendar
// Creates a dedicated "Push To Start" calendar if it doesn't exist

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const CALENDAR_NAME = 'Push To Start'
const CALENDAR_COLOR = '#10B981' // Emerald green

interface GoogleCalendar {
    id: string
    summary: string
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

async function getOrCreatePushCalendar(accessToken: string): Promise<string | null> {
    // First, check if calendar already exists
    const listResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!listResponse.ok) {
        console.error('Failed to list calendars:', await listResponse.text())
        return null
    }

    const listData = await listResponse.json()
    const existing = listData.items?.find((cal: GoogleCalendar) => cal.summary === CALENDAR_NAME)

    if (existing) {
        console.log('[Push] Found existing Push To Start calendar:', existing.id)
        return existing.id
    }

    // Create new calendar
    const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summary: CALENDAR_NAME,
                description: 'Time blocks managed by Push To Start (pushtostart.gg)',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
        }
    )

    if (!createResponse.ok) {
        console.error('Failed to create calendar:', await createResponse.text())
        return null
    }

    const newCalendar = await createResponse.json()
    console.log('[Push] Created new Push To Start calendar:', newCalendar.id)

    // Set calendar color (optional, may fail for some users)
    try {
        await fetch(
            `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(newCalendar.id)}`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    backgroundColor: CALENDAR_COLOR,
                    foregroundColor: '#ffffff',
                }),
            }
        )
    } catch {
        // Color setting is optional
    }

    return newCalendar.id
}

interface Block {
    id: string
    title: string
    type: string
    planned_start: string
    planned_end: string
    user_id: string
    stop_condition?: string | null
    google_event_id?: string | null
    linear_issue_id?: string | null
    task_link?: string | null
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's calendar tokens
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expires, push_calendar_id')
        .eq('id', user.id)
        .single()

    if (!profile?.google_calendar_token) {
        return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 })
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
            return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }
    }

    // Get or create the Push To Start calendar
    let calendarId = profile.push_calendar_id
    if (!calendarId) {
        calendarId = await getOrCreatePushCalendar(accessToken)
        if (!calendarId) {
            return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 })
        }
        // Store the calendar ID
        await supabase
            .from('profiles')
            .update({ push_calendar_id: calendarId })
            .eq('id', user.id)
    }

    // Get blocks to push (manual blocks only, not calendar-synced ones)
    // Also include today's and future blocks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: blocks, error: blocksError } = await supabase
        .from('blocks')
        .select('id, title, type, planned_start, planned_end, user_id, stop_condition, google_event_id, linear_issue_id, task_link')
        .eq('user_id', user.id)
        .is('calendar_id', null)  // Only manual blocks (not synced from calendar)
        .gte('planned_start', today.toISOString())
        .order('planned_start', { ascending: true })

    if (blocksError) {
        console.error('Failed to fetch blocks:', blocksError)
        return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 })
    }

    // Push each block to Google Calendar
    let pushedCount = 0
    let updatedCount = 0
    const errors: string[] = []
    const blocksToUpdate: Block[] = []

    for (const block of (blocks as unknown as Block[])) {
        // ... (existing description logic)
        const descriptionParts: string[] = []
        if (block.stop_condition) descriptionParts.push(`🎯 Stop condition: ${block.stop_condition}`)
        const links: string[] = []
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pushtostart.gg'
        links.push(`📱 Open in app: ${siteUrl}/blocks`)
        if (block.linear_issue_id) links.push(`📐 Linear: https://linear.app/issue/${block.linear_issue_id}`)
        if (block.task_link) links.push(`🔗 Link: ${block.task_link}`)
        if (links.length > 0) {
            descriptionParts.push('')
            descriptionParts.push('━━━━━━━━━━━━━━━━━━━━')
            descriptionParts.push(...links)
        }
        descriptionParts.push('')
        descriptionParts.push('Managed by Push To Start')

        const eventData = {
            summary: `${getBlockEmoji(block.type)} ${block.title}`,
            description: descriptionParts.join('\n'),
            start: {
                dateTime: block.planned_start,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: block.planned_end,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            colorId: getBlockColorId(block.type),
        }

        try {
            let response: Response
            if (block.google_event_id) {
                response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(block.google_event_id)}`,
                    {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventData),
                    }
                )
            } else {
                response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventData),
                    }
                )
            }

            if (response.ok) {
                const event = await response.json()
                if (!block.google_event_id) {
                    blocksToUpdate.push({ ...block, google_event_id: event.id })
                    pushedCount++
                } else {
                    updatedCount++
                }
            } else {
                const errorText = await response.text()
                errors.push(`${block.title}: ${errorText}`)
            }
        } catch (err) {
            errors.push(`${block.title}: ${err}`)
        }
    }

    // Bulk update blocks with new Google Event IDs
    if (blocksToUpdate.length > 0) {
        const { error: bulkError } = await supabase
            .from('blocks')
            .upsert(blocksToUpdate, { onConflict: 'id' })
        
        if (bulkError) {
            console.error('[Push] Bulk update error:', bulkError)
            errors.push(`Database update failed: ${bulkError.message}`)
        }
    }

    console.log('[Push] Complete:', { pushedCount, updatedCount, errors: errors.length })

    return NextResponse.json({
        success: true,
        calendarId,
        pushed: pushedCount,
        updated: updatedCount,
        total: blocks?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
    })
}

function getBlockEmoji(type: string): string {
    const emojis: Record<string, string> = {
        focus: '🎯',
        admin: '📋',
        recovery: '✨',
        busy: '📅',
    }
    return emojis[type] || '⚡'
}

function getBlockColorId(type: string): string {
    // Google Calendar color IDs (1-11)
    // https://developers.google.com/calendar/api/v3/reference/colors/get
    const colors: Record<string, string> = {
        focus: '9',     // Bold Blue
        admin: '5',     // Yellow
        recovery: '2',  // Green
        busy: '8',      // Gray
    }
    return colors[type] || '9'
}
