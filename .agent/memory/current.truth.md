# Current Truth Memory
Last updated: 2026-02-08 21:15 local

## Key Decisions
- **Vision:** "Push To Start" is a dynamic execution layer.
- **Routines:** Non-negotiable recurring templates that auto-populate the daily schedule and act as fixed anchors for the AI Refactor engine.
- **Workflow:** Standardized on "Ralph Workflow" (.agent/memory/ persistence is mandatory).
- **Navigation:** `/blocks` page supports full temporal navigation (Day/Week view) with state-driven data fetching.
- **Stability:** Use bulk DB operations (`upsert`) and `.maybeSingle()` to maintain clean logs.

## Architecture
- **Dynamic Scheduling:** Managed via `@dnd-kit` (Frontend) and `/api/blocks/refactor` (AI Backend).
- **Routines:** Templates live in `routines` table; blocks link via `routine_id`.
- **Auto-Sync:** Triggered via `RoutineSyncProvider` on app load.

## Progress (Phase 6)
- [x] Draggable vertical time-grid
- [x] AI Schedule Refactor (Proposal flow)
- [x] Recurring Routines & Non-negotiables (SKT-16)
- [x] Bulk Sync/Push optimizations

## Key Files
- `src/lib/hooks/useRoutineSync.ts` (Auto-population)
- `src/app/api/blocks/refactor/route.ts` (Refactor Engine)
- `src/app/(app)/settings/page.tsx` (Routine Management)
- `pushtostart.md` (Source of Truth PRD)