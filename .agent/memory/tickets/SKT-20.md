# Ticket SKT-20: Refactor: Draggable Blocks & AI Schedule Orchestration
Last updated: 2026-02-08 local

## Status
[To Do]

## Summary
Transform the static calendar view into a dynamic, draggable orchestration engine with AI refactoring capabilities.

## Requirements
- [ ] Draggable blocks on the time-grid (Manual + PTS blocks)
- [ ] AI "Refactor" button to dynamically reschedule based on day progress
- [ ] AI respects external GCal anchors
- [ ] User confirmation/review flow for AI changes

## Proposed Implementation
- **Frontend**: Integrate `@dnd-kit` into `CalendarView` and `BlocksPage`.
- **API**: `/api/blocks/refactor` using OpenAI/Gemini to analyze schedule.
- **State**: Update `useBlocks` for bulk updates.

## Decisions
- AI only moves PTS blocks.
- Manual "Commit" stage for AI proposals.

## References
- Linear: [SKT-20](https://linear.app/hanwha-life/issue/SKT-20/refactor-draggable-blocks-and-ai-schedule-orchestration)
- PRD Section 6.7, 6.8
