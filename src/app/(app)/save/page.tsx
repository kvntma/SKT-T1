'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const ABORT_REASONS = [
    { value: 'distraction', label: 'Got distracted', emoji: '🌀' },
    { value: 'blocked', label: 'Blocked on something', emoji: '🚧' },
    { value: 'energy', label: 'Low energy', emoji: '🔋' },
    { value: 'priority', label: 'Higher priority came up', emoji: '🚨' },
    { value: 'other', label: 'Other', emoji: '❓' },
]

function SavePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const outcome = searchParams.get('outcome') as 'done' | 'aborted' | null
    const [resumeToken, setResumeToken] = useState('')
    const [abortReason, setAbortReason] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        // TODO: Save session with resume token to Supabase
        console.log('Saving session:', { outcome, resumeToken, abortReason })

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 500))

        router.push('/now')
    }

    const isValid = outcome === 'done' || (outcome === 'aborted' && abortReason)

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className={`absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${outcome === 'done' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                        }`}
                />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-6">
                {/* Status Card */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="flex flex-col items-center py-8">
                        <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-5xl ${outcome === 'done'
                                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                                : 'bg-amber-500/10 ring-1 ring-amber-500/20'
                            }`}>
                            {outcome === 'done' ? '✅' : '⏹️'}
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            {outcome === 'done' ? 'Block Completed' : 'Block Stopped'}
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            {outcome === 'done'
                                ? 'Great work! Save your progress.'
                                : 'No worries. Capture what happened.'}
                        </p>
                    </CardContent>
                </Card>

                {/* Abort Reason (if stopped) */}
                {outcome === 'aborted' && (
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Why did you stop?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={abortReason} onValueChange={setAbortReason}>
                                <SelectTrigger className="h-12 border-zinc-700 bg-zinc-800/50">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent className="border-zinc-700 bg-zinc-900">
                                    {ABORT_REASONS.map((reason) => (
                                        <SelectItem
                                            key={reason.value}
                                            value={reason.value}
                                            className="focus:bg-zinc-800"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{reason.emoji}</span>
                                                <span>{reason.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                )}

                {/* Resume Token */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            What&apos;s the next obvious step?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={resumeToken}
                            onChange={(e) => setResumeToken(e.target.value)}
                            rows={3}
                            className="resize-none border-zinc-700 bg-zinc-800/50 placeholder:text-zinc-600"
                            placeholder="Wire submit handler to auth API..."
                        />
                        <p className="mt-2 text-xs text-zinc-600">
                            This helps you pick up instantly next time.
                        </p>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={!isValid || isSaving}
                    size="lg"
                    className="h-14 w-full bg-white text-lg font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            Saving...
                        </span>
                    ) : (
                        'SAVE & RETURN'
                    )}
                </Button>

                {/* Skip option */}
                <Button
                    variant="ghost"
                    className="w-full text-zinc-500 hover:text-white"
                    onClick={() => router.push('/now')}
                >
                    Skip for now
                </Button>
            </div>
        </div>
    )
}

export default function SavePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
                </div>
            }
        >
            <SavePageContent />
        </Suspense>
    )
}
