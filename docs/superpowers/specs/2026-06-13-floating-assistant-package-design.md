# Floating Assistant Package Design

## Goal

Extract the existing web app floating assistant into a reusable internal package built with dumi and fatherJS.

The first consumer is the current `apps/web` app. The package should remain ready for a later npm release, but publishing metadata and compatibility work should stay minimal until needed.

## Current Context

- The repo is a pnpm + turbo workspace.
- The workspace currently includes only `apps/*`.
- `apps/web` uses React 19, Rsbuild, Tailwind 4, and TypeScript.
- The assistant is currently implemented in `apps/web/src/components/FloatingAssistant.tsx`.
- Supporting logic lives in `apps/web/src/lib/chat-client.ts` and `apps/web/src/lib/typewriter.ts`.
- The current UI depends on Tailwind utility classes, which makes it less portable as a standalone component package.

## Recommended Approach

Create a new workspace package at `packages/floating-assistant`.

The package will contain:

- A React component entrypoint exported as `FloatingAssistant`.
- SSE chat client utilities, including `streamChat` and `parseSseChunk`.
- Typewriter utilities, including `takeNextCharacter`.
- Less-based component styles.
- dumi documentation and demos.
- fatherJS build configuration.

Update `pnpm-workspace.yaml` to include `packages/*`, and update `apps/web` to depend on the package through `workspace:*`.

## Package API

The component should preserve the existing default behavior while allowing the app to configure product-specific text and API details.

Planned public API:

```ts
export type FloatingAssistantProps = {
  apiUrl?: string;
  brand?: string;
  title?: string;
  description?: string;
  welcomePrompts?: string[];
  placeholder?: string;
  idleHint?: string;
  streamingHint?: string;
  launcherLabel?: string;
  className?: string;
};
```

Default values should match the current About Me AI experience:

- Brand: `About Me AI`
- Title: `你好，`
- Description: `我可以根据简历回答技能、经历和项目相关问题。`
- Welcome prompts: `你擅长什么技术？`, `介绍一个项目经历`, `你的联系方式是什么？`
- Placeholder: `问任何与简历、项目、技能相关的问题`
- Idle hint: `无需登录，已启用限流保护`

The package should also export the stream event types so app code and tests can share them if needed.

## Styling

Use Less for package styles.

The package should not rely on the consuming app's Tailwind configuration. Existing Tailwind classes should be translated into package-owned class names and Less rules.

Use a stable prefix such as `about-me-ai-assistant` to reduce collision risk.

The package entry may import its own Less file so the current app can consume the component with minimal setup. If father emits a separate CSS file, document the import path in dumi.

## Build And Documentation

Use fatherJS for library output:

- ESM output for modern bundlers.
- Type declarations.
- React and React DOM as peer dependencies.
- Less handled as package styling rather than app-local Tailwind.

Use dumi for docs:

- A basic component usage page.
- A configurable props example.
- Notes for setting the API endpoint.
- A small mock/demo strategy for the chat stream where possible, so docs can render without the Nest API running.

## App Integration

`apps/web` should stop importing `./components/FloatingAssistant` directly.

It should import from the new package:

```ts
import { FloatingAssistant } from "@about-me-ai/floating-assistant";
```

The app can pass the runtime API URL explicitly. If retaining the current `PUBLIC_API_URL` behavior is cleaner in the app, keep that environment lookup in `apps/web` and pass the resolved value into the component.

After migration, remove the duplicated app-local component and helper modules if they are no longer used.

## Tests

Keep tests focused on behavior that is easy to regress:

- `parseSseChunk` parses complete frames and preserves partial buffers.
- `takeNextCharacter` returns one character and remaining text.
- Component-level smoke test if the repo already has a suitable React test setup; otherwise rely on typecheck and dumi/father build for the first extraction.

The existing `apps/web` tests should be updated to import helpers from the new package where appropriate.

## Non-Goals

- Do not add full npm publishing automation yet.
- Do not introduce a separate design system.
- Do not change the Nest API contract.
- Do not redesign the visual appearance beyond translating styles from Tailwind to Less.

## Constraints And Notes

This directory is not currently detected as a Git repository, so the design document cannot be committed from this workspace state.

