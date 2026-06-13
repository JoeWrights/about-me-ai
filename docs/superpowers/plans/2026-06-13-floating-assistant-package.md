# Floating Assistant Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the existing floating assistant into an internal React package built with dumi and fatherJS.

**Architecture:** Add `packages/floating-assistant` as a workspace package. Move reusable chat streaming, typewriter, component, and styles into the package, then update `apps/web` to consume it through `workspace:*`.

**Tech Stack:** pnpm workspace, turbo, TypeScript, React 19, Less, fatherJS, dumi, node:test, Biome.

---

## File Structure

- Modify: `pnpm-workspace.yaml`
  - Add `packages/*` so pnpm discovers the new component package.
- Modify: `package.json`
  - Add root scripts only if needed for package-level commands through turbo; keep existing scripts intact.
- Create: `packages/floating-assistant/package.json`
  - Define package name, exports, scripts, peer dependencies, and build/docs dependencies.
- Create: `packages/floating-assistant/tsconfig.json`
  - Use the repo TypeScript base config with React JSX support.
- Create: `packages/floating-assistant/.fatherrc.ts`
  - Configure father library build.
- Create: `packages/floating-assistant/.dumirc.ts`
  - Configure dumi docs.
- Create: `packages/floating-assistant/src/index.ts`
  - Public package exports.
- Create: `packages/floating-assistant/src/FloatingAssistant.tsx`
  - Package-owned React component.
- Create: `packages/floating-assistant/src/chat-client.ts`
  - SSE parsing and streaming client.
- Create: `packages/floating-assistant/src/typewriter.ts`
  - Typewriter helper.
- Create: `packages/floating-assistant/src/style/index.less`
  - Less implementation of the current assistant styles.
- Create: `packages/floating-assistant/test/chat-client.test.ts`
  - Migrated SSE parser tests.
- Create: `packages/floating-assistant/test/typewriter.test.ts`
  - Migrated typewriter tests.
- Create: `packages/floating-assistant/docs/index.md`
  - dumi usage documentation and examples.
- Modify: `apps/web/package.json`
  - Add `@about-me-ai/floating-assistant` as a workspace dependency.
- Modify: `apps/web/src/App.tsx`
  - Import the package component instead of app-local component.
- Delete: `apps/web/src/components/FloatingAssistant.tsx`
  - Remove duplicate implementation after migration.
- Delete: `apps/web/src/lib/chat-client.ts`
  - Remove duplicate helper after tests and app no longer use it.
- Delete: `apps/web/src/lib/typewriter.ts`
  - Remove duplicate helper after tests and app no longer use it.
- Modify: `apps/web/test/chat-client.test.ts`
  - Remove after equivalent package test exists, or rewrite if the app still needs an integration assertion.
- Modify: `apps/web/test/typewriter.test.ts`
  - Remove after equivalent package test exists.
- Modify: `apps/web/test/app-homepage.test.ts`
  - Keep homepage assertion and verify package-rendered launcher remains present.

## Task 1: Workspace Package Discovery

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Update workspace globs**

Replace the file with:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Verify pnpm can still read the workspace**

Run: `pnpm -w exec pnpm --version`

Expected: prints a pnpm version and exits successfully.

## Task 2: Package Skeleton

**Files:**
- Create: `packages/floating-assistant/package.json`
- Create: `packages/floating-assistant/tsconfig.json`
- Create: `packages/floating-assistant/.fatherrc.ts`
- Create: `packages/floating-assistant/.dumirc.ts`
- Create: `packages/floating-assistant/src/index.ts`

- [ ] **Step 1: Create `package.json`**

Create `packages/floating-assistant/package.json`:

