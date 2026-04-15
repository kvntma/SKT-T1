'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Folder, Save, Info, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
    const router = useRouter()
    
    // TODO: Wire up useObsidianConfig hook
    const [vaultPath, setVaultPath] = useState('/path/to/your/obsidian/vault')
    const [isSaving, setIsSaving] = useState(false)
    const [isCalendarConnected, setIsCalendarConnected] = useState(false)

    useEffect(() => {
        // Simple check for token file presence (via a hypothetical API)
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/google/status')
                const data = await res.json()
                setIsCalendarConnected(data.connected)
            } catch (e) {
                console.error('Failed to check calendar status')
            }
        }
        checkAuth()
    }, [])

    const handleSaveVault = () => {
        setIsSaving(true)
        // Simulate save
        setTimeout(() => {
            setIsSaving(false)
            alert('Vault configuration updated!')
        }, 500)
    }

    const handleConnectGoogle = () => {
        window.location.href = '/api/auth/google'
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
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight font-mono">System Config</h1>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>

                <div className="space-y-4">
                    {/* Obsidian Configuration */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>📓</span> Obsidian Vault
                            </CardTitle>
                            <CardDescription>Configure your local vault source of truth</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vault Root Path</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Folder className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                        <Input
                                            value={vaultPath}
                                            onChange={(e) => setVaultPath(e.target.value)}
                                            placeholder="/Users/name/Documents/Vault"
                                            className="border-zinc-700 bg-zinc-900/50 pl-10"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleSaveVault}
                                        disabled={isSaving}
                                        className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10"
                                    >
                                        {isSaving ? 'Saving...' : <Save className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-mono">
                                    Root: {vaultPath}
                                </p>
                            </div>

                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                                <div className="flex gap-3">
                                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-blue-300">Daily Notes Required</p>
                                        <p className="text-[10px] text-blue-400/80 leading-relaxed font-mono">
                                            Path: Zettelkasten/Journal/J-yyyy-MM-dd.md
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google Calendar Integration */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>📅</span> Google Calendar
                            </CardTitle>
                            <CardDescription>Authorize Time-to-Start to push execution blocks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center border",
                                        isCalendarConnected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800 border-zinc-700"
                                    )}>
                                        <Calendar className={cn("w-5 h-5", isCalendarConnected ? "text-emerald-500" : "text-zinc-500")} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Google Account</p>
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                                            {isCalendarConnected ? 'Authorized & Connected' : 'No account linked'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={isCalendarConnected ? "outline" : "default"}
                                    size="sm"
                                    onClick={handleConnectGoogle}
                                    className={cn(
                                        "text-xs gap-2 font-bold uppercase tracking-tight",
                                        isCalendarConnected ? "border-zinc-800 text-zinc-400" : "bg-blue-600 hover:bg-blue-500"
                                    )}
                                >
                                    {isCalendarConnected ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Re-link
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Connect
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="mt-3 text-[9px] text-zinc-600 text-center font-mono">
                                FlowSavvy automatically reads your primary Google Calendar as the source of truth.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span>🎨</span> Appearance
                            </CardTitle>
                            <CardDescription>Customize UI preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-white">Execution Theme</p>
                                    <p className="text-sm text-zinc-500">
                                        Choose your primary execution color
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {['emerald', 'blue', 'purple', 'zinc'].map((color) => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "h-8 w-8 rounded-md border-2",
                                                color === 'emerald' ? "bg-emerald-500 border-white" : "bg-zinc-800 border-transparent",
                                                "hover:scale-110 transition-transform"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* App Info */}
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium text-white">Push To Start</p>
                                <p className="text-xs text-zinc-600">v1.0.0 (Obsidian Pivot) · Built locally</p>
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
