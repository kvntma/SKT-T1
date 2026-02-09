---
description: Summarize the current work session into a persistent memory file to keep agent context fast and portable.
---

## Goal
Create/update a concise “current truth” summary so a fresh agent can resume work without replaying chat history.

## Steps

1) Identify the active work item
- Infer ticket ID from (in order): branch name, PR title, commit messages, or recent notes.
- If no ticket ID is discoverable, use `NO_TICKET`.

2) Gather repo state (read-only)
- Capture:
  - current branch name
  - `git status` summary
  - last 5 commits (hash + message)
  - current staged/unstaged diff summary (filenames + short intent)
- Do not paste huge diffs; only summarize.

3) Produce a high-signal session summary (bullets, not paragraphs)
Write a compact summary with these sections:

### Summary
- 3–8 bullets: what changed and why (outcomes, not narration)

### Decisions (Do Not Re-litigate)
- bullets: decision + rationale (1 line each)

### Current State
- what exists now (features, endpoints, flags, configs, files touched)

### Open Questions / Risks
- bullets: unknowns, gotchas, blockers, assumptions

### Next Steps
- 3–10 checkbox items, ordered

### References
- ticket link (if known)
- PR link (if known)
- key files touched (top 5–15)

4) Write to persistent memory files
- Always write/update: `.agent/memory/current.md`
- Also write/update per ticket when available:
  - `.agent/memory/tickets/<TICKET_ID>.md` (skip if `NO_TICKET`)

5) Keep memory files from bloating
- If `.agent/memory/current.md` exceeds ~250 lines:
  - compress older sections into a single “Previous Context (compressed)” block
  - keep the newest summary fully detailed

6) Output in chat (confirmation + next)
- Print:
  - where the summary was written
  - detected ticket ID
  - the “Next Steps” checklist (only)

## Output format for `.agent/memory/current.md`

# Current Work Memory
Last updated: <YYYY-MM-DD HH:MM local>

Ticket: <TICKET_ID or NO_TICKET>
Branch: <branch>

## Summary
- ...

## Decisions (Do Not Re-litigate)
- ...

## Current State
- ...

## Open Questions / Risks
- ...

## Next Steps
- [ ] ...
- [ ] ...

## References
- Ticket:
- PR:
- Files:
  - path/to/file