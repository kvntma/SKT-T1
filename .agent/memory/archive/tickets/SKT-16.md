# SKT-16: Non-negotiables & Routines: Recurring block templates

## Summary
- **Implemented Recurring Routines**: Users can now define standard routines (e.g., Morning Routine, Gym) that automatically appear on their schedule.
- **Database Schema**: Created `routines` table and added `routine_id` to `blocks`.
- **Auto-Population**: Built `useRoutineSync` hook that spawns blocks for today's routines on app load.
- **Non-negotiable Logic**: 
    - Added 🔒 lock icon to routine blocks.
    - Routine blocks cannot be deleted from the daily view.
    - AI Refactor treats routine blocks as **Fixed Anchors** (unmovable).
- **Settings UI**: Added a "Routines" management section in Settings for CRUD of templates including Time, Duration, Recurrence Days, and Hard/Soft non-negotiable status.

## Decisions
- **Anchoring**: All routines are treated as fixed anchors by the AI to preserve their intended timing.
- **Provider Pattern**: Used `RoutineSyncProvider` in the app shell to ensure synchronization happens in the background.

## Current State
- Feature complete and verified via build.
- Auto-population is functional for the current day.

## Next Steps
- [ ] Add routine completion stats to the `/stats` page.
- [ ] Implement "Soft" non-negotiable logic (allowing them to be pushed with a reason).