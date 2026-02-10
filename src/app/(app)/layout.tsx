import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { SidebarNav } from '@/components/sidebar-nav'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <SidebarNav />
            <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
                <div className="flex-1 flex flex-col pb-20 md:pb-0">
                    {children}
                </div>
                <div className="md:hidden">
                    <BottomNav />
                </div>
            </main>
        </div>
    )
}
