# Ticket SKT-18: Settings: Customizable Block Source Colors
Last updated: 2026-01-27 22:35 local

## Status
✅ Complete — Ready for Testing/Commit

## Summary
- Goal: Allow users to customize the left border colors for Manual vs Calendar blocks.
- DB Migration applied: Added `manual_block_color`, `calendar_block_color` to `profiles`.
- Hook created: `useBlockColorPreferences` with `getBlockColorClass()` helper.
- UI: Settings page has full Appearance section with color pickers and live preview.
- Integration: Block list and Calendar views now use dynamic colors from user preferences.

## Tasks
- [x] Create Database Migration
- [x] Update Database Types
- [x] Create React Hook (`useBlockColorPreferences`)
- [x] Implement Color Picker UI in Settings (AppearanceSection component)
- [x] Connect Block Components to Dynamic Colors
- [x] Verify Tailwind JIT compatibility (using static class lookup map)

## Implementation Details

### Settings Page
- Added `AppearanceSection` component with:
  - `ColorSwatch` — Selectable color button with ring indicator
  - `BlockPreview` — Live preview of block appearance
  - Grid of 20 Tailwind colors for selection

### Dynamic Color Class Mapping
- `getBlockColorClass(color)` in `useBlockColorPreferences.ts`
- Returns static class names like `border-l-emerald-500`
- Avoids Tailwind JIT issues with dynamic string interpolation

### Components Updated
- `blocks/page.tsx` — List view uses `colorPrefs.manualBlockColor` / `colorPrefs.calendarBlockColor`
- `calendar-view.tsx` — Receives `colorPrefs` as prop, applies to both Today and Week views

## Context
- Users wanted visual distinction between "Push To Start" blocks and "Calendar" blocks.
- Current defaults: Emerald (Manual), Zinc (Calendar).
- Amber always overrides for "Missed" status.
