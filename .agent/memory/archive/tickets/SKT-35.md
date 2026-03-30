# SKT-35: Filter completed blocks into collapsible section on Blocks page

## Status
- [x] Research current block list implementation in `src/app/(app)/blocks/page.tsx`
- [x] Decide on section placement (User suggests below upcoming ones)
- [x] Implement filtering for `done` and `skipped` blocks
- [x] Create collapsible section for completed blocks
- [x] Add count badge to the section header
- [x] Verify block styling remains consistent
- [x] Add "PTS blocks only" toggle in toolbar
- [x] Implement PTS filtering (Manual + PTS Calendar blocks)

## Notes
- Completed blocks are defined by `outcome === 'done'` or `outcome === 'skipped'` via `getBlockStatus`.
- Status is computed via `getBlockStatus()`.
- Added `line-through` and `opacity-60` to `BlockListItem` for completed blocks.
- Section is placed below upcoming blocks.
- Used `ChevronDown`, `ChevronRight`, and `Badge` for the toggle UI.
- "PTS Only" toggle added to `BlocksToolbar`.
- Filtering logic for PTS only: `block.source === 'manual' || (pushCalendarId && block.calendar_id === pushCalendarId)`.

## Context Snapshot (2026-02-18)
- Collapsible completed section implemented.
- PTS Only toggle implemented.
