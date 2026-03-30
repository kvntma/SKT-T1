'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ObsidianTask } from '@/types'

export function useTasks() {
    const queryClient = useQueryClient()

    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const response = await fetch('/api/obsidian/tasks');
            if (!response.ok) throw new Error('Failed to fetch tasks from Obsidian');
            const data = await response.json();
            return data.tasks as ObsidianTask[];
        },
    })

    const completeTask = useMutation({
        mutationFn: async ({ lineIndex, completed }: { lineIndex: number, completed: boolean }) => {
            const response = await fetch('/api/obsidian/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lineIndex, completed }),
            });
            if (!response.ok) throw new Error('Failed to update task status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    })

    return {
        ...tasksQuery,
        completeTask,
    }
}
