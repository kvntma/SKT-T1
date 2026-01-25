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
                    id: string
                    linear_issue_id: string | null
                    planned_end: string
                    planned_start: string
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
                    id?: string
                    linear_issue_id?: string | null
                    planned_end: string
                    planned_start: string
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
                    id?: string
                    linear_issue_id?: string | null
                    planned_end?: string
                    planned_start?: string
                    stop_condition?: string | null
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

// Insert type aliases
export type InsertGoal = InsertTables<'goals'>
export type InsertBlock = InsertTables<'blocks'>
export type InsertSession = InsertTables<'sessions'>
export type InsertDailyMetric = InsertTables<'daily_metrics'>

// Block type enum for type safety
export type BlockType = 'focus' | 'admin' | 'recovery'
export type Horizon = 'year' | 'quarter' | 'week'
export type SessionOutcome = 'done' | 'aborted' | 'continue'
