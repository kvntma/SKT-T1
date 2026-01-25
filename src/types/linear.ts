// Linear Integration Types for Push To Start

// Label mapping to internal types
export const LABEL_TO_TASK_TYPE: Record<string, 'task' | 'routine' | 'goal'> = {
    '🎯 Goal': 'goal',
    '⚡ Task': 'task',
    '🔄 Routine': 'routine',
}

export const LABEL_TO_DOMAIN: Record<string, string> = {
    '🏃 Health': 'health',
    '💼 Career': 'career',
    '🧠 Learning': 'learning',
    '🏠 Life': 'life',
}

// Linear state to internal state mapping
export const LINEAR_STATE_MAP: Record<string, string> = {
    'Backlog': 'backlog',
    'Todo': 'todo',
    'In Progress': 'in_progress',
    'In Review': 'in_review',
    'Done': 'done',
    'Canceled': 'canceled',
    'Duplicate': 'canceled',
}

// Linear issue shape (simplified)
export interface LinearIssue {
    id: string
    identifier: string // e.g., "SKT-123"
    title: string
    description?: string
    priority: number // 0=none, 1=urgent, 2=high, 3=normal, 4=low
    estimate?: number
    dueDate?: string
    state: {
        id: string
        name: string
        type: string
    }
    labels: {
        nodes: Array<{
            id: string
            name: string
        }>
    }
    parent?: {
        id: string
        identifier: string
    }
    createdAt: string
    updatedAt: string
}

// Parsed task from Linear issue
export interface ParsedLinearTask {
    linear_issue_id: string
    linear_identifier: string
    title: string
    description?: string
    task_type: 'task' | 'routine' | 'goal'
    domain?: string
    estimate?: number
    priority: number
    state: string
    due_date?: string
    parent_linear_id?: string
}

/**
 * Parse a Linear issue into a task for Supabase
 */
export function parseLinearIssue(issue: LinearIssue): ParsedLinearTask {
    const labels = issue.labels.nodes.map(l => l.name)

    // Determine task type from labels
    let task_type: 'task' | 'routine' | 'goal' = 'task'
    for (const label of labels) {
        if (LABEL_TO_TASK_TYPE[label]) {
            task_type = LABEL_TO_TASK_TYPE[label]
            break
        }
    }

    // Determine domain from labels
    let domain: string | undefined
    for (const label of labels) {
        if (LABEL_TO_DOMAIN[label]) {
            domain = LABEL_TO_DOMAIN[label]
            break
        }
    }

    // Map state
    const state = LINEAR_STATE_MAP[issue.state.name] || 'backlog'

    return {
        linear_issue_id: issue.id,
        linear_identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        task_type,
        domain,
        estimate: issue.estimate,
        priority: issue.priority,
        state,
        due_date: issue.dueDate,
        parent_linear_id: issue.parent?.id,
    }
}

// Linear API configuration
export const LINEAR_CONFIG = {
    TEAM_ID: '4071c41c-6ae2-4046-a717-4c54db67db20', // SKT-T1 team
    TEAM_KEY: 'SKT',
}
