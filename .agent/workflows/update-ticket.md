---
description: Update the memory file for the active ticket (progress, decisions, blockers, next steps) and keep current.md aligned.
---

1) Determine ticket ID
- If user provided one, use it.
- Else infer from branch name, PR title, commit messages, or `.agent/memory/current.md`.
- Can also infer multiple tickets
- If none found, ask for a ticket ID and stop.

2) Collect current state (read-only)
- Summarize: branch, git status, last 5 commits, and diff file list (no large diffs).
- Identify what changed since the last ticket update.

3) Load existing ticket memory
- Read `.agent/memory/tickets/<TICKET_ID>.md` (if it exists).

4) Write/update ticket memory
- Create or update `.agent/memory/tickets/<TICKET_ID>.md` with:
  - Ticket goal (1–2 lines)
  - Latest progress (bullets)
  - Decisions (do-not-revisit) + rationale
  - Current blockers / risks
  - Next steps checklist
  - References: PR/ticket links + key files touched

5) Sync current.md (lightly)
- Ensure `.agent/memory/current.md` includes:
  - Ticket ID
  - Current goal
  - Top 3 next steps
  - Link/path to the ticket memory file

6) Output in chat
- Confirm files updated
- Print only the updated “Next steps” checklist
