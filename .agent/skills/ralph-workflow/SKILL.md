---
name: ralph-workflow
description: Implementation of the "Ralph" autonomous agent loop for codebase tasks. Use this when starting a new session, switching tickets, or summarizing work to maintain persistent memory and context.
---

# Ralph Workflow

The Ralph Workflow is a methodology for autonomous AI agents to manage codebase tasks iteratively, ensuring persistent context and state across sessions.

## Core Workflow Loop

### 1. Rebuild Context (`grab-ticket`)
At the start of every session or task switch, use the `grab-ticket` workflow to sync with the current state of the repo and Linear.
- **Goal:** Get a "Context Snapshot" and a plan for the next 3 actions.
- **Reference:** [grab-ticket.md](references/grab-ticket.md)

### 2. Execute & Update (`update-ticket`)
As work progresses, keep the ticket-specific memory updated.
- **Goal:** Maintain an accurate record of decisions, progress, and blockers for the active ticket.
- **Reference:** [update-ticket.md](references/update-ticket.md)

### 3. Summarize Session (`summarize-session`)
At the end of a session or a major milestone, capture the current state.
- **Goal:** Write/update `.agent/memory/current.md` so the next agent (or session) can resume immediately.
- **Reference:** [summarize-session.md](references/summarize-session.md)

### 4. Consolidate Memory (`consolidate-mem`)
Periodically compress session summaries into a tight "current truth" file.
- **Goal:** Keep the long-term memory under ~150 lines and high-signal.
- **Reference:** [consolidate-mem.md](references/consolidate-mem.md)

## Rules of Engagement

- **Persistence:** Always write to `.agent/memory/` files. Never rely solely on chat history.
- **Git Sync:** Whenever a memory file is updated, it MUST be committed immediately with a clear message (e.g., "chore(agent): update memory for SKT-13").
- **Context:** If `current.md` is missing or stale, start with `grab-ticket`.
- **Transparency:** Always output the "Next Steps" checklist after a summary.
- **Cleanliness:** Keep memory files concise. Use bullets.

## Memory Structure

- `.agent/memory/current.md`: The immediate next-action context.
- `.agent/memory/current.truth.md`: The stable, high-signal project truth.
- `.agent/memory/tickets/<TICKET_ID>.md`: Detailed history for a specific ticket.