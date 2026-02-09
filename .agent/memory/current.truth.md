# Current Truth Memory
Last updated: 2026-02-08 18:30 local

## Key Decisions
- **Vision:** "Push To Start" is a dynamic execution layer, not a static tracker.
- **Workflow:** Standardized on "Ralph Workflow" (.agent/memory/ persistence is mandatory).
- **Stability:** Use bulk DB operations (`upsert`) and `.maybeSingle()` to maintain clean logs and avoid race conditions.
- **Draggable Context:** 1px = 1 minute vertical scale with 15-minute snapping.

## Architecture
- **Dynamic Scheduling:** Managed via `@dnd-kit` (Frontend) and `/api/blocks/refactor` (AI Backend).
- **Anchors:** External calendar events are treated as immutable anchors by the AI.
- **Memory:** Ticket-specific state lives in `.agent/memory/tickets/`.

## Progress (Phase 6)
- [x] Draggable vertical time-grid
- [x] AI Schedule Refactor (Proposal flow)
- [x] Bulk Sync/Push optimizations
- [x] Linear Ticket alignment

## Key Files
- `src/components/calendar-view.tsx` (Draggable Grid)
- `src/app/api/blocks/refactor/route.ts` (Refactor Engine)
- `src/app/api/calendar/sync/route.ts` (Batch Sync)
- `pushtostart.md` (Source of Truth PRD)
- `IMPLEMENTATION_PLAN.md` (Roadmap)
