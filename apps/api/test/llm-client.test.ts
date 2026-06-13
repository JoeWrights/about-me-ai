import assert from "node:assert/strict";
import test from "node:test";
import { buildOpenAiRequestBody } from "../src/chat/llm-client.js";

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
