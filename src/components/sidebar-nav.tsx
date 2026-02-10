'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/hooks/useSidebar'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
    {
        href: '/now',
        label: 'Now',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
        ),
    },
    {
        href: '/blocks',
        label: 'Blocks',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
            </svg>
        ),
    },
    {
        href: '/stats',
        label: 'Stats',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
            </svg>
        ),
    },
]

export function SidebarNav() {
    const pathname = usePathname()
    const { sidebarCollapsed, toggleSidebar } = useSidebar()

    return (
        <aside className={cn(
            "fixed left-0 top-0 bottom-0 z-50 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl hidden md:flex flex-col p-4 transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-64"
        )}>
            <div className={cn("mb-8 px-2 transition-all", sidebarCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible")}>
                <h1 className="text-xl font-bold text-white">Push To Start</h1>
                <p className="text-xs text-zinc-500">Execute. No negotiation.</p>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                                sidebarCollapsed && "justify-center px-2"
                            )}
                        >
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0",
                                isActive && "text-white"
                            )}>
                                {item.icon}
                            </div>
                            {!sidebarCollapsed && item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-zinc-800">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="w-full text-zinc-500 hover:text-white hover:bg-zinc-800"
                >
                    {sidebarCollapsed ? (
                        <PanelLeftOpen className="h-5 w-5" />
                    ) : (
                        <div className="flex items-center gap-3 w-full px-3">
                            <PanelLeftClose className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-medium">Collapse</span>
                        </div>
                    )}
                </Button>
            </div>
        </aside>
    )
}

