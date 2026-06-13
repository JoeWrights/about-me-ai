import assert from "node:assert/strict";
import test from "node:test";
import { ChatController } from "../src/chat/chat.controller.js";

test("ChatController falls back to default services when decorator metadata injection is unavailable", async () => {
  const controller = new ChatController(undefined, undefined);
  const chunks: string[] = [];
  const headers = new Map<string, string>();
  const request = {
    header() {
      return undefined;
    },
    ip: "127.0.0.1",
    on() {
      return request;
    },
    socket: {
      remoteAddress: "127.0.0.1",
    },
  };
  const response = {
    endCalled: false,
    end() {
      this.endCalled = true;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    write(chunk: string) {
      chunks.push(chunk);
    },
  };

  await controller.chat(
    { question: "你擅长什么技术？" },
    request as never,
    response as never,
  );

  assert.equal(headers.get("Content-Type"), "text/event-stream; charset=utf-8");
  assert.equal(response.endCalled, true);
  assert.match(chunks.join(""), /正在分析问题/);
  assert.match(chunks.join(""), /无法从简历中确认/);
});
