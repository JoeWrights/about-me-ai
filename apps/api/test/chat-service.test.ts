import assert from "node:assert/strict";
import test from "node:test";
import { ChatService } from "../src/chat/chat.service.js";
import type { LlmClient } from "../src/chat/llm-client.js";
import type { ResumeService } from "../src/resume/resume.service.js";

function createResumeService(text: string): ResumeService {
  return {
    getResumeText() {
      return text;
    },
  } as ResumeService;
}

async function collect<T>(items: AsyncIterable<T>) {
  const result: T[] = [];
  for await (const item of items) {
    result.push(item);
  }
  return result;
}

test("ChatService emits status steps and streams LLM deltas", async () => {
  const abortController = new AbortController();
  const llmClient: LlmClient = {
    async *streamChat({ signal }) {
      assert.equal(signal, abortController.signal);
      yield "我擅长 ";
      yield "React 和 TypeScript。";
    },
  };
  const service = new ChatService(
    createResumeService("Skills: React, TypeScript"),
    llmClient,
  );

  const events = await collect(
    service.streamAnswer(
      { question: "你擅长什么？" },
      { signal: abortController.signal },
    ),
  );

  assert.deepEqual(events, [
    { message: "正在分析问题", type: "status" },
    { message: "正在匹配简历经历", type: "status" },
    { message: "正在组织回答", type: "status" },
    { text: "我擅长 ", type: "delta" },
    { text: "React 和 TypeScript。", type: "delta" },
    { type: "done" },
  ]);
});

test("ChatService returns a fallback answer when the LLM fails", async () => {
  const llmClient: LlmClient = {
    streamChat() {
      throw new Error("provider unavailable");
    },
  };
  const service = new ChatService(
    createResumeService("Skills: NestJS"),
    llmClient,
  );

  const events = await collect(
    service.streamAnswer({ question: "天气怎么样？" }),
  );

  assert.equal(events.at(-2)?.type, "delta");
  assert.match(
    events.at(-2)?.type === "delta" ? events.at(-2).text : "",
    /无法从简历中确认/,
  );
  assert.deepEqual(events.at(-1), { type: "done" });
});
