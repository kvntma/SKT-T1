'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarSyncProvider } from './CalendarSyncProvider'

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
            <CalendarSyncProvider>{children}</CalendarSyncProvider>
        </QueryClientProvider>
    )
}
