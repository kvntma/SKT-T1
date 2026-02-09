# Current Work Memory
Last updated: 2026-02-08 17:45 local

Ticket: SKT-20
Branch: master

## Summary
- Implemented Phase 6: Dynamic Scheduling (Initial Refactor).
- Added `@dnd-kit` for draggable block manipulation in `CalendarView`.
- Optimized `CalendarPush` and `CalendarSync` API routes with bulk `upsert` operations.
- Updated `useBlocks` with `updateBlock` mutation.
- Verified build integrity: ✅ Success.
- Scoped Linear scanning to SKT-T1 team.

## Decisions (Do Not Re-litigate)
- **Drag & Drop:** Vertical-only dragging in `CalendarView` with 15-minute snapping.
- **Bulk Operations:** API routes now use batch `upsert` instead of row-by-row updates for performance.
- **Type Safety:** Used full block objects for `upsert` to avoid `any` and satisfy DB schema.

## Current State
- Draggable interface functional in `CalendarView`.
- Build passing.
- Memory synchronized remotely.

## Open Questions / Risks
- Dragging currently works for manual blocks; logic for external synced blocks needs careful collision handling in future phases.

## Next Steps
- [ ] Commit and Push all latest changes.
- [ ] Begin SKT-11: Show previous resume token on block load.