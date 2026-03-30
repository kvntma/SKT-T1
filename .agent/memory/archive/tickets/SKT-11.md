# Ticket SKT-11: Show previous resume token on block load
Last updated: 2026-02-08 18:00 local

**Status**: ✅ Complete
**Priority**: [Medium]
**Assignee**: [Agent]

## Description
To help users pick up where they left off, the app should show the "next obvious step" from their last session when they load a new block.

## Implementation Details
- **Hook Update:** Added `lastSession` query to `useSession.ts` to fetch the most recent session with a non-null `resume_token`.
- **UI Update:** Added a "Last Action" card to the `/now` page.
- **Logic:**
    - If the current block has a `stop_condition`, it is displayed.
    - If no `stop_condition` exists, and the timer is NOT running, the most recent `resume_token` is shown as "Last Action".
    - This ensures users see their next step before starting, but are not distracted by it once the work begins.

## References
- Commit: [latest]
