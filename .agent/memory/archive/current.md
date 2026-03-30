# Current Session: Obsidian-First Pivot

## Active Ticket
- **ID:** SKT-OBSIDIAN-PIVOT
- **Title:** Pivot Push To Start to an Obsidian-First Local Application
- **Status:** Completed

## Context
- The user decided to move away from a cloud-based Supabase model and instead use their local **Obsidian Vault** as the primary database.
- The app now acts as a "focused lens" and execution layer for the vault.
- A conversational AI (Claude 3.5 Sonnet) is integrated into the app to help with daily planning and review by reading and writing markdown notes.

## Next Steps
1. [ ] **Finalize Task Write-back**: Update the `/now` screen's "Done" handler to call an API that actually marks the task as `[x]` in the Obsidian note (not just a mock).
2. [ ] **Session Logging**: Add a tool for Claude to write "Time Spent" or "Outcome" as a sub-bullet under tasks in the daily note after a session completes.
3. [ ] **Local Persistence**: Ensure the timer state survives a page refresh (using `localStorage` in the browser).
4. [ ] **Cloudflare Tunnel**: Guide the user through setting up a tunnel so their `localhost:3000` is accessible from their custom domain.
5. [ ] **Mobile Layout**: Refine the `/now` and `/review` screens for better use on mobile devices through the custom domain.
