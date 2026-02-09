# Ticket SKT-23: [Bug] /now page timer shows 17000+ minutes and doesn't clear on Stop/Done
Last updated: 2026-02-08 17:45 local

**Status**: ✅ Complete
**Priority**: [Urgent]
**Assignee**: [Agent]

## Description
The timer on the `/now` page was showing extremely large values and failed to reset when sessions were finished or stopped.

## Implementation Details
- **Store Fix:** Updated `useExecutionStore.reset()` to explicitly set `currentBlock: undefined`.
- **Navigation Fix:** Updated `handleDone`, `handleStop`, and `handleConfirmStop` in `now/page.tsx` to call `reset()` immediately before navigating to the `/save` page. This ensures the global timer state is cleared as soon as the user exits the execution context.

## References
- Commit: [latest]
