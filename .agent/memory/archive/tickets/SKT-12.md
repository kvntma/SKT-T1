# Ticket SKT-12: Handle page refresh mid-session
Last updated: 2026-02-08 17:00 local

**Status**: ✅ Complete
**Priority**: [Medium]
**Assignee**: [Agent]

## Description
When a user is in an active focus session and refreshes the page, the timer and block context are now restored from the database.

## Acceptance Criteria
- [x] On `/now` page load, check for a session with `outcome IS NULL`.
- [x] If found, fetch the associated block.
- [x] Calculate `elapsedSeconds` as `now - actual_start`.
- [x] Resume the timer automatically.
- [x] Update `currentSessionId` so "Done" and "Stop" continue to work.

## Implementation Details
- **Store Update:** Added `restoreSession` to `execution-store.ts` to hydrate state.
- **Detection Logic:** Added a `useEffect` in `now/page.tsx` that queries Supabase for an active session.
- **Data Safety:** Uses `is('outcome', null)` to identify the currently running session.

## References
- Commit: `255ae90` (Store setup), `[latest]` (Implementation)