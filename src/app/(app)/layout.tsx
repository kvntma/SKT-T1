import { BottomNav } from '@/components/bottom-nav'
import { SidebarNav } from '@/components/sidebar-nav'
import { LayoutWrapper } from '@/components/layout-wrapper'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <SidebarNav />
            <LayoutWrapper>
                <div className="flex-1 flex flex-col pb-20 md:pb-0">
                    {children}
                </div>
                <div className="md:hidden">
                    <BottomNav />
                </div>
            </LayoutWrapper>
        </div>
    )
}
