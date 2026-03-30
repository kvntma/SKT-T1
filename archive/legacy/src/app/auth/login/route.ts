import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    const formData = await request.formData()
    const email = formData.get('email') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
    })

    if (error) {
        redirect('/login?error=Could not send magic link')
    }

    redirect('/login?message=Check your email for the magic link')
}
