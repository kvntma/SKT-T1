'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StatsPage() {
    const router = useRouter()
    
    // TODO: Wire up useObsidianStats hook
    const isLoading = false
    const sessions = []

    return (
        <div className="min-h-screen px-6 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header with Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white"
                        onClick={() => router.push('/now')}
                    >
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white">Stats & History</h1>
                        <p className="text-sm text-zinc-500">
                            Insights from your Obsidian vault
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white"
                        onClick={() => router.push('/settings')}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Button>
                </div>

                <Tabs defaultValue="stats" className="w-full">
                    <TabsList className="mb-6 grid w-full grid-cols-2 bg-zinc-900">
                        <TabsTrigger value="stats" className="data-[state=active]:bg-zinc-800">
                            📊 Stats
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-zinc-800">
                            📜 History
                        </TabsTrigger>
                    </TabsList>

                    {/* Stats Tab */}
                    <TabsContent value="stats" className="space-y-4">
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <span className="text-4xl mb-4">📊</span>
                                <p className="text-zinc-400">No session data yet</p>
                                <p className="text-sm text-zinc-600 mt-1">
                                    Statistics will be derived from your daily notes.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-3">
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <span className="text-4xl mb-4">📜</span>
                                <p className="text-zinc-400">No sessions yet</p>
                                <p className="text-sm text-zinc-600 mt-1">
                                    Completed tasks in your vault will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
