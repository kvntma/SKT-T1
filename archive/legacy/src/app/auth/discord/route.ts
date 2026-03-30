import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
    })

    if (error) {
        redirect('/login?error=Could not authenticate with Discord')
    }

    if (data.url) {
        redirect(data.url)
    }

    redirect('/login?error=Could not authenticate with Discord')
}
