// Categorized by root cause for LLM pattern analysis
export const ABORT_REASONS = [
    // Attention/Focus issues
    { value: 'mind_wandering', label: 'Mind wandering', emoji: '💭', category: 'focus' },
    { value: 'phone_rabbit_hole', label: 'Phone/internet rabbit hole', emoji: '📱', category: 'focus' },
    { value: 'external_interruption', label: 'Someone interrupted me', emoji: '🗣️', category: 'focus' },

    // Blockers
    { value: 'unclear_next_step', label: 'Unclear what to do next', emoji: '🤔', category: 'blocked' },
    { value: 'technical_blocker', label: 'Technical issue/bug', emoji: '🐛', category: 'blocked' },
    { value: 'waiting_on_someone', label: 'Waiting on someone else', emoji: '⏳', category: 'blocked' },
    { value: 'missing_info', label: 'Need more information', emoji: '📋', category: 'blocked' },

    // Energy/Capacity
    { value: 'mental_fatigue', label: 'Mental fatigue', emoji: '🧠', category: 'energy' },
    { value: 'physical_fatigue', label: 'Physical fatigue', emoji: '😴', category: 'energy' },
    { value: 'hunger_thirst', label: 'Hungry/thirsty', emoji: '🍽️', category: 'energy' },
    { value: 'need_break', label: 'Need a break', emoji: '☕', category: 'energy' },

    // Task scoping
    { value: 'task_too_big', label: 'Task too big/vague', emoji: '🏔️', category: 'scoping' },
    { value: 'wrong_task', label: 'Working on wrong thing', emoji: '🔄', category: 'scoping' },

    // External
    { value: 'urgent_interrupt', label: 'Urgent priority came up', emoji: '🚨', category: 'external' },
    { value: 'meeting_call', label: 'Meeting/call', emoji: '📞', category: 'external' },

    // Catch-all
    { value: 'other', label: 'Other (describe below)', emoji: '✏️', category: 'other' },
] as const

export type AbortReason = typeof ABORT_REASONS[number]

export const ABORT_CATEGORIES = [
    { key: 'focus', label: 'Focus Issues' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'energy', label: 'Energy' },
    { key: 'scoping', label: 'Task Scoping' },
    { key: 'external', label: 'External' },
    { key: 'other', label: 'Other' },
] as const
