import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
  parseSseChunk,
  streamChat,
  type ChatStreamEvent,
} from "../src/chat-client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

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

test("streamChat posts to the custom apiUrl and emits stream events in order", async () => {
  const apiUrl = "https://example.test/api/chat";
  const fetchCalls: Array<{
    input: Parameters<typeof fetch>[0];
    init: Parameters<typeof fetch>[1];
  }> = [];
  const events: ChatStreamEvent[] = [];

  globalThis.fetch = (async (input, init) => {
    fetchCalls.push({ input, init });

    return createSseResponse([
      'data: {"type":"status","message":"正在分析问题"}\n\n',
      'data: {"type":"delta","text":"你好"}\n\n',
      'data: {"type":"done"}\n\n',
    ]);
  }) as typeof fetch;

  await streamChat({
    apiUrl,
    onEvent: (event) => events.push(event),
    question: "你是谁？",
  });

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0]?.input, apiUrl);
  assert.equal(fetchCalls[0]?.init?.method, "POST");
  assert.equal(fetchCalls[0]?.init?.body, JSON.stringify({ question: "你是谁？" }));
  assert.deepEqual(fetchCalls[0]?.init?.headers, {
    "Content-Type": "application/json",
  });
  assert.deepEqual(events, [
    { message: "正在分析问题", type: "status" },
    { text: "你好", type: "delta" },
    { type: "done" },
  ]);
});

test("streamChat throws the backend JSON message for non-2xx responses", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: "超过调用限制" }), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 429,
    })) as typeof fetch;

  await assert.rejects(
    streamChat({
      apiUrl: "https://example.test/api/chat",
      onEvent: () => {},
      question: "你是谁？",
    }),
    /超过调用限制/,
  );
});

function createSseResponse(chunks: string[]) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
  );
}
