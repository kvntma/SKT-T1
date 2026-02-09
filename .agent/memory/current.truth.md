# Current Truth Memory
Last updated: 2026-02-08 18:30 local

## Stable Decisions
- **Workflow:** Adopted "Ralph Workflow" with mandatory Git Commit + Push for all `.agent/memory` updates to ensure cross-session remote sync.
- **Source of Truth:** Supabase `sessions` table is the source of truth for active timers (`outcome IS NULL`).
- **Session Recovery:** On refresh, `/now` page restores state (Block + elapsed timer) from DB.
- **Session Continuity:** "Last Action" (resume token from previous session) is displayed on new block load to maintain momentum.
- **Unified Editing:** Manual and calendar blocks are fully editable (including session metadata) once a session record exists.
- **Manual Blocks:** Default color = Emerald. Calendar blocks use native Google hex colors.
- **Drag & Drop:** `CalendarView` supports vertical-only dragging with 15-minute snapping via `@dnd-kit`.

## Architecture & Constraints
- **Tailwind JIT:** No string interpolation for dynamic classes; use static lookup maps only.
- **Execution Store:** Global Zustand store (`isRunning`, `elapsedSeconds`, `currentBlock`) must be cleared via `reset()` before navigating away from execution context.
- **Sync Logic:** Filter "Push To Start" calendar during imports to prevent circular sync loops.
- **API Performance:** Use batch `upsert` for calendar push/sync to minimize DB round-trips.

## Active TODOs
- [ ] Implement AI Refactor Engine (`/api/blocks/refactor`) for dynamic rescheduling.
- [ ] Add collision detection for draggable blocks against external "anchor" events.
- [ ] Implement retrospective session creation for "Missed" blocks (SKT-21).
- [ ] Implement auto-transition of Linear issue status on session completion (SKT-22).

## Key Files
- `src/lib/stores/execution-store.ts` (Global timer state)
- `src/app/(app)/now/page.tsx` (Execution core)
- `src/components/calendar-view.tsx` (Draggable orchestration)
- `src/lib/hooks/useSession.ts` (Active/Last session logic)
- `src/app/api/calendar/` (Optimized sync routes)

## Known Gotchas
- **Browser Cache:** "Not defined" errors after code updates often require a hard browser refresh to clear stale dev-server artifacts.
- **UPSERT Mapping:** Supabase `upsert` requires full objects (including `user_id`) to satisfy TypeScript/DB constraints.