# Push To Start - Obsidian-First Implementation Plan

> **Vision**: An execution layer that removes negotiation between intention and action, using your Obsidian vault as the primary source of truth.

## Technology Stack (Pivoted)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) - Hosted Locally |
| Database | Obsidian Vault (Markdown Files) |
| AI | Anthropic (Claude 4.5 Sonnet) via Vercel AI SDK |
| Sync | Obsidian Sync (Cross-device) |
| Styling | Tailwind CSS + ShadCN/ui |
| State | Zustand + React Query |
| Project Tracking | Linear (via MCP/API) |

---

## Phase 1: Obsidian Integration (COMPLETED)

**Goal**: Establish the link between the Next.js app and the local Obsidian vault.

- [x] Create `src/lib/obsidian.ts` utility for file system access to the vault.
- [x] Implement daily note parsing (J-yyyy-MM-dd format).
- [x] Configure Obsidian Templater settings via direct JSON manipulation.
- [x] Add vault to Gemini workspace context.
- [x] Create `/api/obsidian/tasks` endpoint to fetch tasks from today's note.

## Phase 2: AI Planning Engine (COMPLETED)

**Goal**: A conversational interface to manage the vault and plan the day.

- [x] Set up Vercel AI SDK with Anthropic (Claude 3.5 Sonnet).
- [x] Create `/api/chat` route with Obsidian-specific tools (`readDailyNote`, `createDailyNote`, `updateTaskStatus`, `addTaskToNote`, `moveTaskToTomorrow`).
- [x] Create `/review` chat interface for evening reflections and morning planning.
- [x] Integrate user's Templater `Journal.md` template into AI system prompts.

## Phase 3: Execution Refactor (IN PROGRESS)

**Goal**: Rewire the core `/now` loop to work with Obsidian tasks instead of Supabase blocks.

- [x] Update `/now` screen to pull tasks from the local Obsidian API.
- [x] Implement "Pick a task" UI for incomplete tasks in today's vault note.
- [ ] Implement "Mark Done" functionality that writes back to the markdown file (`- [ ]` -> `- [x]`).
- [ ] Add session logging (time spent) back into the Obsidian note.
- [ ] Handle task sub-bullets and "next obvious step" writing.

## Phase 4: Local Orchestration & Mobile

**Goal**: Ensure the app is accessible and reliable.

- [ ] Set up Cloudflare Tunnel for secure remote access to `localhost:3000`.
- [ ] Implement local persistence for the timer state (e.g., `localStorage`).
- [ ] Add "Review" reminders and mobile-friendly UI tweaks for the `/now` screen.

## Phase 5: Linear & Extended Context

**Goal**: Deepen the vault integration.

- [ ] Integrate Linear issue tracking directly into the Obsidian tasks.
- [ ] Add a "Search Vault" tool for the AI to find context in project notes.
- [ ] Implement "Habit Tracker" tools for the AI to update YAML frontmatter in daily notes.

---

## Design Principles (Non-Negotiable)

1. **Obsidian is the database**: Do not introduce a secondary database unless absolutely necessary for metadata.
2. **Friction elimination > motivation**: The AI should handle the "thinking" of planning so the user only has to "execute".
3. **Markdown as the UI**: The app's changes must be human-readable and clean within the Obsidian vault.
4. **Local-First, Global-Access**: Hosted on your machine, accessible via your domain.

---

*This app does not make the user better. It makes action cheaper.*
