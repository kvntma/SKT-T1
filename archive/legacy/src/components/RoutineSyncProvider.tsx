'use client'

import { useRoutineSync } from '@/lib/hooks/useRoutineSync'

export function RoutineSyncProvider({ children }: { children: React.ReactNode }) {
    useRoutineSync()
    return <>{children}</>
}
