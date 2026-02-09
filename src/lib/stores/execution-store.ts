import { create } from 'zustand'
import type { Block, ExecutionState } from '@/types'

interface ExecutionStore extends ExecutionState {
    setCurrentBlock: (block: Block | undefined) => void
    startTimer: (sessionId?: string) => void
    stopTimer: () => void
    resumeTimer: () => void
    tick: () => void
    reset: () => void
    restoreSession: (block: Block, startTime: Date, elapsedSeconds: number, sessionId: string) => void
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
    isRunning: false,
    startTime: undefined,
    currentBlock: undefined,
    currentSessionId: undefined,
    elapsedSeconds: 0,

    setCurrentBlock: (block) => set({ currentBlock: block }),

    startTimer: (sessionId) =>
        set({
            isRunning: true,
            startTime: new Date(),
            currentSessionId: sessionId,
            elapsedSeconds: 0,
        }),

    stopTimer: () =>
        set({
            isRunning: false,
        }),

    resumeTimer: () =>
        set({
            isRunning: true,
        }),

    tick: () =>
        set((state) => ({
            elapsedSeconds: state.isRunning ? state.elapsedSeconds + 1 : state.elapsedSeconds,
        })),

    reset: () =>
        set({
            isRunning: false,
            startTime: undefined,
            currentBlock: undefined,
            currentSessionId: undefined,
            elapsedSeconds: 0,
        }),

    restoreSession: (block, startTime, elapsedSeconds, sessionId) =>
        set({
            isRunning: true,
            currentBlock: block,
            currentSessionId: sessionId,
            startTime,
            elapsedSeconds,
        }),
}))
