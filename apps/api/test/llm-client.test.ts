import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOpenAiRequestTargets,
  buildOpenAiRequestBody,
  buildOpenAiRequestOptions,
  requestOpenAiStreamWithRetry,
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
  const target = buildOpenAiRequestTargets(
    new URL("https://api.deepseek.com/v1/chat/completions"),
    ["60.31.192.68"],
  )[0];

  assert.deepEqual(buildOpenAiRequestOptions("test-key", body, signal, target), {
    family: 4,
    headers: {
      Authorization: "Bearer test-key",
      "Content-Length": Buffer.byteLength(body),
      "Content-Type": "application/json",
      Host: "api.deepseek.com",
    },
    method: "POST",
    servername: "api.deepseek.com",
    signal,
  });
});

test("buildOpenAiRequestTargets replaces hostname with IPv4 addresses and preserves TLS identity", () => {
  const targets = buildOpenAiRequestTargets(
    new URL("https://api.deepseek.com/v1/chat/completions"),
    ["60.31.192.68", "123.6.42.82"],
  );

  assert.deepEqual(
    targets.map((target) => ({
      hostHeader: target.hostHeader,
      hostname: target.url.hostname,
      pathname: target.url.pathname,
      servername: target.servername,
    })),
    [
      {
        hostHeader: "api.deepseek.com",
        hostname: "60.31.192.68",
        pathname: "/v1/chat/completions",
        servername: "api.deepseek.com",
      },
      {
        hostHeader: "api.deepseek.com",
        hostname: "123.6.42.82",
        pathname: "/v1/chat/completions",
        servername: "api.deepseek.com",
      },
    ],
  );
});

test("requestOpenAiStreamWithRetry tries the next IPv4 target after a connection failure", async () => {
  const url = new URL("https://api.deepseek.com/v1/chat/completions");
  const targets = buildOpenAiRequestTargets(url, ["60.31.192.68", "123.6.42.82"]);
  const attempts: string[] = [];
  const response = { statusCode: 200 } as never;

  const result = await requestOpenAiStreamWithRetry(
    {
      apiKey: "test-key",
      body: buildOpenAiRequestBody({
        maxTokens: 20,
        messages: [{ content: "hello", role: "user" }],
        model: "deepseek-chat",
      }),
      url,
    },
    targets,
    async ({ target }) => {
      attempts.push(target.url.hostname);
      if (attempts.length === 1) {
        throw Object.assign(new Error("connect ETIMEDOUT"), {
          code: "ETIMEDOUT",
        });
      }
      return response;
    },
  );

  assert.equal(result, response);
  assert.deepEqual(attempts, ["60.31.192.68", "123.6.42.82"]);
});
