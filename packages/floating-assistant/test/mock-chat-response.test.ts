import assert from "node:assert/strict";
import test from "node:test";
import {
  createMockChatResponse,
  mockChatApiUrl,
} from "../docs/demo/mock-chat-response";
import { parseSseChunk } from "../src/chat-client";

test("createMockChatResponse emits parseable chat stream events", async () => {
  const response = createMockChatResponse("你擅长什么技术？");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/event-stream");
  assert.equal(mockChatApiUrl, "/__floating_assistant_demo_chat__");

  const payload = await response.text();
  const parsed = parseSseChunk("", payload);

  assert.deepEqual(parsed.events, [
    { message: "正在读取 demo 问题", type: "status" },
    {
      text: "你问的是“你擅长什么技术？”。",
      type: "delta",
    },
    {
      text: "这是 dumi 文档站中的模拟流式回答，可用于展示悬浮助手交互。",
      type: "delta",
    },
    { type: "done" },
  ]);
  assert.equal(parsed.buffer, "");
});
