'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SavePageContent() {
    const searchParams = useSearchParams()
    const outcome = searchParams.get('outcome') as 'done' | 'aborted' | null
    const [resumeToken, setResumeToken] = useState('')
    const [abortReason, setAbortReason] = useState('')

    const handleSave = () => {
        // TODO: Save session with resume token
        console.log('Saving session:', { outcome, resumeToken, abortReason })
        window.location.href = '/now'
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Status */}
                <div className="text-center">
                    <div className="mb-2 text-5xl">
                        {outcome === 'done' ? '✅' : '⏹️'}
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {outcome === 'done' ? 'Block Completed' : 'Block Stopped'}
                    </h1>
                </div>

                {/* Abort Reason (if stopped) */}
                {outcome === 'aborted' && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-400">
                            Why did you stop?
                        </label>
                        <select
                            value={abortReason}
                            onChange={(e) => setAbortReason(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        >
                            <option value="">Select a reason</option>
                            <option value="distraction">Got distracted</option>
                            <option value="blocked">Blocked on something</option>
                            <option value="energy">Low energy</option>
                            <option value="priority">Higher priority came up</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                )}

                {/* Resume Token */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-400">
                        What&apos;s the next obvious step?
                    </label>
                    <textarea
                        value={resumeToken}
                        onChange={(e) => setResumeToken(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        placeholder="Wire submit handler to auth API..."
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={outcome === 'aborted' && !abortReason}
                    className="w-full rounded-lg bg-white px-4 py-4 text-lg font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    SAVE & RETURN
                </button>
            </div>
        </div>
    )
}

export default function SavePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-500">Loading...</div>}>
            <SavePageContent />
        </Suspense>
    )
}
