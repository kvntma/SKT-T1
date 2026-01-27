// Google Calendar OAuth handler
// Uses Google OAuth directly (not Supabase) to get Calendar API access

import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`
    : 'http://localhost:3000/api/calendar/callback'

// Scopes needed for calendar read access
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
].join(' ')

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'connect') {
        // Redirect to Google OAuth
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
        authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', SCOPES)
        authUrl.searchParams.set('access_type', 'offline') // Get refresh token
        authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token

        return NextResponse.redirect(authUrl.toString())
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
