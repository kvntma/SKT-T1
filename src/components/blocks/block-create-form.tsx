'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { type BlockType } from '@/lib/blocks/config'
import { X } from 'lucide-react'

interface NewBlockState {
    title: string
    type: BlockType
    duration: string
    stopCondition: string
    startTime: Date | undefined
    bufferBefore: string
    bufferAfter: string
}

interface BlockCreateFormProps {
    newBlock: NewBlockState
    setNewBlock: (block: NewBlockState) => void
    onSubmit: () => void
    onCancel: () => void
    isSubmitting: boolean
    getDefaultStartTime: () => Date
}

export function BlockCreateForm({
    newBlock,
    setNewBlock,
    onSubmit,
    onCancel,
    isSubmitting,
    getDefaultStartTime,
}: BlockCreateFormProps) {
    return (
        <Card className="mb-6 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader className="relative">
                <button
                    onClick={onCancel}
                    className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
                <CardTitle className="text-lg">Create Block</CardTitle>
                <CardDescription>Schedule a new time block</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    placeholder="Title"
                    className="border-zinc-700 bg-zinc-800/50"
                />
                <DateTimePicker
                    value={newBlock.startTime}
                    onChange={(date) => setNewBlock({ ...newBlock, startTime: date })}
                    minDate={getDefaultStartTime()}
                />
                <div className="flex gap-2">
                    <Select
                        value={newBlock.type}
                        onValueChange={(value: BlockType) => setNewBlock({ ...newBlock, type: value })}
                    >
                        <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                            <SelectItem value="focus">🎯 Focus</SelectItem>
                            <SelectItem value="admin">📋 Admin</SelectItem>
                            <SelectItem value="busy">📅 Busy</SelectItem>
                            <SelectItem value="recovery">🧘 Recovery</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="45">45 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={onSubmit}
                    disabled={!newBlock.title || !newBlock.startTime || isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                    {isSubmitting ? 'Creating...' : 'Create Block'}
                </Button>
            </CardContent>
        </Card>
    )
}
