'use client'

import { useSidebar } from '@/lib/hooks/useSidebar'
import { cn } from '@/lib/utils'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useSidebar()

    return (
        <main className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}>
            {children}
        </main>
    )
}
