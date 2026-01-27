'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useCalendar } from '@/lib/hooks/useCalendar'
import { createClient } from '@/lib/supabase/client'

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
                                <p className="mt-3 text-xs text-zinc-600">
                                    Manage which calendars to sync from the Blocks page.
                                </p>
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
