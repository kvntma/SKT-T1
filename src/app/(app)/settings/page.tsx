'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useCalendar } from '@/lib/hooks/useCalendar'
import { useBlockColorPreferences, BLOCK_COLORS, type BlockColor, getBlockColorClass } from '@/lib/hooks/useBlockColorPreferences'
import { useRoutines, type Routine } from '@/lib/hooks/useRoutines'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Lock, Unlock, Clock, Calendar as CalendarIcon } from 'lucide-react'

// Color swatch component
function ColorSwatch({
    color,
    isSelected,
    onClick
}: {
    color: typeof BLOCK_COLORS[number]
    isSelected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "h-8 w-8 rounded-md transition-all duration-150",
                color.class,
                isSelected
                    ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                    : "hover:scale-105 hover:ring-1 hover:ring-zinc-500"
            )}
            title={color.label}
        />
    )
}

// Block preview component
function BlockPreview({
    label,
    colorClass
}: {
    label: string
    colorClass: string
}) {
    return (
        <div className={cn(
            "flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3",
            "border-l-4",
            colorClass
        )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-700/50 text-sm">
                🎯
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500">Sample block preview</p>
            </div>
        </div>
    )
}


// Appearance Section Component
function AppearanceSection() {
    const { preferences, isLoading, updatePreferences } = useBlockColorPreferences()

    const handleColorChange = (colorValue: BlockColor) => {
        updatePreferences.mutate({ manualBlockColor: colorValue })
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <span>🎨</span> Appearance
                </CardTitle>
                <CardDescription>Customize how blocks are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Manual Block Color */}
                <div className="space-y-3">
                    <div>
                        <p className="font-medium text-white">Push To Start Blocks</p>
                        <p className="text-sm text-zinc-500">
                            Color for manually created blocks
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {BLOCK_COLORS.map((color) => (
                            <ColorSwatch
                                key={color.value}
                                color={color}
                                isSelected={preferences.manualBlockColor === color.value}
                                onClick={() => handleColorChange(color.value)}
                            />
                        ))}
                    </div>
                    <BlockPreview
                        label="Push To Start Block"
                        colorClass={getBlockColorClass(preferences.manualBlockColor)}
                    />
                </div>

                <div className="border-t border-zinc-800" />

                {/* Calendar Blocks Info */}
                <div className="space-y-2">
                    <p className="font-medium text-white">Calendar Blocks</p>
                    <p className="text-sm text-zinc-500">
                        Calendar-synced blocks automatically use their original calendar color from Google Calendar.
                    </p>
                </div>

                {isLoading && (
                    <p className="text-xs text-zinc-500 text-center">Loading preferences...</p>
                )}
                {updatePreferences.isPending && (
                    <p className="text-xs text-emerald-400 text-center">Saving...</p>
                )}
            </CardContent>
        </Card>
    )
}


