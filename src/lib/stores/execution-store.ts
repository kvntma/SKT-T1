import { create } from 'zustand'
import type { Block, ExecutionState } from '@/types'

interface ExecutionStore extends ExecutionState {
    setCurrentBlock: (block: Block | undefined) => void
    startTimer: () => void
    stopTimer: () => void
    tick: () => void
    reset: () => void
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
    isRunning: false,
    startTime: undefined,
    currentBlock: undefined,
    elapsedSeconds: 0,

    setCurrentBlock: (block) => set({ currentBlock: block }),

    startTimer: () =>
        set({
            isRunning: true,
            startTime: new Date(),
            elapsedSeconds: 0,
        }),

    stopTimer: () =>
        set({
            isRunning: false,
        }),

    tick: () =>
        set((state) => ({
            elapsedSeconds: state.isRunning ? state.elapsedSeconds + 1 : state.elapsedSeconds,
        })),

    reset: () =>
        set({
            isRunning: false,
            startTime: undefined,
            elapsedSeconds: 0,
        }),
}))
