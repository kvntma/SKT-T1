# Current Truth Memory
Last updated: 2026-02-08 16:45 local

## Key Decisions
- **Workflow:** Ralph Workflow with mandatory Git Commit + Push for `.agent/memory` updates.
- **Persistence:** Agent state is synchronized remotely to support multi-agent/multi-machine context.
- **SKT-13:** Block details and sessions are now fully editable.

## Architecture & Constraints
- **Tailwind Dynamic Colors:** Static lookup map only.
- **Session Restoration:** Restored via DB check on page mount (`outcome IS NULL`).

## Active Ticket: SKT-12
- Goal: Maintain execution state across page refreshes.

## TODO
- [ ] Implement session detection in `now/page.tsx`.
- [ ] Verify full restoration flow (Block + Timer).

## Key Files
- `src/lib/stores/execution-store.ts`
- `src/app/(app)/now/page.tsx`
- `src/app/(app)/blocks/[id]/page.tsx`