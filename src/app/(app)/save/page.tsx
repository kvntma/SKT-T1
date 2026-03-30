'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { useExecutionStore } from '@/lib/stores/execution-store'
import { cn } from '@/lib/utils'

function SavePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const outcome = searchParams.get('outcome') as 'done' | 'aborted' | null
    const sessionId = searchParams.get('sessionId')
    const [resumeToken, setResumeToken] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { reset } = useExecutionStore()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    
    // TODO: Wire up useObsidianTask hook to fetch title
    const [editedTitle, setEditedTitle] = useState('Current Task Title')

    const handleSave = async () => {
        setIsSaving(true)

        try {
            // TODO: Wire up obsidian write-back utility
            // 1. Mark task as [x] in markdown
            // 2. Append resume token as sub-bullet
            // 3. Log session duration
            
            console.log('Saving to Obsidian:', {
                title: editedTitle,
                outcome,
                resumeToken
            })

            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Reset the timer state
            reset()

            router.push('/now')
        } catch (error) {
            console.error('Failed to save session:', error)
            setIsSaving(false)
        }
    }

    return (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
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
                            {outcome === 'done' ? <CheckCircle2 className="h-10 w-10 text-emerald-500" /> : <XCircle className="h-10 w-10 text-amber-500" />}
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            {outcome === 'done' ? 'Task Completed' : 'Task Stopped'}
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 text-center">
                            {outcome === 'done'
                                ? 'Great work! This will be marked as done in your vault.'
                                : 'No worries. Let\'s capture what happened.'}
                        </p>

                        {/* Editable Block Title */}
                        <div className="mt-6 w-full">
                            {isEditingTitle ? (
                                <Input
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="h-10 text-center text-lg font-medium bg-zinc-800 border-zinc-700"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') setIsEditingTitle(false)
                                    }}
                                    onBlur={() => setIsEditingTitle(false)}
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditingTitle(true)}
                                    className="group relative flex w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-zinc-800/30 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/50"
                                >
                                    <span className="text-lg font-medium text-white">
                                        {editedTitle}
                                    </span>
                                    <Pencil className="absolute right-4 h-4 w-4 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            )}
                            <p className="mt-2 text-xs text-zinc-500 text-center">
                                Tap to refine task name for your vault
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Resume Token */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            What&apos;s the next obvious step?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            value={resumeToken}
                            onChange={(e) => setResumeToken(e.target.value)}
                            rows={3}
                            className="resize-none border-zinc-700 bg-zinc-800/50 placeholder:text-zinc-600"
                            placeholder="Type the exact next step to reduce friction next time..."
                        />
                        <p className="text-xs text-zinc-600">
                            💡 This will be appended as a sub-bullet in your Obsidian note.
                        </p>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="h-14 w-full bg-white text-lg font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            UPDATING VAULT...
                        </span>
                    ) : (
                        'SAVE TO OBSIDIAN'
                    )}
                </Button>

                {/* Skip option */}
                <Button
                    variant="ghost"
                    className="w-full text-zinc-500 hover:text-white"
                    onClick={() => router.push('/now')}
                >
                    Discard Session
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
