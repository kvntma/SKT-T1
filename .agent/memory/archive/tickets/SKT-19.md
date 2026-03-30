# SKT-19: Undo-able Stop Button
Last updated: 2026-01-28 01:51 EST
Status: **Ready for Testing**

## Problem
Clicking "Stop" on an active session immediately ended the block with no way to recover. Accidental clicks caused data loss.

## Solution Implemented
Hybrid undo approach with immediate data safety:

### Flow
1. User clicks **Stop** → Timer stops, `outcome: 'abandoned'` written to DB immediately
2. Centered modal appears with 5-second countdown
3. Options:
   - **Undo** → Clears `abandoned` status in DB, resumes timer from where it left off
   - **Confirm Stop** (red) → Immediate navigation to save page
   - **Wait 5s** → Auto-navigates to save page

### Key Implementation Details

**Frontend (`/now/page.tsx`)**:
- `pendingStop` state controls modal visibility
- `undoCountdown` state drives 5-second countdown display
- `handleStop()` → calls `abandonSession.mutate()` immediately
- `handleUndoStop()` → calls `resumeSession.mutate()`, then `resumeTimer()`
- `handleConfirmStop()` → clears timers, navigates immediately

**State Management (`execution-store.ts`)**:
- Added `resumeTimer()`: Sets `isRunning: true` without resetting `elapsedSeconds`
- `stopTimer()`: Only sets `isRunning: false`, preserves elapsed time

**Hooks (`useSession.ts`)**:
- `abandonSession`: Updates session with `outcome: 'abandoned'`
- `resumeSession`: Clears outcome back to `null`
- All mutations invalidate `['blocks']`, `['currentBlock']`, `['sessions']`

**Database**:
- Added `'abandoned'` to `sessions_outcome_check` constraint

**Block Status (`config.ts`)**:
- `abandoned` outcome → status: `'stopped'`, label: `'Stopped (Unsaved)'`

## Files Changed
- `src/app/(app)/now/page.tsx`
- `src/lib/hooks/useSession.ts`
- `src/lib/hooks/useBlocks.ts`
- `src/lib/stores/execution-store.ts`
- `src/lib/blocks/config.ts`
- `src/types/index.ts`
- Supabase migration: `add_abandoned_outcome`

## Testing Checklist
- [ ] Start session → Stop → Undo → timer resumes from correct time
- [ ] Start session → Stop → Confirm Stop → goes to save page immediately
- [ ] Start session → Stop → wait 5s → auto-navigates to save page
- [ ] Start session → Stop → close browser → block shows "Stopped (Unsaved)"
- [ ] Complete save flow → block shows "Stopped" (not "In Progress")

## Related
- SKT-18: Block lifecycle and status display (completed)
