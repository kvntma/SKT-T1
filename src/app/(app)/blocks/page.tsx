'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Placeholder blocks for demo
const DEMO_BLOCKS = [
    {
        id: '1',
        title: 'Deep Work: Auth Module',
        type: 'focus',
        planned_start: new Date().toISOString(),
        planned_end: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
        stop_condition: 'Complete login skeleton',
    },
    {
        id: '2',
        title: 'Email & Slack Review',
        type: 'admin',
        planned_start: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        planned_end: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        title: 'Walk Break',
        type: 'recovery',
        planned_start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        planned_end: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
    },
]

function getBlockTypeColor(type: string): string {
    switch (type) {
        case 'focus': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        case 'admin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'recovery': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
}

function getBlockTypeEmoji(type: string): string {
    switch (type) {
        case 'focus': return '🎯'
        case 'admin': return '📋'
        case 'recovery': return '🧘'
        default: return '⚡'
    }
}

function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

export default function BlocksPage() {
    const [showCreate, setShowCreate] = useState(false)
    const [newBlock, setNewBlock] = useState({
        title: '',
        type: 'focus',
        duration: '25',
        stopCondition: '',
    })

    const handleCreate = () => {
        console.log('Creating block:', newBlock)
        setShowCreate(false)
        setNewBlock({ title: '', type: 'focus', duration: '25', stopCondition: '' })
    }

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blocks</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Manage your time blocks
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-white text-black hover:bg-zinc-200"
                    >
                        {showCreate ? 'Cancel' : '+ New Block'}
                    </Button>
                </div>

                {/* Create Block Form */}
                {showCreate && (
                    <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Create Block</CardTitle>
                            <CardDescription>
                                Schedule a new time block
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">
                                    Title
                                </label>
                                <Input
                                    value={newBlock.title}
                                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                                    placeholder="Deep Work: Feature X"
                                    className="border-zinc-700 bg-zinc-800/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">
                                        Type
                                    </label>
                                    <Select
                                        value={newBlock.type}
                                        onValueChange={(value) => setNewBlock({ ...newBlock, type: value })}
                                    >
                                        <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-zinc-700 bg-zinc-900">
                                            <SelectItem value="focus">🎯 Focus</SelectItem>
                                            <SelectItem value="admin">📋 Admin</SelectItem>
                                            <SelectItem value="recovery">🧘 Recovery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-400">
                                        Duration
                                    </label>
                                    <Select
                                        value={newBlock.duration}
                                        onValueChange={(value) => setNewBlock({ ...newBlock, duration: value })}
                                    >
                                        <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-zinc-700 bg-zinc-900">
                                            <SelectItem value="15">15 min</SelectItem>
                                            <SelectItem value="25">25 min</SelectItem>
                                            <SelectItem value="45">45 min</SelectItem>
                                            <SelectItem value="60">60 min</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-400">
                                    Stop Condition (optional)
                                </label>
                                <Textarea
                                    value={newBlock.stopCondition}
                                    onChange={(e) => setNewBlock({ ...newBlock, stopCondition: e.target.value })}
                                    placeholder="What signals completion?"
                                    rows={2}
                                    className="resize-none border-zinc-700 bg-zinc-800/50"
                                />
                            </div>

                            <Button
                                onClick={handleCreate}
                                disabled={!newBlock.title}
                                className="w-full bg-emerald-600 hover:bg-emerald-500"
                            >
                                Create Block
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Block List */}
                <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Today&apos;s Blocks
                    </p>

                    {DEMO_BLOCKS.map((block) => (
                        <Card
                            key={block.id}
                            className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-colors hover:border-zinc-700"
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-lg">
                                    {getBlockTypeEmoji(block.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-white">{block.title}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${getBlockTypeColor(block.type)}`}
                                        >
                                            {block.type}
                                        </Badge>
                                        <span className="text-xs text-zinc-500">
                                            {formatTime(block.planned_start)} - {formatTime(block.planned_end)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-center">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white" asChild>
                        <a href="/now">← Back to Now</a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
