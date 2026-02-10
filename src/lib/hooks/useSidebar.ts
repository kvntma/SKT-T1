import { useUIStore } from '@/lib/stores/ui-store'

export function useSidebar() {
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed)
    const toggleSidebar = useUIStore((state) => state.toggleSidebar)

    return {
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
    }
}
