# Ticket SKT-12: Handle page refresh mid-session
Last updated: 2026-02-08 16:30 local

**Status**: [In Progress]
**Priority**: [Medium]
**Assignee**: [Agent]

## Description
When a user is in an active focus session and refreshes the page, the timer and block context are lost. This leads to friction and inaccurate data. The app should detect an ongoing session in the database and automatically resume the UI state.

## Acceptance Criteria
- [ ] On `/now` page load, check for a session with `outcome IS NULL`.
- [ ] If found, fetch the associated block.
- [ ] Calculate `elapsedSeconds` as `now - actual_start`.
- [ ] Resume the timer automatically.
- [ ] Update `currentSessionId` so "Done" and "Stop" continue to work.

## Notes
- Relies on Supabase as the source of truth.
- Overrides any `sessionStorage` logic for `startBlockId` if an active session is already running.
