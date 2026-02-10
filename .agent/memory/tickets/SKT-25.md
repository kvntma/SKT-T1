# Ticket SKT-25: Feature: /now Quickstart & Ad-hoc Execution
Last updated: 2026-02-10 11:43 local

**Status**: [Backlog -> In Progress]
**Priority**: [Medium]
**Assignee**: [Agent]

## Description
Enable frictionless execution when no block is currently scheduled or to start upcoming blocks early.

**1. Early Start (Upcoming Context)**
*   If a block is scheduled within the next high-probability window (e.g., 60 mins), display it on `/now` below the active area.
*   **UI:** Reuse the Block Card component (visually distinct, e.g., "Up Next").
*   **Action:** "Start Now" button shifts the execution window to present.

**2. Quickstart Modal (Ad-Hoc)**
*   **Trigger:** Available when no block is running ("What are you doing?").
*   **Section A: Generic Buckets (Fastest)**
    *   One-tap start for standard types: "Deep Work" (25m), "Admin" (15m), "Recovery" (5m).
    *   Creates a provisional block immediately.
*   **Section B: Upcoming Queue**
    *   List the next 5 scheduled blocks (scrollable/list view).
    *   Selecting a block re-schedules it to *Now*.

## Acceptance Criteria
- [ ] Show "Early Start" block if scheduled within 60 mins.
- [ ] Implement Quickstart Modal triggered from "What are you doing?" empty state.
- [ ] Quickstart options: 25m Deep Work, 15m Admin, 5m Recovery.
- [ ] Quickstart: List next 5 scheduled blocks to pull forward.
- [ ] Ensure provisional blocks are created and started immediately.

## Decisions
- Reusing `BlockCard` for "Early Start" display.
- Design goal: Minimize decision fatigue.

## Risks
- Handling timezone correctly when pulling future blocks forward.
- Ensuring provisional blocks don't clutter the calendar if abandoned (though session logic handles abandonment).
