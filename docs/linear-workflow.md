# Linear → Push To Start Workflow

## Overview

Linear serves as the **source of truth** for all tasks, routines, and goals. Push To Start syncs from Linear and handles execution tracking.

```
┌─────────────┐     sync      ┌─────────────┐    execute    ┌─────────────┐
│   Linear    │ ──────────▶  │  Supabase   │ ──────────▶  │   /now UI   │
│  (Planning) │              │   (Tasks)   │              │ (Execution) │
└─────────────┘              └─────────────┘              └─────────────┘
       │                            │                            │
       │                            ▼                            │
       │                     ┌─────────────┐                     │
       │◀──── feedback ──────│   Metrics   │◀──── telemetry ─────│
       │                     └─────────────┘                     │
```

## Label System

### Type Labels (Required - pick one)
| Label | Color | Purpose |
|-------|-------|---------|
| 🎯 Goal | Green | Multi-week outcome-based objectives |
| ⚡ Task | Amber | Single-block executable items |
| 🔄 Routine | Purple | Recurring habits and rituals |

### Domain Labels (Optional - pick one)
| Label | Color | Purpose |
|-------|-------|---------|
| 🏃 Health | Red | Physical fitness, recovery |
| 💼 Career | Blue | Work, professional development |
| 🧠 Learning | Teal | Skill development, education |
| 🏠 Life | Pink | Personal, home, relationships |

### System Labels
| Label | Purpose |
|-------|---------|
| 🔧 System | Improvements to execution system itself |

## Workflow States

```
Backlog → Todo → In Progress → In Review → Done
                    │                        │
                    └────── Canceled ◀───────┘
```

## Ticket Hygiene & Deduplication

To avoid disjointed updates and redundant tickets during rapid iteration:

### 1. Search-First Mandate
Before creating a new ticket or starting work on a "new" idea, search Linear for similar keywords or existing goals.
- **Rule**: If a similar ticket exists (even if in "Backlog"), **Update** it instead of creating a new one.
- **Goal**: Consolidate intent into single points of truth.

### 2. Updating Over Creating
If a new idea is an evolution of an existing task:
- Append the new idea as a **Sub-issue** or a **Comment** to the existing ticket.
- Adjust the **Estimate** and **Priority** of the original ticket to reflect the change.

### 3. State Management
- Use **Canceled** for items that were determined to be duplicates or superseded by better ideas.
- Document *why* it was canceled to preserve context.

| State | Meaning |
|-------|---------|
| **Backlog** | Captured but not scheduled |
| **Todo** | Committed for this week/cycle |
| **In Progress** | Actively being executed |
| **In Review** | Completed, awaiting verification |
| **Done** | Verified complete |
| **Canceled** | Won't do / duplicate |

## Creating Items in Linear

### Goals (🎯)
Multi-week, outcome-based. Break into sub-issues.

```
Title: Ship MVP execution loop
Labels: 🎯 Goal, 💼 Career
Estimate: 8 points
Description:
  - Success criteria: /now screen works
  - Timebox: 2 weeks
```

### Tasks (⚡)
Single-block executable. Clear, specific, actionable.

```
Title: Build timer component for /now screen
Labels: ⚡ Task, 💼 Career
Estimate: 2 points
Parent: Ship MVP execution loop
```

### Routines (🔄)
Recurring. Mark done daily, Linear auto-reopens.

```
Title: Morning deep work block
Labels: 🔄 Routine, 🏃 Health
Estimate: 1 point
Description:
  - 6:00 AM - 8:00 AM
  - No phone first hour
```

## Sync Behavior

### Linear → Supabase
- Issues sync to `tasks` table
- Labels determine `task_type` and `domain`
- State maps to internal state
- Sub-issues link via `parent_id`

### Supabase → Linear (on session complete)
- Post comment with execution summary
- Update estimate (decrement on progress)
- Move state if milestone reached

## Example Usage

### Weekly Planning (Sunday)
1. Review Linear backlog
2. Move items to "Todo" for the week
3. Set estimates and due dates
4. App syncs and shows week view

### Daily Execution
1. Open `/now` - shows current block
2. Press "Start" - session begins
3. Timer runs, work happens
4. Press "Done" or "Stop"
5. `/save` prompts for next step
6. Metrics logged, Linear updated

### Weekly Review (Friday)
1. Check burndown in Linear
2. Review metrics in app
3. Create 🔧 System issues for improvements
4. Archive completed goals
