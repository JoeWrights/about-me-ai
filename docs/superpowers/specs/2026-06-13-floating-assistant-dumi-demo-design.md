# Floating Assistant Dumi Demo Design

## Goal

Add a runnable dumi demo for `@about-me-ai/floating-assistant` so the component can be viewed and tried inside the package documentation site without starting the API server.

## Approach

The dumi page will live in `packages/floating-assistant/docs/index.md`. It will embed a demo from `packages/floating-assistant/docs/demo/basic.tsx`.

The demo will use a package-local mock chat endpoint instead of `http://localhost:4000/api/chat`. The mock endpoint will return a `Response` with a `text/event-stream` body containing the same event shapes consumed by `streamChat`: `status`, `delta`, and `done`.

## Components

- `packages/floating-assistant/docs/demo/mock-chat-response.ts`: builds a mock SSE `Response` from a question.
- `packages/floating-assistant/docs/demo/basic.tsx`: renders `FloatingAssistant` with customized copy and a mock `apiUrl`.
- `packages/floating-assistant/docs/index.md`: shows the interactive dumi demo and a short real API usage example.
- `packages/floating-assistant/test/mock-chat-response.test.ts`: verifies the mock endpoint emits parseable SSE events.

## Data Flow

1. The dumi demo registers a temporary `window.fetch` interceptor for one mock URL.
2. `FloatingAssistant` submits to that mock URL through its existing `apiUrl` prop.
3. The mock response streams SSE frames.
4. The existing `streamChat` parser reads those frames and updates the component.

## Error Handling

The fetch interceptor only handles the demo mock URL. All other requests are delegated to the original `fetch`. The interceptor is restored when the demo unmounts.

## Testing

Add a focused test for the mock SSE response helper, then run package tests, typecheck, and docs build.
