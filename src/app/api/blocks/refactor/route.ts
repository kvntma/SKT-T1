// AI Schedule Refactor API
// Analyzes remaining blocks and proposes a new schedule based on current time and progress.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Block {
    id: string
    title: string
    type: string
    planned_start: string
    planned_end: string
    source: 'manual' | 'calendar'
    routine_id?: string | null
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const { blocks } = await request.json() as { blocks: Block[] }
        
        if (!blocks || blocks.length === 0) {
            return NextResponse.json({ message: 'No blocks to refactor' }, { status: 400 })
        }

        // Logic: Reschedule remaining blocks starting from NOW
        // 1. Sort blocks by planned start
        // 2. Identify "Fixed" blocks (source === 'calendar' OR routine_id exists)
        // 3. Reschedule "Fluid" blocks (source === 'manual' AND no routine_id) around them
        
        const sortedBlocks = [...blocks].sort((a, b) => 
            new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
        )

        const now = new Date()
        // Round to nearest 5 mins for start
        now.setMinutes(Math.ceil((now.getMinutes() + 5) / 5) * 5, 0, 0)
        
        let currentTime = now.getTime()
        const proposal: Block[] = []

        for (const block of sortedBlocks) {
            const start = new Date(block.planned_start).getTime()
            const end = new Date(block.planned_end).getTime()
            const duration = end - start

            // Skip blocks that already ended
            if (end < new Date().getTime()) {
                continue
            }

            const isFixed = block.source === 'calendar' || !!block.routine_id

            if (isFixed) {
                // Fixed anchor - don't move, but update currentTime to its end if it's in the future
                proposal.push(block)
                if (end > currentTime) {
                    currentTime = end + (5 * 60 * 1000) // 5 min transition buffer
                }
            } else {
                // Fluid block - move to currentTime
                const newStart = new Date(currentTime)
                const newEnd = new Date(currentTime + duration)
                
                // Ensure we don't move it BACK in time if it was already started/upcoming and we are just refactoring future
                // But generally, refactor means "start from now"
                
                proposal.push({
                    ...block,
                    planned_start: newStart.toISOString(),
                    planned_end: newEnd.toISOString(),
                })

                currentTime += duration + (5 * 60 * 1000) // Add 5 min buffer
            }
        }

        // Filter out blocks that didn't actually change to keep commit small
        const actualChanges = proposal.filter(p => {
            const original = blocks.find(b => b.id === p.id)
            return original?.planned_start !== p.planned_start || original?.planned_end !== p.planned_end
        })

        if (actualChanges.length === 0) {
            return NextResponse.json({ 
                message: 'Your schedule is already optimal!',
                proposal: null 
            })
        }

        return NextResponse.json({ 
            success: true,
            proposal: actualChanges 
        })

    } catch (error) {
        console.error('[Refactor] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
