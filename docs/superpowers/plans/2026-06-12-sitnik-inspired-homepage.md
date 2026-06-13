# Sitnik-Inspired Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dark web homepage with the approved modern minimal personal homepage inspired by https://sitnik.es/en/, while preserving the floating AI assistant.

**Architecture:** Keep the existing `App` + `FloatingAssistant` structure. Change only the homepage markup in `apps/web/src/App.tsx` and the global light color scheme in `apps/web/src/styles.css`; do not modify assistant state, layout, or streaming behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Rsbuild.

---

## File Structure

- Modify `apps/web/src/App.tsx`: replace the dark hero with a light personal homepage, using static content from the current resume.
- Modify `apps/web/src/styles.css`: switch the page color scheme to light and add a neutral background for the app shell.
- Create `apps/web/test/app-homepage.test.ts`: render `App` to static HTML and assert the approved homepage content is present.
- No changes to `apps/web/src/components/FloatingAssistant.tsx`.

### Task 1: Update Homepage UI

**Files:**
- Create: `apps/web/test/app-homepage.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write the failing homepage test**

Create `apps/web/test/app-homepage.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App";

describe("App homepage", () => {
  it("renders the approved minimal personal homepage without removing the assistant trigger", () => {
    const html = renderToStaticMarkup(React.createElement(App));

    assert.match(html, /Joe Wright/);
    assert.match(html, /React/);
    assert.match(html, /TypeScript/);
    assert.match(html, /NestJS/);
    assert.match(html, /13800138000/);
    assert.match(html, /点击右下角 AI 助手/);
    assert.match(html, /aria-label="打开关于我 AI 助手"/);
  });
});
```

- [ ] **Step 2: Run the homepage test and verify it fails**

Run from the repository root:

```bash
pnpm --filter @about-me-ai/web test
```

Expected result before implementation: the new test fails because `Joe Wright`, the skill pills, and contact content are not rendered by the current homepage.

- [ ] **Step 3: Replace the homepage markup**

Update `apps/web/src/App.tsx` to keep the `FloatingAssistant` import and render it unchanged, while replacing the dark hero with a light, minimal personal homepage:

```tsx
import { FloatingAssistant } from "./components/FloatingAssistant";

const skills = ["React", "TypeScript", "NestJS", "AI Assistant"];

const sections = [
  {
    description: "13800138000",
    title: "Contact",
  },
  {
    description: "构建个人智能问答助手，帮助访客快速了解简历、项目和技能。",
    title: "Work",
  },
  {
    description: "点击右下角 AI 助手，询问技能、经历或项目细节。",
    title: "Ask",
  },
];

export function App() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            About Me AI
          </p>
          <h1 className="mt-5 text-6xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-7xl">
            Joe Wright
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-stone-700">
            一个可以被询问经历、技能和项目判断的个人 AI 主页。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                className="rounded-full border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900"
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 border-t border-stone-300 pt-8 sm:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-lg font-semibold text-stone-950">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <FloatingAssistant />
    </main>
  );
}
```

- [ ] **Step 4: Switch global color scheme to light**

Update `apps/web/src/styles.css` so browser controls and the page background match the new light design:

```css
@import "tailwindcss";

@source "./";

:root {
  color-scheme: light;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

body {
  margin: 0;
  background: #fafaf9;
}
```

- [ ] **Step 5: Verify**

Run these commands from the repository root:

```bash
pnpm --filter @about-me-ai/web test
pnpm --filter @about-me-ai/web typecheck
pnpm --filter @about-me-ai/web lint
pnpm --filter @about-me-ai/web build
```

Expected result: each command exits with code 0. Manual check: the homepage is light/minimal and the bottom-right `AI` button still opens the assistant.
