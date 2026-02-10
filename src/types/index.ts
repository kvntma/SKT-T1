// Goal - imported from Obsidian
export interface Goal {
    id: string
    user_id: string
    title: string
    horizon: 'year' | 'quarter' | 'week'
    source?: string // Obsidian file reference
    priority: number
    linear_issue_id?: string
    created_at: string
    updated_at: string
}

// Block - calendar time block
export interface Block {
    id: string
    user_id: string
    goal_id?: string
    title: string
    type: 'focus' | 'admin' | 'recovery'
    planned_start: string
    planned_end: string
    calendar_id?: string
    task_link?: string
    stop_condition?: string
    linear_issue_id?: string
    is_quick_add?: boolean
    created_at: string
}

// Session - actual execution record
export interface Session {
    id: string
    user_id: string
    block_id?: string
    actual_start?: string
    actual_end?: string
    outcome?: 'done' | 'aborted' | 'continue' | 'abandoned'
    abort_reason?: string
    resume_token?: string // "What's the next obvious step?"
    time_to_start?: number // Seconds between block start and session start
    created_at: string
}

// Daily metrics - aggregated telemetry
export interface DailyMetrics {
    id: string
    user_id: string
    date: string
    avg_time_to_start?: number
    completion_rate?: number
    overrun_count: number
    abort_count: number
    total_focus_minutes: number
    best_execution_hour?: number // 0-23
}

// Execution state for the timer
export interface ExecutionState {
    isRunning: boolean
    startTime?: Date
    currentBlock?: Block
    currentSessionId?: string
    elapsedSeconds: number
}
