'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type BlockType } from '@/lib/blocks/config'
import { toast } from 'sonner'

const BLOCK_CONFIGS = {
    focus: { label: 'Focus', emoji: '🎯', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    admin: { label: 'Admin', emoji: '📋', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    recovery: { label: 'Recovery', emoji: '✨', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    busy: { label: 'Busy', emoji: '📅', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
}

export default function BlockDetailPage() {
    const router = useRouter()
    const params = useParams()
    const blockId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Editable fields
    const [title, setTitle] = useState('Sample Obsidian Task')
    const [type, setType] = useState<BlockType>('focus')
    const [stopCondition, setStopCondition] = useState('')
    const [plannedStart, setPlannedStart] = useState('')
    const [plannedEnd, setPlannedEnd] = useState('')

    useEffect(() => {
        // TODO: Wire up useObsidianTask hook
        const now = new Date()
        const end = new Date(now.getTime() + 25 * 60 * 1000)
        
        setPlannedStart(formatDateTimeLocal(now.toISOString()))
        setPlannedEnd(formatDateTimeLocal(end.toISOString()))
        setIsLoading(false)
    }, [blockId])

    function formatDateTimeLocal(isoString: string): string {
        const date = new Date(isoString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const mins = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${mins}`
    }

    async function handleSave() {
        setIsSaving(true)
        try {
            // TODO: Wire up obsidian write-back logic
            console.log('Saving block updates to Obsidian:', { title, type, plannedStart, plannedEnd })
            await new Promise(resolve => setTimeout(resolve, 500))
            toast.success('Block updated in vault')
            router.push('/blocks')
        } catch (error) {
            toast.error('Failed to save changes')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this task from your vault?')) return
        setIsDeleting(true)
        try {
            // TODO: Wire up obsidian delete logic
            console.log('Deleting task from Obsidian:', blockId)
            await new Promise(resolve => setTimeout(resolve, 500))
            toast.success('Task removed from vault')
            router.push('/blocks')
        } catch (error) {
            toast.error('Failed to delete task')
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
            </div>
        )
    }

    const config = BLOCK_CONFIGS[type as keyof typeof BLOCK_CONFIGS] || BLOCK_CONFIGS.focus
    const plannedDuration = Math.round(
        (new Date(plannedEnd).getTime() - new Date(plannedStart).getTime()) / 60000
    )

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/blocks')}
                        className="text-zinc-500 hover:text-white"
                    >
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Button>
                    <h1 className="text-xl font-bold text-white">Task Details</h1>
                    <div className="w-16" />
                </div>

                {/* Block Header Card */}
                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                                {config.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge className={cn("text-xs font-medium", config.color)}>
                                        {config.label}
                                    </Badge>
                                    <span className="text-sm text-zinc-500">{plannedDuration} min</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <span>✏️</span> Edit Task
                        </CardTitle>
                        <CardDescription>Update task details in your Obsidian vault</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="border-zinc-700 bg-zinc-800/50"
                            />
                        </div>

                        {/* Type & Times Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Type</label>
                                <Select value={type} onValueChange={(v: BlockType) => setType(v)}>
                                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-zinc-700 bg-zinc-900">
                                        <SelectItem value="focus">🎯 Focus</SelectItem>
                                        <SelectItem value="admin">📋 Admin</SelectItem>
                                        <SelectItem value="busy">📅 Busy</SelectItem>
                                        <SelectItem value="recovery">✨ Recovery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={plannedStart}
                                    onChange={(e) => setPlannedStart(e.target.value)}
                                    className="w-full h-9 px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">End Time</label>
                            <input
                                type="datetime-local"
                                value={plannedEnd}
                                onChange={(e) => setPlannedEnd(e.target.value)}
                                className="w-full h-9 px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]"
                            />
                        </div>

                        {/* Stop Condition */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-400">Stop Condition</label>
                            <Input
                                value={stopCondition}
                                onChange={(e) => setStopCondition(e.target.value)}
                                placeholder="e.g., Complete 3 Pomodoros, finish code review"
                                className="border-zinc-700 bg-zinc-800/50"
                            />
                            <p className="mt-1 text-xs text-zinc-600">Define what &quot;done&quot; looks like in your note</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 border-t border-zinc-800 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !title}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Task'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
