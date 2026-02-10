'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarSyncProvider } from './CalendarSyncProvider'
import { RoutineSyncProvider } from './RoutineSyncProvider'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <CalendarSyncProvider>
                <RoutineSyncProvider>{children}</RoutineSyncProvider>
            </CalendarSyncProvider>
        </QueryClientProvider>
    )
}
