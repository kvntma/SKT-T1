export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            blocks: {
                Row: {
                    calendar_id: string | null
                    created_at: string | null
                    goal_id: string | null
                    google_event_id: string | null
                    id: string
                    linear_issue_id: string | null
                    planned_end: string
                    planned_start: string
                    routine_id: string | null
                    stop_condition: string | null
                    task_link: string | null
                    title: string
                    type: string | null
                    user_id: string
                }
                Insert: {
                    calendar_id?: string | null
                    created_at?: string | null
                    goal_id?: string | null
                    google_event_id?: string | null
                    id?: string
                    linear_issue_id?: string | null
                    planned_end: string
                    planned_start: string
                    routine_id?: string | null
                    stop_condition?: string | null
                    task_link?: string | null
                    title: string
                    type?: string | null
                    user_id: string
                }
                Update: {
                    calendar_id?: string | null
                    created_at?: string | null
                    goal_id?: string | null
                    google_event_id?: string | null
                    id?: string
                    linear_issue_id?: string | null
                    planned_end?: string
                    planned_start?: string
                    stop_condition?: string | null
                    task_id?: string | null
                    task_link?: string | null
                    title?: string
                    type?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "blocks_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                ]
            }
            daily_metrics: {
                Row: {
                    abort_count: number | null
                    avg_time_to_start: number | null
                    best_execution_hour: number | null
                    completion_rate: number | null
                    date: string
                    id: string
                    overrun_count: number | null
                    total_focus_minutes: number | null
                    user_id: string
                }
                Insert: {
                    abort_count?: number | null
                    avg_time_to_start?: number | null
                    best_execution_hour?: number | null
                    completion_rate?: number | null
                    date: string
                    id?: string
                    overrun_count?: number | null
                    total_focus_minutes?: number | null
                    user_id: string
                }
                Update: {
                    abort_count?: number | null
                    avg_time_to_start?: number | null
                    best_execution_hour?: number | null
                    completion_rate?: number | null
                    date?: string
                    id?: string
                    overrun_count?: number | null
                    total_focus_minutes?: number | null
                    user_id?: string
                }
                Relationships: []
            }
            goals: {
                Row: {
                    created_at: string | null
                    horizon: string | null
                    id: string
                    linear_issue_id: string | null
                    linear_sync_status: string | null
                    linear_synced_at: string | null
                    priority: number | null
                    source: string | null
                    title: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    horizon: string
                    id?: string
                    linear_issue_id?: string | null
                    linear_sync_status?: string | null
                    linear_synced_at?: string | null
                    priority?: number | null
                    source?: string | null
                    title: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    horizon?: string
                    id?: string
                    linear_issue_id?: string | null
                    linear_sync_status?: string | null
                    linear_synced_at?: string | null
                    priority?: number | null
                    source?: string | null
                    title?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            sessions: {
                Row: {
                    abort_reason: string | null
                    actual_end: string | null
                    actual_start: string | null
                    block_id: string | null
                    created_at: string | null
                    id: string
                    outcome: string | null
                    resume_token: string | null
                    time_to_start: number | null
                    user_id: string
                }
                Insert: {
                    abort_reason?: string | null
                    actual_end?: string | null
                    actual_start?: string | null
                    block_id?: string | null
                    created_at?: string | null
                    id?: string
                    outcome?: string | null
                    resume_token?: string | null
                    time_to_start?: number | null
                    user_id: string
                }
                Update: {
                    abort_reason?: string | null
                    actual_end?: string | null
                    actual_start?: string | null
                    block_id?: string | null
                    created_at?: string | null
                    id?: string
                    outcome?: string | null
                    resume_token?: string | null
                    time_to_start?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sessions_block_id_fkey"
                        columns: ["block_id"]
                        isOneToOne: false
                        referencedRelation: "blocks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tasks: {
                Row: {
                    created_at: string | null
                    description: string | null
                    domain: string | null
                    due_date: string | null
                    estimate: number | null
                    id: string
                    linear_identifier: string | null
                    linear_issue_id: string
                    linear_synced_at: string | null
                    parent_id: string | null
                    priority: number | null
                    state: string | null
                    task_type: string | null
                    title: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    domain?: string | null
                    due_date?: string | null
                    estimate?: number | null
                    id?: string
                    linear_identifier?: string | null
                    linear_issue_id: string
                    linear_synced_at?: string | null
                    parent_id?: string | null
                    priority?: number | null
                    state?: string | null
                    task_type?: string | null
                    title: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    domain?: string | null
                    due_date?: string | null
                    estimate?: number | null
                    id?: string
                    linear_identifier?: string | null
                    linear_issue_id?: string
                    linear_synced_at?: string | null
                    parent_id?: string | null
                    priority?: number | null
                    state?: string | null
                    task_type?: string | null
                    title?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            routines: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    type: string
                    duration_minutes: number
                    start_time: string
                    recurrence: Json
                    is_hard_non_negotiable: boolean
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    type: string
                    duration_minutes: number
                    start_time: string
                    recurrence: Json
                    is_hard_non_negotiable?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    type?: string
                    duration_minutes?: number
                    start_time?: string
                    recurrence?: Json
                    is_hard_non_negotiable?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "routines_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    google_calendar_connected: boolean | null
                    google_calendar_token: string | null
                    google_calendar_refresh_token: string | null
                    google_calendar_token_expires: string | null
                    selected_calendar_id: string | null
                    synced_calendar_ids: string[] | null
                    push_calendar_id: string | null
                    manual_block_color: string | null
                    calendar_block_color: string | null
                    created_at: string | null
                    updated_at: string | null
                    last_calendar_sync: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    google_calendar_connected?: boolean | null
                    google_calendar_token?: string | null
                    google_calendar_refresh_token?: string | null
                    google_calendar_token_expires?: string | null
                    selected_calendar_id?: string | null
                    synced_calendar_ids?: string[] | null
                    push_calendar_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    last_calendar_sync?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    google_calendar_connected?: boolean | null
                    google_calendar_token?: string | null
                    google_calendar_refresh_token?: string | null
                    google_calendar_token_expires?: string | null
                    selected_calendar_id?: string | null
                    synced_calendar_ids?: string[] | null
                    push_calendar_id?: string | null
                    manual_block_color?: string | null
                    calendar_block_color?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    last_calendar_sync?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Entity type aliases
export type Goal = Tables<'goals'>
export type Block = Tables<'blocks'>
export type Session = Tables<'sessions'>
export type DailyMetric = Tables<'daily_metrics'>
export type Task = Tables<'tasks'>
export type Profile = Tables<'profiles'>
export type Routine = Tables<'routines'>

// Insert type aliases
export type InsertGoal = InsertTables<'goals'>
export type InsertBlock = InsertTables<'blocks'>
export type InsertSession = InsertTables<'sessions'>
export type InsertDailyMetric = InsertTables<'daily_metrics'>
export type InsertTask = InsertTables<'tasks'>
export type InsertRoutine = InsertTables<'routines'>

// Type enums for type safety
export type BlockType = 'focus' | 'admin' | 'recovery' | 'busy'
export type Horizon = 'year' | 'quarter' | 'week'
export type SessionOutcome = 'done' | 'aborted' | 'continue'
export type TaskType = 'task' | 'routine' | 'goal'
export type Domain = 'health' | 'career' | 'learning' | 'life'
export type TaskState = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled'
