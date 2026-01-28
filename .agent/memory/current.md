# Current Work Memory
Last updated: 2026-01-28 00:45 local

Ticket: SKT-18
Branch: master

## Summary
**SKT-18 Implementation Complete**
- Implemented customizable block source colors for "Push To Start" (manual) blocks only.
- Calendar-synced blocks now use their actual Google Calendar color (hex) instead of a user preference.
- Created `AppearanceSection` in Settings with color swatch picker for manual blocks + info note about calendar colors.
- Updated `blocks/page.tsx` and `calendar-view.tsx` with inline style logic for calendar blocks.

## Decisions (Do Not Re-litigate)
- **Manual Blocks:** Use customizable Tailwind color class via `getBlockColorClass()`.
- **Calendar Blocks:** Use actual calendar hex color via inline `borderLeftColor` style.
- **Status Priority:** "Missed" status (Amber) always overrides source color.
- **Tailwind JIT:** Use static lookup map for Tailwind classes (never interpolate).

## Current State
- `master` branch has all SKT-18 changes ready for commit.
- Settings > Appearance section shows manual block color picker + calendar color info.
- Block list and Calendar views correctly apply:
  - User's color preference for manual blocks
  - Actual Google Calendar color for synced blocks

## Pre-existing Issues (Not SKT-18)
- `blocks/[id]/page.tsx` has type errors related to `status` property — needs separate fix.

## Next Steps
- [ ] Test in browser (Settings → Blocks → Calendar View)
- [ ] Commit changes with descriptive message
- [ ] Mark SKT-18 as Done in Linear

## References
- Ticket: [SKT-18](https://linear.app/hanwha-life/issue/SKT-18/settings-customizable-block-source-colors)
- Files Modified:
  - `src/app/(app)/settings/page.tsx` — AppearanceSection (manual color only)
  - `src/app/(app)/blocks/page.tsx` — Dynamic color via inline style for calendar blocks
  - `src/components/calendar-view.tsx` — Dynamic color via inline style + calendars prop
  - `src/lib/hooks/useBlockColorPreferences.ts` — getBlockColorClass helper
