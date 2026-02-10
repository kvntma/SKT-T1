# SKT-27: Refactor Calendar: Day/3-Day/Week Views & Desktop Expansion

## Context
Major refactor of the Calendar component to improve usability and density. The goal is to provide a robust planning surface that feels less "flimsy".

## Goal
Implement toggles for Day, 3-Day, and Week views and ensure the calendar expands to fill available space on desktop.

## Requirements
- [x] **View Options**: Toggles for Day, 3-Day, and Week views.
- [x] **Default Interface**: Make the calendar the default interface for the Blocks tab.
- [x] **Navigation & Interaction**:
    - [x] Vertical scrolling with Google Calendar style time slots.
    - [x] Previous/Next period navigation (1 day, 3 days, or 1 week shifts).
    - [x] Current time "Red line" indicator (only on the current day column).
- [x] **Responsiveness**: Expand to fill available width/height on Desktop.

## Progress
- [x] Initial investigation of `CalendarView` component.
- [x] Implement unified `getDisplayDays` logic.
- [x] Update UI toggles in `BlocksPage`.
- [x] Refactor `CalendarView` to a unified grid system for any number of days.
- [x] Add vertical scrolling and full 24-hour support.
- [x] Ensure "Red Line" logic is day-specific.

## Decisions
- **Unified Grid:** Replaced separate `today` and `week` layouts with a single responsive grid that adjusts column widths based on the number of days.
- **Scroll Position:** Added auto-scroll to current time (or near it) on mount for better UX.
- **Full Day Support:** Expanded view to 24 hours (0-23) to avoid cutting off late-night or early-morning blocks.
- **Default View:** Set `calendar` as the default display mode for the `/blocks` page.