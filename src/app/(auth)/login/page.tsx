import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect('/now')
    }

    const params = await searchParams
    const message = params.message
    const error = params.error

    return (
        <div className="relative flex min-h-screen items-center justify-center px-6">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/40 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-2xl">
                        ⚡
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Push To Start
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Execute. No negotiation.
                    </p>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl text-white">Welcome back</CardTitle>
                        <CardDescription>
                            Sign in with a magic link
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-center text-sm text-emerald-400 ring-1 ring-emerald-500/20">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400 ring-1 ring-red-500/20">
                                {error}
                            </div>
                        )}

                        <form action="/auth/login" method="POST" className="space-y-4">
                            <div>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="you@example.com"
                                    className="h-12 border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="h-12 w-full bg-white text-base font-semibold text-black hover:bg-zinc-200"
                            >
                                Send magic link
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-xs text-zinc-600">
                    A secure login link will be sent to your email.
                    <br />
                    No password required.
                </p>
            </div>
        </div>
    )
}