// Routines Section Component
function RoutinesSection() {
    const { routines, createRoutine, updateRoutine, deleteRoutine, isLoading } = useRoutines()
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        type: 'focus' as any,
        start_time: '08:00',
        duration_minutes: 30,
        recurrence: { days: [1, 2, 3, 4, 5] }, // Mon-Fri
        is_hard_non_negotiable: false
    })

    const DAYS = [
        { id: 1, label: 'M' },
        { id: 2, label: 'T' },
        { id: 3, label: 'W' },
        { id: 4, label: 'T' },
        { id: 5, label: 'F' },
        { id: 6, label: 'S' },
        { id: 7, label: 'S' },
    ]

    const handleCreate = async () => {
        if (!formData.title) return
        await createRoutine.mutateAsync(formData)
        setIsAdding(false)
        resetForm()
    }

    const handleUpdate = async () => {
        if (!editingId || !formData.title) return
        await updateRoutine.mutateAsync({ id: editingId, ...formData })
        setEditingId(null)
        resetForm()
    }

    const resetForm = () => {
        setFormData({
            title: '',
            type: 'focus',
            start_time: '08:00',
            duration_minutes: 30,
            recurrence: { days: [1, 2, 3, 4, 5] },
            is_hard_non_negotiable: false
        })
    }

    const startEditing = (routine: Routine) => {
        setEditingId(routine.id)
        setFormData({
            title: routine.title,
            type: routine.type as any,
            start_time: routine.start_time.slice(0, 5),
            duration_minutes: routine.duration_minutes,
            recurrence: routine.recurrence as { days: number[] },
            is_hard_non_negotiable: routine.is_hard_non_negotiable || false
        })
        setIsAdding(false)
    }

    const toggleDay = (dayId: number) => {
        const days = [...formData.recurrence.days]
        const index = days.indexOf(dayId)
        if (index > -1) {
            days.splice(index, 1)
        } else {
            days.push(dayId)
        }
        setFormData({ ...formData, recurrence: { days: days.sort() } })
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <span>🔄</span> Routines
                    </CardTitle>
                    <CardDescription>Recurring non-negotiable blocks</CardDescription>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        if (isAdding || editingId) {
                            setIsAdding(false)
                            setEditingId(null)
                            resetForm()
                        } else {
                            setIsAdding(true)
                        }
                    }}
                    className="border-zinc-700 bg-zinc-800/50"
                >
                    {isAdding || editingId ? 'Cancel' : <><Plus className="mr-1 h-4 w-4" /> Add</>}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isAdding || editingId) && (
                    <div className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid gap-3">
                            <Input
                                placeholder="Routine Title (e.g., Morning Deep Work)"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="border-zinc-700 bg-zinc-900/50"
                            />
                            <div className="flex gap-2">
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="border-zinc-700 bg-zinc-900/50"
                                />
                                <Select
                                    value={formData.duration_minutes.toString()}
                                    onValueChange={(val) => setFormData({ ...formData, duration_minutes: parseInt(val) })}
                                >
                                    <SelectTrigger className="border-zinc-700 bg-zinc-900/50">
                                        <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700">
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="45">45 min</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                        <SelectItem value="120">2 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-zinc-500">RECURRENCE</label>
                                <div className="flex gap-1.5">
                                    {DAYS.map((day) => (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={cn(
                                                "h-8 w-8 rounded-md text-xs font-bold transition-all",
                                                formData.recurrence.days.includes(day.id)
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md border border-zinc-700/50 bg-zinc-900/30 p-2">
                                <div className="flex items-center gap-2">
                                    {formData.is_hard_non_negotiable ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5 text-zinc-500" />}
                                    <span className="text-sm text-zinc-300">Hard Non-negotiable</span>
                                </div>
                                <Switch
                                    checked={formData.is_hard_non_negotiable}
                                    onCheckedChange={(val) => setFormData({ ...formData, is_hard_non_negotiable: val })}
                                />
                            </div>

                            <Button 
                                onClick={editingId ? handleUpdate : handleCreate} 
                                disabled={!formData.title || createRoutine.isPending || updateRoutine.isPending}
                                className="w-full bg-emerald-600 hover:bg-emerald-500"
                            >
                                {createRoutine.isPending || updateRoutine.isPending ? 'Saving...' : editingId ? 'Update Routine' : 'Save Routine'}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {routines.length === 0 && !isLoading && !isAdding && !editingId && (
                        <p className="py-8 text-center text-sm text-zinc-600 italic">
                            No routines defined yet.
                        </p>
                    )}
                    {routines.map((routine) => (
                        <div 
                            key={routine.id}
                            className={cn(
                                "group flex items-center justify-between rounded-lg border p-3 transition-colors",
                                editingId === routine.id 
                                    ? "border-emerald-500/50 bg-emerald-500/5" 
                                    : "border-zinc-800/50 bg-zinc-800/20 hover:border-zinc-700 hover:bg-zinc-800/40"
                            )}
                        >
                            <div className="min-w-0 flex-1" onClick={() => startEditing(routine)} role="button">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{routine.title}</span>
                                    {routine.is_hard_non_negotiable && (
                                        <Badge variant="outline" className="h-4 px-1 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-500">
                                            HARD
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {routine.start_time.slice(0, 5)} ({routine.duration_minutes}m)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {(routine.recurrence as any).days.map((d: number) => DAYS.find(day => day.id === d)?.label).join('')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateRoutine.mutate({ 
                                        id: routine.id, 
                                        is_hard_non_negotiable: !routine.is_hard_non_negotiable 
                                    })}
                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                                >
                                    {routine.is_hard_non_negotiable ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm('Delete this routine? This won\'t remove existing blocks.')) {
                                            deleteRoutine.mutate(routine.id)
                                        }
                                    }}
                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const router = useRouter()
    const { isConnected, connectCalendar, isLoadingCalendars } = useCalendar()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/now')}
                            className="text-zinc-500 hover:text-white"
                        >
                            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>

                <div className="space-y-4">
                    {/* Profile Section */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>👤</span> Profile
                            </CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Signed in</p>
                                    <p className="text-sm text-zinc-500">via Discord</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                >
                                    {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google Calendar */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>📅</span> Google Calendar
                            </CardTitle>
                            <CardDescription>Sync your calendar events as blocks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Google Calendar</p>
                                        <p className="text-sm text-zinc-500">
                                            {isConnected ? 'Connected' : 'Not connected'}
                                        </p>
                                    </div>
                                </div>
                                {isConnected ? (
                                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                        ✓ Connected
                                    </Badge>
                                ) : (
                                    <Button
                                        onClick={connectCalendar}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-500"
                                        disabled={isLoadingCalendars}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>
                            {isConnected && (
                                <>
                                    <p className="mt-3 text-xs text-zinc-600">
                                        Manage which calendars to sync from the Blocks page.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                                        {/* Push Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('/api/calendar/push', { method: 'POST' })
                                                    const data = await response.json()
                                                    if (data.success) {
                                                        alert(`✅ Pushed ${data.pushed} new blocks, updated ${data.updated} blocks to Google Calendar!`)
                                                    } else if (data.error === 'Calendar not connected') {
                                                        alert('❌ Calendar not connected.\n\nPlease connect your Google Calendar first.')
                                                    } else if (response.status === 401 || data.error?.includes('Token') || data.error?.includes('scope')) {
                                                        alert('❌ Calendar permissions need to be updated.\n\nPlease disconnect and reconnect your Google Calendar to grant write permissions.\n\nGo to Google Account → Security → Third-party apps → Remove "Push To Start", then reconnect here.')
                                                    } else {
                                                        alert(`❌ Failed to push: ${data.error}\n\nIf this persists, try disconnecting and reconnecting your Google Calendar.`)
                                                    }
                                                } catch {
                                                    alert('❌ Failed to push blocks to calendar.\n\nPlease try disconnecting and reconnecting your Google Calendar.')
                                                }
                                            }}
                                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                        >
                                            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Push Blocks
                                        </Button>

                                        {/* Reconnect Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={connectCalendar}
                                            className="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                        >
                                            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Reconnect
                                        </Button>

                                        {/* Disconnect Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to disconnect Google Calendar?\n\nYou will need to reconnect to sync events again.')) return
                                                try {
                                                    const supabase = createClient()
                                                    const { data: { user } } = await supabase.auth.getUser()
                                                    if (user) {
                                                        await supabase.from('profiles').update({
                                                            google_calendar_connected: false,
                                                            google_calendar_token: null,
                                                            google_calendar_refresh_token: null,
                                                            google_calendar_token_expires: null,
                                                            push_calendar_id: null,
                                                        }).eq('id', user.id)
                                                        window.location.reload()
                                                    }
                                                } catch {
                                                    alert('❌ Failed to disconnect calendar.')
                                                }
                                            }}
                                            className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        >
                                            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Disconnect
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linear Integration */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>📐</span> Linear
                            </CardTitle>
                            <CardDescription>Connect your Linear workspace</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                                        <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Linear</p>
                                        <p className="text-sm text-zinc-500">Not connected</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-500">
                                    Coming Soon
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Routines Section */}
                    <RoutinesSection />

                    {/* Appearance */}
                    <AppearanceSection />

                    {/* Notifications */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>🔔</span> Notifications
                            </CardTitle>
                            <CardDescription>Manage your notification preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">Block reminders</p>
                                    <p className="text-sm text-zinc-500">Get notified when blocks start</p>
                                </div>
                                <Switch disabled />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">Overrun alerts</p>
                                    <p className="text-sm text-zinc-500">Alert when blocks run over time</p>
                                </div>
                                <Switch disabled />
                            </div>
                            <p className="text-xs text-zinc-600">
                                Push notifications coming soon.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Data & Privacy */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>💾</span> Data
                            </CardTitle>
                            <CardDescription>Manage your data and privacy</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-zinc-700 bg-zinc-800/50"
                                disabled
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Session Data
                                <Badge className="ml-auto" variant="outline">Soon</Badge>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                                disabled
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear All History
                                <Badge className="ml-auto" variant="outline">Soon</Badge>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* App Info */}
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium text-white">Push To Start</p>
                                <p className="text-xs text-zinc-600">v0.1.0 · Built with 🔥</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-500 hover:text-white"
                                onClick={() => router.push('/stats')}
                            >
                                View Stats →
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
