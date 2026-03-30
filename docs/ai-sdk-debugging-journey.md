# Vercel AI SDK (v6.x) Debugging Journey & Solutions

This document chronicles the challenges and solutions encountered while integrating the Vercel AI SDK (Anthropic provider) with a Next.js application, targeting AI SDK version `^6.0.141`. The primary goal was to establish a multi-step agent workflow that interacts with a local Obsidian vault.

---

## 1. Initial Setup & Basic Chat UI

**Problem:** `Module not found: ai/react`
- **Context:** Occurred when trying to import `useChat` from `ai/react`.
- **Cause:** In SDK v4+, React hooks were moved to `@ai-sdk/react`.
- **Solution:** Changed import to `import { useChat } from '@ai-sdk/react';`
- **Relevant File:** `src/app/(app)/review/page.tsx`

---

## 2. Input Handling & Button Functionality

**Problem:** `input.trim() is broken` / `handleInputChange is not a function`
- **Context:** The "Send" button was disabled, or form submission failed.
- **Cause:** SDK v6.x changed the `useChat` hook's return signature. `input`, `handleInputChange`, and `handleSubmit` are no longer directly provided.
- **Solution:** Manually managed `input` state using `useState` and used `sendMessage({ text: currentInput })` from the `useChat` hook. `.trim()` was re-enabled on the manual `input` state.
- **Relevant File:** `src/app/(app)/review/page.tsx`

---

## 3. Backend API Response Handling

**Problem:** `TypeError: result.toDataStreamResponse is not a function` (and similar for `toAIStreamResponse`)
- **Context:** Occurred in `src/app/api/chat/route.ts` when returning the `streamText` result.
- **Cause:** SDK v6.x (or the specific version installed) moved away from direct methods on `streamText` results for complex streaming responses in favor of agent-specific helpers.
- **Solution Path:**
    1.  Initially tried removing `await` from `streamText` (correct, as `streamText` returns synchronously).
    2.  Tried `result.toAIStreamResponse()` (failed).
    3.  Attempted `createDataStreamResponse` and `createTextStreamResponse` (failed due to "export not found" errors, confirming they were not direct exports in this version).
    4.  **Temporary Solution:** Used `result.toTextStreamResponse()` to get *any* text streaming, but this lacked tool call information.
    5.  **Final Solution:** Identified and adopted the `ToolLoopAgent` pattern with `createAgentUIStreamResponse`.
- **Relevant File:** `src/app/api/chat/route.ts`

---

## 4. Anthropic Tool Schema Validation

**Problem:** `Error [AI_APICallError]: tools.0.custom.input_schema.type: Field required`
- **Context:** Anthropic API rejected tool calls, stating `input_schema.type: Field required`.
- **Cause:** A known bug in AI SDK v6.x (around `6.0.49` and `Zod 4`) where Zod schemas for tools were not correctly serialized to JSON Schema, omitting `type: "object"`.
- **Solution:** Wrapped the Zod schema with `jsonSchema()` from `ai` and manually specified `type: 'object'`, `properties`, and `required` fields. Also discovered that SDK v6.x uses `inputSchema` instead of `parameters` in the `tool()` definition.
- **Relevant File:** `src/app/api/chat/route.ts`

---

## 5. UI Rendering of Multi-part Messages

**Problem:** UI showed "AI:" with no content, even when tools executed.
- **Context:** The AI was performing tool calls and returning results, but the `m.content` property in the `useChat` messages array was empty.
- **Cause:** Newer SDK versions return complex `UIMessage` objects with a `parts` array (containing text, tool calls, reasoning, etc.) instead of a simple `content` string.
- **Solution:** Updated the frontend rendering logic to iterate through `m.parts` and conditionally render based on `part.type` (e.g., `text`, `reasoning`, `tool-searchNotes`).
- **Relevant File:** `src/app/(app)/review/page.tsx`

---

## 6. Multi-Step Agent Workflow & Synthesis

**Problem:** AI stopped after a tool call (`finishReason: tool-calls`), failing to summarize.
- **Context:** Despite `maxSteps` and a strong system prompt, the AI wouldn't proceed from tool execution to text synthesis.
- **Cause:** The `createUIMessageStreamResponse` (and `toUIMessageStreamResponse`) functions were not correctly orchestrating the multi-step `streamText` agent loop in this specific SDK version, causing premature termination.
- **Solution:** Migrated to the `ToolLoopAgent` pattern. This involves instantiating a `ToolLoopAgent` with the model, instructions, and tools, and then passing this agent to `createAgentUIStreamResponse`. This pattern is explicitly designed for multi-step agentic workflows where the agent manages the internal `streamText` calls, tool execution, and response synthesis.
- **Relevant File:** `src/app/api/chat/route.ts`

---
