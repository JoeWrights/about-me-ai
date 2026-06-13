import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOpenAiRequestBody,
  buildOpenAiRequestOptions,
} from "../src/chat/llm-client.js";

test("buildOpenAiRequestBody includes a max token cap", () => {
  assert.deepEqual(
    buildOpenAiRequestBody({
      maxTokens: 300,
      messages: [{ content: "hello", role: "user" }],
      model: "test-model",
    }),
    {
      max_tokens: 300,
      messages: [{ content: "hello", role: "user" }],
      model: "test-model",
      stream: true,
      temperature: 0.3,
    },
  );
});

test("buildOpenAiRequestOptions forces model requests to IPv4", () => {
  const body = JSON.stringify({ stream: true });
  const signal = new AbortController().signal;

  assert.deepEqual(buildOpenAiRequestOptions("test-key", body, signal), {
    family: 4,
    headers: {
      Authorization: "Bearer test-key",
      "Content-Length": Buffer.byteLength(body),
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
});
