import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
    // Timer exceeded — play bell + flash circle
    timerExceededSound: boolean
    timerExceededFlash: boolean
    // Upcoming block collision — warn when next block is within N minutes
    blockCollisionWarning: boolean
    blockCollisionMinutes: number // default 5
    // Volume 0-1
    volume: number
    // Actions
    setTimerExceededSound: (enabled: boolean) => void
    setTimerExceededFlash: (enabled: boolean) => void
    setBlockCollisionWarning: (enabled: boolean) => void
    setBlockCollisionMinutes: (minutes: number) => void
    setVolume: (volume: number) => void
}

export const useNotificationStore = create<NotificationSettings>()(
    persist(
        (set) => ({
            timerExceededSound: true,
            timerExceededFlash: true,
            blockCollisionWarning: true,
            blockCollisionMinutes: 5,
            volume: 0.5,
            setTimerExceededSound: (enabled) => set({ timerExceededSound: enabled }),
            setTimerExceededFlash: (enabled) => set({ timerExceededFlash: enabled }),
            setBlockCollisionWarning: (enabled) => set({ blockCollisionWarning: enabled }),
            setBlockCollisionMinutes: (minutes) => set({ blockCollisionMinutes: minutes }),
            setVolume: (volume) => set({ volume }),
        }),
        {
            name: 'notification-settings',
        }
    )
)
