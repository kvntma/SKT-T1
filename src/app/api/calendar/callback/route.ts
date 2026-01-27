// Google Calendar OAuth callback handler
// Exchanges auth code for tokens and stores them

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`
    : 'http://localhost:3000/api/calendar/callback'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/blocks?error=calendar_denied', request.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/blocks?error=no_code', request.url))
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            console.error('Token exchange failed:', errorData)
            return NextResponse.redirect(new URL('/blocks?error=token_exchange', request.url))
        }

        const tokens = await tokenResponse.json()

        // Get current user
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
        }

        // Store tokens in user metadata or a separate table
        // For MVP, we'll store in profiles table (you may want a separate calendar_connections table later)
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                google_calendar_token: tokens.access_token,
                google_calendar_refresh_token: tokens.refresh_token,
                google_calendar_token_expires: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                google_calendar_connected: true,
            }, { onConflict: 'id' })

        if (updateError) {
            console.error('Failed to store tokens:', updateError)
            // Continue anyway - tokens are valid, just not persisted
        }

        return NextResponse.redirect(new URL('/blocks?success=calendar_connected', request.url))
    } catch (err) {
        console.error('Calendar callback error:', err)
        return NextResponse.redirect(new URL('/blocks?error=unknown', request.url))
    }
}
