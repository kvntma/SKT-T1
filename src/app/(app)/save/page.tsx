'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/hooks/useSession'
import { useExecutionStore } from '@/lib/stores/execution-store'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
// Categorized by root cause for LLM pattern analysis
const ABORT_REASONS = [
    // Attention/Focus issues
    { value: 'mind_wandering', label: 'Mind wandering', emoji: '💭', category: 'focus' },
    { value: 'phone_rabbit_hole', label: 'Phone/internet rabbit hole', emoji: '📱', category: 'focus' },
    { value: 'external_interruption', label: 'Someone interrupted me', emoji: '🗣️', category: 'focus' },

    // Blockers
    { value: 'unclear_next_step', label: 'Unclear what to do next', emoji: '🤔', category: 'blocked' },
    { value: 'technical_blocker', label: 'Technical issue/bug', emoji: '🐛', category: 'blocked' },
    { value: 'waiting_on_someone', label: 'Waiting on someone else', emoji: '⏳', category: 'blocked' },
    { value: 'missing_info', label: 'Need more information', emoji: '📋', category: 'blocked' },

    // Energy/Capacity
    { value: 'mental_fatigue', label: 'Mental fatigue', emoji: '🧠', category: 'energy' },
    { value: 'physical_fatigue', label: 'Physical fatigue', emoji: '😴', category: 'energy' },
    { value: 'hunger_thirst', label: 'Hungry/thirsty', emoji: '🍽️', category: 'energy' },
    { value: 'need_break', label: 'Need a break', emoji: '☕', category: 'energy' },

    // Task scoping
    { value: 'task_too_big', label: 'Task too big/vague', emoji: '🏔️', category: 'scoping' },
    { value: 'wrong_task', label: 'Working on wrong thing', emoji: '🔄', category: 'scoping' },

    // External
    { value: 'urgent_interrupt', label: 'Urgent priority came up', emoji: '🚨', category: 'external' },
    { value: 'meeting_call', label: 'Meeting/call', emoji: '📞', category: 'external' },

    // Catch-all
    { value: 'other', label: 'Other (describe below)', emoji: '✏️', category: 'other' },
]

function SavePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const outcome = searchParams.get('outcome') as 'done' | 'aborted' | null
    const sessionId = searchParams.get('sessionId')
    const [resumeToken, setResumeToken] = useState('')
    const [abortReason, setAbortReason] = useState('')
    const [otherReason, setOtherReason] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { endSession } = useSession()
    const { reset } = useExecutionStore()

    const handleSave = async () => {
        setIsSaving(true)

        try {
            if (sessionId && outcome) {
                const finalAbortReason = abortReason === 'other' ? otherReason : abortReason
                await endSession.mutateAsync({
                    sessionId,
                    outcome,
                    abortReason: outcome === 'aborted' ? finalAbortReason : undefined,
                    resumeToken: resumeToken || undefined,
                })
            }

            // Reset the timer state
            reset()

            router.push('/now')
        } catch (error) {
            console.error('Failed to save session:', error)
            setIsSaving(false)
        }
    }

    const isValid = outcome === 'done' || (outcome === 'aborted' && abortReason && (abortReason !== 'other' || otherReason.trim()))

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
                        <CardContent className="space-y-3">
                            <Select value={abortReason} onValueChange={setAbortReason}>
                                <SelectTrigger className="h-12 w-full border-zinc-700 bg-zinc-800/50">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent className="max-h-80 w-full border-zinc-700 bg-zinc-900">
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">Focus Issues</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'focus').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">Blocked</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'blocked').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">Energy</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'energy').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">Task Scoping</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'scoping').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">External</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'external').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-semibold text-zinc-500">Other</SelectLabel>
                                        {ABORT_REASONS.filter(r => r.category === 'other').map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800">
                                                <span className="flex items-center gap-2">
                                                    <span>{reason.emoji}</span>
                                                    <span>{reason.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            {/* Show textbox when 'other' is selected */}
                            {abortReason === 'other' && (
                                <Textarea
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none border-zinc-700 bg-zinc-800/50 placeholder:text-zinc-600"
                                    placeholder="What happened?"
                                    autoFocus
                                />
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Resume Token - Only show after valid reason selected (for aborts) or immediately (for done) */}
                {(outcome === 'done' || (outcome === 'aborted' && abortReason && (abortReason !== 'other' || otherReason.trim()))) && (
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                What&apos;s the next obvious step?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* LLM Suggested Options */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    outcome === 'done'
                                        ? 'Review and refactor the completed work'
                                        : abortReason === 'unclear_next_step' || abortReason === 'task_too_big'
                                            ? 'Break this task into smaller subtasks'
                                            : abortReason === 'technical_blocker' || abortReason === 'missing_info'
                                                ? 'Research the blocker before continuing'
                                                : 'Resume from where I left off',
                                    'Move to a different priority task',
                                    'Schedule a follow-up block',
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setResumeToken(suggestion)}
                                        className={cn(
                                            "rounded-lg px-3 py-2 text-xs font-medium transition-all",
                                            resumeToken === suggestion
                                                ? "bg-white text-black"
                                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ring-1 ring-zinc-700"
                                        )}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Input */}
                            <div className="relative">
                                <Textarea
                                    value={resumeToken}
                                    onChange={(e) => setResumeToken(e.target.value)}
                                    rows={2}
                                    className="resize-none border-zinc-700 bg-zinc-800/50 placeholder:text-zinc-600"
                                    placeholder="Or type your own..."
                                />
                            </div>

                            <p className="text-xs text-zinc-600">
                                💡 This helps you pick up instantly next time.
                            </p>
                        </CardContent>
                    </Card>
                )}

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
                    onClick={handleSave}
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
