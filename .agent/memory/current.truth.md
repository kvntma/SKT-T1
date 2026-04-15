# Current Truth Memory
Last updated: 2026-03-30 (Sunday)

## Key Decisions (The Obsidian Pivot)
- **Source of Truth:** The **Obsidian Vault** is the database. Next.js reads/writes to markdown files directly.
- **Architecture:** Local-First, hosted on WSL, accessible via custom domain (Cloudflare Tunnels).
- **AI Brain:** Claude 4.6 Sonnet (Anthropic) for planning and review.
- **Workflow:** Daily Notes (`Zettelkasten/Journal/J-yyyy-MM-dd.md`) are the task source.
- **Removed:** Supabase, Google Calendar Sync, and standard User Auth (Local-only).

## Architecture
- **API:** Vercel AI SDK + Anthropic for conversational planning.
- **Tools:** AI can `readDailyNote`, `createDailyNote`, `updateTaskStatus`, `addTaskToNote`, `moveTaskToTomorrow`, `searchVault`, `updateFrontmatter`, `writeNote`, `appendToNote`, `listAllNotes`, `getNearbyNotes` (Smart Connections), `runVaultAudit`, and `batchLinkFolder`.
- **Frontend:** `/now` (Execution), `/review` (Planning), `/stats` (Visual Feedback), `/blocks` (Historical view).

## Progress (The Pivot)
- [x] Uninstall Supabase & Auth dependencies.
- [x] Link WSL to Windows Obsidian Vault.
- [x] Build AI Review chat interface with "Knowledge Architect" persona.
- [x] Implement comprehensive Obsidian FS utilities (`src/lib/obsidian.ts`).
- [x] Integrate Smart Connections bridge for pre-calculated semantic data.
- [x] Integrate detailed `Journal.md` template support (YAML metadata + structured sections).
- [x] Implement "Vault Audit" and "Batch Linker" cleanup tools.
- [x] Fix React Input component console warnings.
- [x] Successfully integrated Vercel AI SDK (Anthropic) with Obsidian tools and multi-step agent workflow.
- [x] Documented AI SDK debugging journey (`docs/ai-sdk-debugging-journey.md`).

## Gotchas / Known Risks
- **WSL Access:** Ensure Windows drive remains mounted at `/mnt/c/`.
- **Date Formatting:** `date-fns` needs `'J'-` escaping for Obsidian prefix.
- **Plugin Dependencies:** `getNearbyNotes` relies on the Smart Connections plugin's local `.ajson` files.
- **Vercel AI SDK v6.x Nuances:** Requires specific `ToolLoopAgent` and `createAgentUIStreamResponse` patterns for multi-step workflows.

## Next Steps
- [ ] Run the first **Vault Audit** to map current chaos.
- [ ] Implement the `/stats` visual dashboard using metadata extracted from journal notes.
- [ ] Complete the `/now` loop refactor (Mark Done write-back, session duration logging).
- [ ] Establish the Macro/Meso/Micro hierarchy through automated synthesis.

## Key Files
- `src/lib/obsidian.ts` (Vault Utility)
- `src/app/api/chat/route.ts` (Planning Brain)
- `src/app/(app)/review/page.tsx` (Review UI)
- `src/app/(app)/now/page.tsx` (Now View)
- `docs/ai-sdk-debugging-journey.md` (AI SDK Debugging Documentation)
