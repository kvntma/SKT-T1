# Current Truth Memory
Last updated: 2026-01-27 22:28 local

## Key Decisions
- **Block Source Indication:** Use left-border color to distinguish Manual vs Calendar blocks.
- **Status Override:** Status colors (Amber for 'Missed') always override source colors.
- **Navigation:** Use `sessionStorage` for passing `startBlockId` between Blocks and Now page.
- **Color Defaults:** Manual = Emerald, Calendar = Zinc.

## Architecture & Constraints
- **Tailwind Dynamic Colors:** Must handle JIT trimming. Use specific safelisted classes or map full class names, do not use interpolated strings like `bg-${color}-500` without safelisting.
- **Block Fields:** `DisplayBlock` type manually maps DB fields (`google_event_id`, `linear_issue_id`) for UI consumption.
- **Hook Pattern:** `useBlockColorPreferences` wraps profile read/write for color settings.

## Active Ticket: SKT-18 (Settings Colors)
- **Goal:** User-customizable block source colors.
- **Progress:** DB migration applied, types updated, hook created. UI scaffolding in place.
- **Remaining:** Connect UI components, refactor block lists to use hook, handle Tailwind JIT.

## Known Gotchas
- **Calendar Sync:** Pushed blocks store `google_event_id`. Pulled blocks stored as normal blocks with `calendar_id`.
- **Date Handling:** `DateTimePicker` uses date-fns but DB expects ISO strings.

## TODO
- [ ] Implement Color Picker UI in Settings
- [ ] Connect `BlocksPage` and `CalendarView` to `useBlockColorPreferences`
- [ ] Verify dynamic class generation works with Tailwind
- [ ] Commit unstaged changes

## Key Files
- `src/app/(app)/blocks/page.tsx`
- `src/components/calendar-view.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/lib/hooks/useBlockColorPreferences.ts`
