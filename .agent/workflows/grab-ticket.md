---
description: Rebuild context fast by reading memory files + current repo state, then propose the next actions.
---

1) Identify ticket
- If user provided a ticket ID/URL, use it.
- Else infer from branch name / recent commits; if none, use NO_TICKET.

2) Load memory
- Read `.agent/memory/current.md` if present.
- If ticket is known, read `.agent/memory/tickets/<TICKET_ID>.md` if present.

3) Inspect repo state (read-only)
- Summarize: branch, git status, last 5 commits, diff file list (no giant diffs).

4) Output a “Context Snapshot”
- Goal (1–2 lines)
- Current state (what exists)
- Decisions (do-not-re-litigate)
- Risks / unknowns

5) Propose and begin
- List next 3 actions.
- Start executing action #1 immediately.