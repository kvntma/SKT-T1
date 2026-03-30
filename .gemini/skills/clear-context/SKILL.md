---
name: clear-context
description: Automates the cleanup of session memory and context using the Ralph Workflow. Use when the user wants to "clear context", "reset session", or "summarize and consolidate" memory to keep the context window lean and persistent.
---

# Clear Context

## Overview

This skill automates the **Ralph Workflow** memory management process. It captures the current session's progress, decisions, and next steps into persistent files, then consolidates them into a single "source of truth." This allows for a clean break in the conversation while ensuring no context is lost for the next agent or session.

## Workflow

When triggered, follow these steps in order:

### 1. Summarize Session
Perform the `summarize-session` workflow from the Ralph Workflow.
- Identify the active ticket (e.g., `SKT-OBSIDIAN-PIVOT`).
- Gather git status and recent changes.
- Write a compact summary to `.agent/memory/current.md` and `.agent/memory/tickets/<TICKET_ID>.md`.

### 2. Consolidate Memory
Perform the `consolidate-mem` workflow.
- Read `.agent/memory/current.md` and relevant ticket files.
- Produce/update `.agent/memory/current.truth.md`.
- Ensure it contains only high-signal information: stable decisions, architecture constraints, and the active TODO list.
- Keep it under 150 lines.

### 3. Finalize and Advise
- Notify the user that memory has been persisted to `.agent/memory/`.
- **CRITICAL:** Advise the user to run the `/reset` command to actually clear the active context window and start fresh with the newly consolidated memory.

## Triggering Phrases
- "Clear context"
- "Initiate clear-context"
- "Clean up memory"
- "Summarize and reset"
- "Ralph loop cleanup"

## Example Usage

**User:** "Okay, we're done with this pivot. Clear context for me."

**Agent:** 
1. (Executes Summarize Session)
2. (Executes Consolidate Memory)
3. "Context has been summarized and consolidated into `.agent/memory/current.truth.md`. You can now safely run `/reset` to clear the conversation while keeping the project state persistent."
