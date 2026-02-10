import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
    sidebarCollapsed: boolean
    executionCollapsed: boolean
    setSidebarCollapsed: (collapsed: boolean) => void
    setExecutionCollapsed: (collapsed: boolean) => void
    toggleSidebar: () => void
    toggleExecution: () => void
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            executionCollapsed: false,
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            setExecutionCollapsed: (collapsed) => set({ executionCollapsed: collapsed }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            toggleExecution: () => set((state) => ({ executionCollapsed: !state.executionCollapsed })),
        }),
        {
            name: 'ui-storage',
        }
    )
)
