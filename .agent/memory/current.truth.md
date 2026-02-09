# Current Truth Memory
Last updated: 2026-02-08 19:15 local

## Stable Decisions
- **Workflow:** Adopted "Ralph Workflow" with mandatory Git Commit + Push for all `.agent/memory` updates.
- **Source of Truth:** Supabase `sessions` table is the source of truth for active timers (`outcome IS NULL`).
- **Session Recovery:** `/now` page restores state (Block + elapsed timer + SessionID) from DB if started in the last 24 hours.
- **Session Continuity:** "Last Action" (resume token) is displayed on new block load to maintain momentum.
- **Unified Editing:** Manual and calendar blocks are fully editable (including session metadata) once a session record exists.
- **Drag & Drop:** `CalendarView` supports vertical-only dragging with 15-minute snapping via `@dnd-kit`.

## Architecture & Constraints
- **Execution Store:** Global Zustand store (`isRunning`, `elapsedSeconds`, `currentBlock`, `currentSessionId`) manages all timer logic.
- **Session ID Persistence:** `currentSessionId` MUST be in the store to survive navigation; otherwise "Done/Stop" might fail to find the ID to close the session in the DB.
- **Stale Session Safety:** Queries for active sessions (`outcome IS NULL`) MUST include a 24-hour lookback limit to avoid "zombie" timers from the past.
- **Tailwind JIT:** No string interpolation for dynamic classes; use static lookup maps only.

## Active TODOs
- [ ] Implement AI Refactor Engine (`/api/blocks/refactor`) for dynamic rescheduling.
- [ ] Implement retrospective session creation for "Missed" blocks (SKT-21).
- [ ] Implement auto-transition of Linear issue status on session completion (SKT-22).

## Key Files
- `src/lib/stores/execution-store.ts` (Global timer + session ID state)
- `src/app/(app)/now/page.tsx` (Execution core with 24h lookup)
- `src/lib/hooks/useSession.ts` (Mutation logic for DB)

## Known Gotchas
- **State Inconsistency:** If `isRunning` is true but no DB session is found, the UI now auto-resets the store to prevent deadlocks.
