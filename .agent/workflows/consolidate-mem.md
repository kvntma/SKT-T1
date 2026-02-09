---
description: Compress session summaries into a tight “current truth” memory file.
---


1) Read `.agent/memory/current.md` and any recent ticket memories in `.agent/memory/tickets/`.

2) Produce `.agent/memory/current.truth.md` with only:
- Stable decisions + rationale
- Current architecture constraints
- Known gotchas
- Active TODO list (short)
- Links/files that matter

3) Keep it under ~150 lines. Prefer bullets.

4) Commit and Push memory changes
- Run `git add .agent/memory/current.truth.md && git commit -m "chore(agent): consolidate current truth memory" && git push`