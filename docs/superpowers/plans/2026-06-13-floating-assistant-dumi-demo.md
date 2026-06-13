# Floating Assistant Dumi Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runnable dumi demo for the floating assistant package that works without the API service.

**Architecture:** Keep demo-only behavior under `packages/floating-assistant/docs/demo`. A mock SSE response helper provides realistic stream events, and the dumi demo intercepts only its own mock URL before rendering the existing `FloatingAssistant` component.

**Tech Stack:** dumi, React 19, TypeScript, node:test, package-local SSE parser.

---

## File Structure

- Create: `packages/floating-assistant/docs/demo/mock-chat-response.ts`
  - Builds a mock `Response` whose body uses `text/event-stream` frames.
- Create: `packages/floating-assistant/test/mock-chat-response.test.ts`
  - Verifies the helper emits parseable `status`, `delta`, and `done` events.
- Create: `packages/floating-assistant/docs/demo/basic.tsx`
  - Installs a scoped `fetch` interceptor and renders `FloatingAssistant`.
- Create: `packages/floating-assistant/docs/index.md`
  - Displays the dumi demo and shows the real API usage snippet.

## Task 1: Mock SSE Helper

**Files:**
- Create: `packages/floating-assistant/test/mock-chat-response.test.ts`
- Create: `packages/floating-assistant/docs/demo/mock-chat-response.ts`

- [ ] **Step 1: Write the failing test**

Create a test that imports `createMockChatResponse`, reads its stream as text, and passes the result through `parseSseChunk`.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @about-me-ai/floating-assistant test`

Expected: fails because `docs/demo/mock-chat-response.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `createMockChatResponse(question: string): Response` and encode four SSE frames: one status, two deltas, and one done event.

- [ ] **Step 4: Verify green**

Run: `pnpm --filter @about-me-ai/floating-assistant test`

Expected: all package tests pass.

## Task 2: Dumi Demo And Page

**Files:**
- Create: `packages/floating-assistant/docs/demo/basic.tsx`
- Create: `packages/floating-assistant/docs/index.md`

- [ ] **Step 1: Create the demo**

Render `FloatingAssistant` with a mock `apiUrl`. Use `useEffect` to patch `window.fetch` for that URL and restore it on unmount.

- [ ] **Step 2: Create the docs page**

Add a dumi demo embed with `<code src="./demo/basic.tsx"></code>` and a real API usage snippet.

- [ ] **Step 3: Verify docs**

Run: `pnpm --filter @about-me-ai/floating-assistant docs:build`

Expected: dumi builds the documentation site into `docs-dist`.

## Task 3: Final Verification

**Files:**
- Read lints for edited package files.

- [ ] **Step 1: Run package typecheck**

Run: `pnpm --filter @about-me-ai/floating-assistant typecheck`

Expected: exits successfully.

- [ ] **Step 2: Run package tests**

Run: `pnpm --filter @about-me-ai/floating-assistant test`

Expected: all package tests pass.

- [ ] **Step 3: Read IDE lints**

Use the IDE lint tool for `packages/floating-assistant` and the new docs files.

Expected: no new diagnostics caused by this change.
