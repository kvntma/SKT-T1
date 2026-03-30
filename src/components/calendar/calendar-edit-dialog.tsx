'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { type DisplayBlock } from '@/lib/blocks/utils'

interface CalendarEditDialogProps {
    block: DisplayBlock | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (id: string, updates: { title?: string; planned_start?: string; planned_end?: string }) => void
}

export function CalendarEditDialog({ block, open, onOpenChange, onSave }: CalendarEditDialogProps) {
    const [editForm, setEditForm] = useState({ title: '', start: '', end: '' })

    // Sync form when block changes
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && block) {
            setEditForm({
                title: block.title,
                start: new Date(block.planned_start).toTimeString().slice(0, 5),
                end: new Date(block.planned_end).toTimeString().slice(0, 5),
            })
        }
        onOpenChange(isOpen)
    }

    const handleSave = () => {
        if (!block) return

        const [startH, startM] = editForm.start.split(':').map(Number)
        const [endH, endM] = editForm.end.split(':').map(Number)

        const newStart = new Date(block.planned_start)
        newStart.setHours(startH, startM)

        const newEnd = new Date(block.planned_end)
        newEnd.setHours(endH, endM)

        if (newEnd < newStart) {
            toast.error('End time must be after start time')
            return
        }

        onSave(block.id, {
            title: editForm.title,
            planned_start: newStart.toISOString(),
            planned_end: newEnd.toISOString(),
        })

        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Block</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Make changes to your block here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-title" className="text-right text-zinc-300">Title</Label>
                        <Input
                            id="edit-title"
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-start" className="text-right text-zinc-300">Start</Label>
                        <Input
                            id="edit-start"
                            type="time"
                            value={editForm.start}
                            onChange={(e) => setEditForm(prev => ({ ...prev, start: e.target.value }))}
                            className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-end" className="text-right text-zinc-300">End</Label>
                        <Input
                            id="edit-end"
                            type="time"
                            value={editForm.end}
                            onChange={(e) => setEditForm(prev => ({ ...prev, end: e.target.value }))}
                            className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 hover:bg-zinc-800 text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