```json
{
  "name": "@about-me-ai/floating-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/esm/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/esm/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/esm/index.d.ts",
      "import": "./dist/esm/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "father build",
    "dev": "dumi dev",
    "docs:build": "dumi build",
    "lint": "biome check src",
    "test": "tsx --test test/*.test.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.16",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "dumi": "latest",
    "father": "latest",
    "less": "latest",
    "tsx": "^4.22.4",
    "typescript": "^6.0.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

Create `packages/floating-assistant/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "types": ["node", "react", "react-dom"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts", ".dumirc.ts", ".fatherrc.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create father config**

Create `packages/floating-assistant/.fatherrc.ts`:

```ts
import { defineConfig } from "father";

export default defineConfig({
  esm: {},
});
```

- [ ] **Step 4: Create dumi config**

Create `packages/floating-assistant/.dumirc.ts`:

```ts
import { defineConfig } from "dumi";

export default defineConfig({
  outputPath: "docs-dist",
  themeConfig: {
    name: "Floating Assistant",
  },
});
```

- [ ] **Step 5: Create temporary public entry**

Create `packages/floating-assistant/src/index.ts`:

```ts
export type {
  ChatStreamEvent,
  ParsedSseChunk,
  StreamChatOptions,
} from "./chat-client";
export { parseSseChunk, streamChat } from "./chat-client";
export type { TypewriterStep } from "./typewriter";
export { takeNextCharacter } from "./typewriter";
```

- [ ] **Step 6: Install package dependencies**

Run: `CI=true pnpm install --no-frozen-lockfile`

Expected: exits successfully and updates `pnpm-lock.yaml`.

## Task 3: Move Utility Logic With Tests

**Files:**
- Create: `packages/floating-assistant/src/chat-client.ts`
- Create: `packages/floating-assistant/src/typewriter.ts`
- Create: `packages/floating-assistant/test/chat-client.test.ts`
- Create: `packages/floating-assistant/test/typewriter.test.ts`

- [ ] **Step 1: Create SSE client module**

Create `packages/floating-assistant/src/chat-client.ts`:

```ts
export type ChatStreamEvent =
  | {
      message: string;
      type: "status";
    }
  | {
      text: string;
      type: "delta";
    }
  | {
      type: "done";
    };

export type ParsedSseChunk = {
  buffer: string;
  events: ChatStreamEvent[];
};

export type StreamChatOptions = {
  apiUrl?: string;
  onEvent: (event: ChatStreamEvent) => void;
  question: string;
  signal?: AbortSignal;
};

const defaultApiUrl = "http://localhost:4000/api/chat";

export function parseSseChunk(buffer: string, chunk: string): ParsedSseChunk {
  const combined = buffer + chunk;
  const frames = combined.split("\n\n");
  const nextBuffer = frames.pop() ?? "";
  const events = frames
    .map((frame) =>
      frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s*/, ""))
        .join("\n"),
    )
    .filter(Boolean)
    .map((data) => JSON.parse(data) as ChatStreamEvent);

  return {
    buffer: nextBuffer,
    events,
  };
}

export async function streamChat({
  apiUrl = defaultApiUrl,
  onEvent,
  question,
  signal,
}: StreamChatOptions) {
  const response = await fetch(apiUrl, {
    body: JSON.stringify({ question }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(await readErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const parsed = parseSseChunk(
      buffer,
      decoder.decode(value, { stream: true }),
    );
    buffer = parsed.buffer;
    for (const event of parsed.events) {
      onEvent(event);
    }
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? "请求失败，请稍后再试。";
  } catch {
    return "请求失败，请稍后再试。";
  }
}
```

- [ ] **Step 2: Create typewriter module**

Create `packages/floating-assistant/src/typewriter.ts`:

```ts
export type TypewriterStep = {
  character: string;
  remainingText: string;
};

export function takeNextCharacter(text: string): TypewriterStep | null {
  if (!text) {
    return null;
  }

  return {
    character: text[0] ?? "",
    remainingText: text.slice(1),
  };
}
```

- [ ] **Step 3: Create SSE parser test**

Create `packages/floating-assistant/test/chat-client.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { parseSseChunk } from "../src/chat-client.js";

test("parseSseChunk parses complete SSE events and keeps partial data", () => {
  const first = parseSseChunk(
    "",
    'data: {"type":"status","message":"正在分析问题"}\n',
  );

  assert.deepEqual(first.events, []);
  assert.equal(
    first.buffer,
    'data: {"type":"status","message":"正在分析问题"}\n',
  );

  const second = parseSseChunk(
    first.buffer,
    '\ndata: {"type":"delta","text":"你好"}\n\n',
  );

  assert.deepEqual(second.events, [
    { message: "正在分析问题", type: "status" },
    { text: "你好", type: "delta" },
  ]);
  assert.equal(second.buffer, "");
});
```

- [ ] **Step 4: Create typewriter test**

Create `packages/floating-assistant/test/typewriter.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { takeNextCharacter } from "../src/typewriter.js";

test("takeNextCharacter consumes one character at a time", () => {
  const first = takeNextCharacter("你好");
  const second = takeNextCharacter(first?.remainingText ?? "");
  const third = takeNextCharacter(second?.remainingText ?? "");

  assert.deepEqual(first, { character: "你", remainingText: "好" });
  assert.deepEqual(second, { character: "好", remainingText: "" });
  assert.equal(third, null);
});
```

- [ ] **Step 5: Run package tests**

Run: `pnpm --filter @about-me-ai/floating-assistant test`

Expected: both tests pass.

## Task 4: Package Component And Less Styles

**Files:**
- Create: `packages/floating-assistant/src/FloatingAssistant.tsx`
- Create: `packages/floating-assistant/src/style/index.less`
- Modify: `packages/floating-assistant/src/index.ts`

- [ ] **Step 1: Create component implementation**

Create `packages/floating-assistant/src/FloatingAssistant.tsx`:

```tsx
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { streamChat } from "./chat-client";
import "./style/index.less";
import { takeNextCharacter } from "./typewriter";

type ChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

export type FloatingAssistantProps = {
  apiUrl?: string;
  brand?: string;
  className?: string;
  description?: string;
  idleHint?: string;
  launcherLabel?: string;
  placeholder?: string;
  streamingHint?: string;
  title?: string;
  welcomePrompts?: string[];
};

const defaultWelcomePrompts = [
  "你擅长什么技术？",
  "介绍一个项目经历",
  "你的联系方式是什么？",
];

const prefix = "about-me-ai-assistant";

export function FloatingAssistant({
  apiUrl,
  brand = "About Me AI",
  className,
  description = "我可以根据简历回答技能、经历和项目相关问题。",
  idleHint = "无需登录，已启用限流保护",
  launcherLabel = "AI",
  placeholder = "问任何与简历、项目、技能相关的问题",
  streamingHint = "正在回答...",
  title = "你好，",
  welcomePrompts = defaultWelcomePrompts,
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusSteps, setStatusSteps] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queuedTextRef = useRef("");
  const typewriterTimerRef = useRef<number | null>(null);

  const appendToLastAssistantMessage = useCallback((text: string) => {
    setMessages((current) => {
      const next = [...current];
      const lastMessage = next.at(-1);
      if (lastMessage?.role !== "assistant") {
        return [...next, createMessage("assistant", text)];
      }

      next[next.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return next;
    });
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current !== null) {
      window.clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  const startTypewriter = useCallback(() => {
    if (typewriterTimerRef.current !== null) {
      return;
    }

    typewriterTimerRef.current = window.setInterval(() => {
      const step = takeNextCharacter(queuedTextRef.current);
      if (!step) {
        stopTypewriter();
        return;
      }

      queuedTextRef.current = step.remainingText;
      appendToLastAssistantMessage(step.character);
    }, 18);
  }, [appendToLastAssistantMessage, stopTypewriter]);

  useEffect(() => stopTypewriter, [stopTypewriter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) {
      return;
    }

    setInput("");
    setIsOpen(true);
    setStatusSteps([]);
    queuedTextRef.current = "";
    stopTypewriter();
    setMessages((current) => [
      ...current,
      createMessage("user", question),
      createMessage("assistant", ""),
    ]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsStreaming(true);

    try {
      await streamChat({
        apiUrl,
        onEvent(event) {
          if (event.type === "status") {
            setStatusSteps((current) =>
              current.includes(event.message)
                ? current
                : [...current, event.message],
            );
            return;
          }

          if (event.type === "delta") {
            queuedTextRef.current += event.text;
            startTypewriter();
            return;
          }

          if (event.type === "done") {
            setStatusSteps([]);
          }
        },
        question,
        signal: abortController.signal,
      });
    } catch (error) {
      if (!abortController.signal.aborted) {
        appendToLastAssistantMessage(
          error instanceof Error ? error.message : "请求失败，请稍后再试。",
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStatusSteps([]);
    queuedTextRef.current = "";
    stopTypewriter();
  }

  const rootClassName = className ? `${prefix} ${className}` : prefix;

  return (
    <div className={rootClassName}>
      <button
        aria-label="打开关于我 AI 助手"
        className={`${prefix}__launcher`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {launcherLabel}
      </button>

      {isOpen ? (
        <aside className={`${prefix}__panel`}>
          <header className={`${prefix}__header`}>
            <div className={`${prefix}__header-row`}>
              <div>
                <p className={`${prefix}__brand`}>{brand}</p>
                <h2 className={`${prefix}__title`}>{title}</h2>
                <p className={`${prefix}__description`}>{description}</p>
              </div>
              <button
                className={`${prefix}__close`}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                关闭
              </button>
            </div>

            <div className={`${prefix}__prompts`}>
              {welcomePrompts.map((prompt) => (
                <button
                  className={`${prefix}__prompt`}
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </header>

          <div className={`${prefix}__messages`}>
            {messages.length === 0 ? (
              <div className={`${prefix}__empty`}>
                试试询问“你擅长什么技术？”或“介绍一个你做过的项目”。
              </div>
            ) : (
              messages.map((message) => (
                <article
                  className={
                    message.role === "user"
                      ? `${prefix}__message ${prefix}__message--user`
                      : `${prefix}__message ${prefix}__message--assistant`
                  }
                  key={message.id}
                >
                  {message.content ||
                    (message.role === "assistant" ? "正在准备回答..." : "")}
                </article>
              ))
            )}

            {statusSteps.length > 0 ? (
              <div className={`${prefix}__status`}>
                {statusSteps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            ) : null}
          </div>

          <form className={`${prefix}__form`} onSubmit={handleSubmit}>
            <div className={`${prefix}__input-wrap`}>
              <textarea
                className={`${prefix}__textarea`}
                disabled={isStreaming}
                onChange={(event) => setInput(event.target.value)}
                placeholder={placeholder}
                value={input}
              />
              <div className={`${prefix}__form-row`}>
                <span className={`${prefix}__hint`}>
                  {isStreaming ? streamingHint : idleHint}
                </span>
                {isStreaming ? (
                  <button
                    className={`${prefix}__stop`}
                    onClick={stopStreaming}
                    type="button"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    className={`${prefix}__send`}
                    disabled={!input.trim()}
                    type="submit"
                  >
                    发送
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      ) : null}
    </div>
  );
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    content,
    id: crypto.randomUUID(),
    role,
  };
}
```

- [ ] **Step 2: Create Less styles**

Create `packages/floating-assistant/src/style/index.less`:

```less
@prefix: about-me-ai-assistant;

.@{prefix} {
  color: #0f172a;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;

  &__launcher {
    align-items: center;
    background: #7c3aed;
    border: 0;
    border-radius: 1rem;
    bottom: 1.5rem;
    box-shadow: 0 25px 50px -12px rgb(46 16 101 / 0.4);
    color: #fff;
    cursor: pointer;
    display: flex;
    font-size: 1.5rem;
    height: 3.5rem;
    justify-content: center;
    position: fixed;
    right: 1.5rem;
    transition:
      background-color 0.2s ease,
      transform 0.2s ease;
    width: 3.5rem;
    z-index: 40;

    &:hover {
      background: #8b5cf6;
      transform: translateY(-0.125rem);
    }
  }

  &__panel {
    background: #fff;
    border: 1px solid rgb(226 232 240 / 0.7);
    border-radius: 2rem;
    bottom: 6rem;
    box-shadow: 0 25px 50px -12px rgb(15 23 42 / 0.25);
    display: flex;
    flex-direction: column;
    height: min(720px, calc(100vh - 8rem));
    overflow: hidden;
    position: fixed;
    right: 1.5rem;
    width: min(420px, calc(100vw - 2rem));
    z-index: 40;
  }

  &__header {
    border-bottom: 1px solid #f1f5f9;
    padding: 1rem 1.25rem;
  }

  &__header-row {
    align-items: flex-start;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  &__brand {
    color: #7c3aed;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    margin: 0;
    text-transform: uppercase;
  }

  &__title {
    color: #0f172a;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.5rem 0 0;
  }

  &__description {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0.25rem 0 0;
  }

  &__close,
  &__stop {
    background: transparent;
    border: 0;
    border-radius: 999px;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      background: #f1f5f9;
      color: #334155;
    }
  }

  &__prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  &__prompt {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    color: #475569;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      background: #f5f3ff;
      border-color: #ddd6fe;
      color: #6d28d9;
    }
  }

  &__messages {
    background: #f8fafc;
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  &__empty {
    background: #fff;
    border: 1px dashed #e2e8f0;
    border-radius: 1.5rem;
    color: #64748b;
    font-size: 0.875rem;
    padding: 1.25rem;
  }

  &__message,
  &__status {
    border-radius: 1.5rem;
    font-size: 0.875rem;
    line-height: 1.5rem;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
  }

  &__message--user {
    background: #7c3aed;
    color: #fff;
    margin-left: auto;
    max-width: 82%;
  }

  &__message--assistant {
    background: #fff;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
    color: #334155;
    margin-right: auto;
    max-width: 88%;
  }

  &__status {
    background: #f5f3ff;
    border: 1px solid #ede9fe;
    color: #6d28d9;
    font-size: 0.75rem;
    margin-right: auto;
    max-width: 88%;

    p {
      margin: 0;
    }
  }

  &__form {
    background: #fff;
    border-top: 1px solid #f1f5f9;
    padding: 1rem;
  }

  &__input-wrap {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 1.5rem;
    padding: 0.75rem;

    &:focus-within {
      background: #fff;
      border-color: #c4b5fd;
    }
  }

  &__textarea {
    background: transparent;
    border: 0;
    color: #1e293b;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.5rem;
    max-height: 8rem;
    min-height: 5rem;
    outline: none;
    resize: none;
    width: 100%;

    &::placeholder {
      color: #94a3b8;
    }
  }

  &__form-row {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  &__hint {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  &__send {
    background: #020617;
    border: 0;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: background-color 0.2s ease;

    &:hover {
      background: #7c3aed;
    }

    &:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }
  }
}
```

- [ ] **Step 3: Run typecheck**

Update `packages/floating-assistant/src/index.ts` to export the component after `FloatingAssistant.tsx` exists:

```ts
export type {
  ChatStreamEvent,
  ParsedSseChunk,
  StreamChatOptions,
} from "./chat-client";
export { parseSseChunk, streamChat } from "./chat-client";
export type { FloatingAssistantProps } from "./FloatingAssistant";
export { FloatingAssistant } from "./FloatingAssistant";
export type { TypewriterStep } from "./typewriter";
export { takeNextCharacter } from "./typewriter";
```

Run: `pnpm --filter @about-me-ai/floating-assistant typecheck`

Expected: exits successfully.

## Task 5: dumi Documentation

**Files:**
- Create: `packages/floating-assistant/docs/index.md`

- [ ] **Step 1: Create docs page**

Create `packages/floating-assistant/docs/index.md`:

```md
# Floating Assistant

可复用的个人 AI 悬浮助手组件。

## 基础使用

```tsx
import { FloatingAssistant } from '@about-me-ai/floating-assistant';

export default () => <FloatingAssistant />;
```

## 配置 API 地址

```tsx
import { FloatingAssistant } from '@about-me-ai/floating-assistant';

export default () => (
  <FloatingAssistant apiUrl="http://localhost:4000/api/chat" />
);
```

## 自定义文案

```tsx
import { FloatingAssistant } from '@about-me-ai/floating-assistant';

export default () => (
  <FloatingAssistant
    brand="Resume AI"
    title="你好，"
    description="我可以回答简历、项目和技能相关问题。"
    welcomePrompts={['你擅长什么技术？', '介绍一个项目经历']}
    placeholder="输入你的问题"
  />
);
```
```

- [ ] **Step 2: Build docs**

Run: `pnpm --filter @about-me-ai/floating-assistant docs:build`

Expected: dumi builds documentation into `packages/floating-assistant/docs-dist`.

## Task 6: Build Package With father

**Files:**
- Modify if needed: `packages/floating-assistant/.fatherrc.ts`
- Modify if needed: `packages/floating-assistant/package.json`

- [ ] **Step 1: Build package**

Run: `pnpm --filter @about-me-ai/floating-assistant build`

Expected: father builds `dist` with JavaScript and declaration output.

- [ ] **Step 2: If Less is not emitted, adjust father config**

If the build does not produce usable styles, update `packages/floating-assistant/.fatherrc.ts` to:

```ts
import { defineConfig } from "father";

export default defineConfig({
  esm: {},
  extraBabelPlugins: [["babel-plugin-import", { libraryName: "@about-me-ai/floating-assistant", style: true }]],
});
```

Then install the plugin:

Run: `pnpm add -D babel-plugin-import --filter @about-me-ai/floating-assistant`

Expected: dependency is added and `pnpm-lock.yaml` updates.

- [ ] **Step 3: Re-run package build after config changes**

Run: `pnpm --filter @about-me-ai/floating-assistant build`

Expected: package build exits successfully.

## Task 7: Web App Integration

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/App.tsx`
- Delete: `apps/web/src/components/FloatingAssistant.tsx`
- Delete: `apps/web/src/lib/chat-client.ts`
- Delete: `apps/web/src/lib/typewriter.ts`
- Delete or modify: `apps/web/test/chat-client.test.ts`
- Delete or modify: `apps/web/test/typewriter.test.ts`
- Modify: `apps/web/test/app-homepage.test.ts`

- [ ] **Step 1: Add workspace dependency**

Modify `apps/web/package.json` dependencies:

```json
"dependencies": {
  "@about-me-ai/floating-assistant": "workspace:*",
  "react": "^19.2.7",
  "react-dom": "^19.2.7"
}
```

- [ ] **Step 2: Update app import**

Modify `apps/web/src/App.tsx` import:

```ts
import { FloatingAssistant } from "@about-me-ai/floating-assistant";
```

Keep the render call:

```tsx
<FloatingAssistant />
```

- [ ] **Step 3: Remove migrated app-local files**

Delete:

```text
apps/web/src/components/FloatingAssistant.tsx
apps/web/src/lib/chat-client.ts
apps/web/src/lib/typewriter.ts
apps/web/test/chat-client.test.ts
apps/web/test/typewriter.test.ts
```

- [ ] **Step 4: Keep homepage test focused on app behavior**

Ensure `apps/web/test/app-homepage.test.ts` remains:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App.js";

test("App renders the approved minimal personal homepage and assistant trigger", () => {
  const html = renderToStaticMarkup(React.createElement(App));

  assert.match(html, /Joe Wright/);
  assert.match(html, /React/);
  assert.match(html, /TypeScript/);
  assert.match(html, /NestJS/);
  assert.match(html, /13800138000/);
  assert.match(html, /点击右下角 AI 助手/);
  assert.match(html, /aria-label="打开关于我 AI 助手"/);
});
```

- [ ] **Step 5: Install workspace links**

Run: `pnpm install`

Expected: workspace dependency links successfully.

## Task 8: Verification

**Files:**
- Read lints for changed files after edits.
- No code changes unless verification reveals a specific issue.

- [ ] **Step 1: Run package tests**

Run: `pnpm --filter @about-me-ai/floating-assistant test`

Expected: all package tests pass.

- [ ] **Step 2: Run package typecheck**

Run: `pnpm --filter @about-me-ai/floating-assistant typecheck`

Expected: exits successfully.

- [ ] **Step 3: Run package build**

Run: `pnpm --filter @about-me-ai/floating-assistant build`

Expected: father build exits successfully.

- [ ] **Step 4: Run web app tests**

Run: `pnpm --filter @about-me-ai/web test`

Expected: homepage test passes.

- [ ] **Step 5: Run web app typecheck**

Run: `pnpm --filter @about-me-ai/web typecheck`

Expected: exits successfully.

- [ ] **Step 6: Run root build if package and app checks pass**

Run: `pnpm build`

Expected: turbo builds affected packages successfully.

- [ ] **Step 7: Check lints for edited files**

Use the IDE lint tool on:

```text
packages/floating-assistant
apps/web/src/App.tsx
apps/web/package.json
pnpm-workspace.yaml
```

Expected: no new lint errors from the changed files.

## Notes For Execution

This workspace is not currently detected as a Git repository. Skip commit steps unless Git becomes available. If a Git repository is initialized or discovered later, make small commits after each task group without bypassing hooks.

If father or dumi config APIs differ from the installed latest versions, inspect the generated error, adjust only the package config needed to satisfy the installed version, and rerun the failed command.

