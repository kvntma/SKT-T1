# Current Truth Memory
Last updated: 2026-03-28 (Saturday)

## Key Decisions (The Obsidian Pivot)
- **Source of Truth:** The **Obsidian Vault** is the database. Next.js reads and writes directly to markdown files via Node.js `fs`.
- **Hosting:** The app is **Local-First**, hosted on the user's WSL machine, but accessible via a custom domain (Cloudflare Tunnels).
- **AI Brain:** **Claude 4.5 Sonnet** (Anthropic) is the primary engine for planning, review, and vault manipulation.
- **Data Model:** 
    - Daily Notes: `Zettelkasten/Journal/J-yyyy-MM-dd.md`
    - Tasks: Bullet points `- [ ]` within daily notes.
    - Templates: Integrated user's **Templater** `Journal.md` structure.

## Architecture (Pivoted)
- **API (Next.js):** Uses Vercel AI SDK to expose Claude as an assistant with direct file system tools.
- **Frontend:** 
    - `/now`: Fetches tasks from today's Obsidian note.
    - `/review`: Conversational planning interface with the AI.
- **Sync:** Relies on **Obsidian Sync** for mobile/cross-device access (PTS acts as the execution layer on desktop).

## Progress (The Pivot Session)
- [x] Uninstall Supabase and remove cloud auth dependencies.
- [x] Create `src/lib/obsidian.ts` for local vault I/O.
- [x] Build `/api/chat` with tool-calling for Obsidian.
- [x] Build `/review` planning interface.
- [x] Rewire `/now` to show Obsidian tasks.
- [x] Update Templater settings in the vault.
- [x] Add vault to Gemini workspace.

## Key Files
- `src/lib/obsidian.ts` (Core Vault Utility)
- `src/app/api/chat/route.ts` (AI Planning Brain)
- `src/app/(app)/review/page.tsx` (Review UI)
- `src/app/(app)/now/page.tsx` (Execution View)
- `.env.local` (Vault paths & AI keys)
- `IMPLEMENTATION_PLAN.md` (New Roadmap)
