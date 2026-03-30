# Ticket SKT-18: Settings: Customizable Block Source Colors
Last updated: 2026-01-28 00:57 local

## Status
✅ Complete — Committed (73cfee4)

## Summary
Allow users to customize the left border colors for Manual blocks, while Calendar blocks use their actual Google Calendar colors.

## Tasks
- [x] Create Database Migration (`manual_block_color`, `calendar_block_color` on profiles)
- [x] Update Database Types
- [x] Create React Hook (`useBlockColorPreferences` with `getBlockColorClass()`)
- [x] Implement Color Picker UI in Settings (AppearanceSection component)
- [x] Connect Block Components to Dynamic Colors
- [x] Verify Tailwind JIT compatibility (static class lookup map)
- [x] Filter Push To Start calendar from sync list (prevent circular sync)
- [x] Calendar blocks use actual Google Calendar hex colors (bg + border)
- [x] Fix calendar color lookup for `calendarId::eventId` format
- [x] Fix Start Early button (fetch block by ID directly)
- [x] Add 4-hour early start confirmation dialog
- [x] Add debug block ID display on /now page

## Decisions (Do Not Revisit)
- **Manual Blocks:** Use customizable Tailwind color via `getBlockColorClass()` static lookup
- **Calendar Blocks:** Use actual calendar hex color via inline `backgroundColor` (20% opacity) and `borderLeftColor`
- **Status Priority:** "Missed" (Amber) always overrides source color
- **Tailwind JIT:** Use static class lookup map — never interpolate class names
- **Calendar ID Format:** Stored as `calendarId::eventId` — extract before `::` for color lookup
- **Start Early:** Fetch specific block by ID from Supabase, not from filtered "today" array

## Key Files Modified
- `src/app/(app)/settings/page.tsx` — AppearanceSection (manual block color only)
- `src/app/(app)/blocks/page.tsx` — Dynamic colors, calendar filtering, early start fix
- `src/components/calendar-view.tsx` — Calendar colors via inline styles, `calendars` prop
- `src/lib/hooks/useBlockColorPreferences.ts` — `getBlockColorClass()` helper
- `src/lib/hooks/useCalendar.ts` — Filter push calendar, return `allCalendars`
- `src/app/(app)/now/page.tsx` — Fetch block by ID, debug display

## Risks / Blockers
- None remaining

## References
- Commit: `73cfee4`
- Linear: [SKT-18](https://linear.app/hanwha-life/issue/SKT-18/settings-customizable-block-source-colors)
