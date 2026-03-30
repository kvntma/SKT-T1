# SKT-OBSIDIAN-PIVOT: Pivot to Obsidian-First Architecture

## Status
- **Date:** 2026-03-28 (Saturday)
- **Outcome:** Successful Pivot to Local-First Obsidian Vault Database

## Problem Definition
- The cloud-based Supabase model introduced unnecessary friction for personal use.
- The user's primary second brain is in Obsidian, leading to duplicated data.
- The goal was to make the app a focused execution layer for the Obsidian vault.

## Decisions Made
- **Vault Access:** Use WSL file system access to directly read/write markdown notes.
- **Data Model:** Daily Notes (`Zettelkasten/Journal`) are the primary task source.
- **AI Integration:** Use Anthropic (Claude 3.5 Sonnet) as the planning brain.
- **Hosting:** Host locally on WSL, accessible via Cloudflare Tunnels for the custom domain.
- **Auth:** Remove user-level auth since this is a personal-use local application.

## Changes Implemented
- [x] Uninstall `@supabase/supabase-js` and `@supabase/ssr`.
- [x] Create `src/lib/obsidian.ts` for file system utilities.
- [x] Create `/api/chat` for tool-calling (read/write Obsidian notes).
- [x] Create `/review` chat UI for daily planning.
- [x] Create `/api/obsidian/tasks` for task synchronization.
- [x] Update `/now` and `/save` to pull/push from the vault.
- [x] Update Sidebar and Bottom navigation to include the "Review" tab.
- [x] Configure Obsidian Templater settings directly in `data.json`.
- [x] Add vault to Gemini workspace context.

## Technical Details
- **Date Handling:** `date-fns` used for formatting; must escape `J-` prefix as `'J'-` in format strings.
- **AI SDK:** Using `ai` (Vercel AI SDK) with `@ai-sdk/anthropic`.
- **Tools:** `getDailyNote`, `createDailyNote`, `updateTaskStatus`, `addTaskToNote`, `moveTaskToTomorrow`, `readGenericNote`.

## Next Steps (Transitioned)
1.  **Mark Done Write-back**: Wire up the "Done" button on the `/now` screen to the `updateTaskStatus` API.
2.  **Session Metadata**: Add session duration as a sub-bullet in the markdown note.
3.  **Local State Persistence**: Ensure the timer doesn't reset on page refresh using `localStorage`.
4.  **Cloudflare Tunnel Setup**: Securely expose the local Next.js app to the internet.
