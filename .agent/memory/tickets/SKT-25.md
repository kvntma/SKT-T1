# Ticket SKT-25: General Block Editing
Last updated: 2026-02-08 19:30 local

**Status**: ✅ Complete
**Priority**: [Medium]
**Assignee**: [Agent]

## Description
Expand the editing capability to all manual blocks (not just completed ones) and ensure users can navigate to the edit screen from both the List and Calendar views.

## Acceptance Criteria
- [x] List view: "Edit" icon button visible for all manual blocks (upcoming/ready).
- [x] Calendar view: Clicking a block navigates to the edit page.
- [x] Edit page handles both upcoming blocks (basic metadata) and completed blocks (metadata + session details).

## Implementation Details
- **List View:** Updated `src/app/(app)/blocks/page.tsx` to show the edit button for any block with `source === 'manual'`.
- **Calendar View:** Updated `onBlockClick` in `src/app/(app)/blocks/page.tsx` to use `router.push('/blocks/[id]')`.

## References
- Related: SKT-13 (Completed blocks only)
