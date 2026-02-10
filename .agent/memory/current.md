# Current Work Memory
Last updated: 2026-02-09 22:35 local

Ticket: SKT-33 (Allow blocks in PTS to be moved across days)
Branch: kvntma/skt-33-allow-blocks-in-pts-to-be-moved-across-days-in-calendar-view

## Summary
- **Fixed SKT-28**: Resolved issue where short calendar blocks were illegible.
- **Changes**:
    - Increased minimum block height to 26px in `CalendarView`.
    - Added responsive styling in `DraggableBlock` based on height.
    - Reduced padding (down to `p-0.5`) for short blocks.
    - Hid time string for blocks under 40px height.
    - Vertically centered content in short blocks.

## Next Steps
- [ ] User to verify fix in the calendar view with 15-minute blocks.
- [ ] Resume work on SKT-31 (Allow Editing Task Name on Completion).
