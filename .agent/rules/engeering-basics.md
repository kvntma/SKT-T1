---
trigger: always_on
---

- Safety: do not run destructive commands or irreversible changes without asking me first.
  - Don’t run destructive or irreversible commands (rm -rf, migrations that delete data, dropping tables, force pushes) without asking first.
- Don’t claim files/APIs exist unless you’ve located them in the repo.
- Prefer small diffs and incremental commits. After changes, run the fastest relevant check (lint/typecheck/tests).
- Truth: do not assume files/APIs exist; check the repo before claiming.
- Diffs: keep changes small, incremental, and easy to review.
- Quality: run the quickest relevant checks after changes (lint/typecheck/tests).
- Consistency: follow existing project patterns and avoid new deps unless necessary.
- Docs: record key decisions/next steps in `.agent/memory/current.md` when they matter.
- Security: never print secrets; use env vars; be careful with auth redirects/cookies.
- When running git commands in the agent terminal, always disable pagers using `--no-pager`.
- Avoid interactive commands (`less`, `man`, editors) unless explicitly requested.