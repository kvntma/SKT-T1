---
description: Rebuild context fast by reading memory files + current repo state, then propose the next actions.
---

1) Identify ticket
- If user provided a ticket ID/URL, use it.
- Else infer from branch name / recent commits / `.agent/memory/current.md`; if none, use NO_TICKET.
- If NO_TICKET: propose 3 candidate tickets from Linear using teamId `4071c41c-6ae2-4046-a717-4c54db67db20` (assigned-to-me / recently updated) IF Linear MCP is available; otherwise ask user for ticket.

2) Load local memory
- Read `.agent/memory/current.md` if present.
- If ticket is known, read `.agent/memory/tickets/<TICKET_ID>.md` if present.

3) Sync from Linear (MCP) when possible
- If Linear MCP tools are available:
  - Fetch the issue by ID/URL.
  - Fetch issue comments.
  - Fetch linked project/cycle if exposed by the tools.
  - Extract:
    - Title + description + acceptance criteria
    - Status, assignee, priority
    - Recent comments (last 5–10)
    - Any links to PRD/docs

- If Linear MCP is NOT available:
  - Ask user to paste the ticket body + AC (only once) and continue.

4) Find and read the PRD
- Preferred:
  - If the Linear issue includes a PRD link, open/read it (if accessible).
- Repo fallback:
  - Search for `PRD`, `requirements`, `spec`, or the ticket key in `/docs`, `/spec`, `/adr`, `/prd`, `/readme`.
  - If a likely PRD file is found, read it.
- If no PRD exists: note “PRD not found” and proceed with ticket as source of truth.

5) Inspect repo state (read-only; avoid pagers)
- Summarize:
  - current branch
  - git status
  - last 5 commits (`git --no-pager log -n 5 --oneline`)
  - diff file list (`git --no-pager diff --name-only` + short intent)
- Do not dump large diffs.

6) Output a “Context Snapshot”
- Goal (1–2 lines)
- Current state (what exists + what changed recently)
- Acceptance criteria (from Linear/PRD)
- Decisions (do-not-re-litigate)
- Risks / unknowns
- “What’s already done” (map commits/diff to AC items)

7) Propose and begin
- List next 3 actions.
- Start executing action #1 immediately.
- If action #1 requires code changes, create a small plan before editing.