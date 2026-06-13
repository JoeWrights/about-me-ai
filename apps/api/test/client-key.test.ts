import assert from "node:assert/strict";
import test from "node:test";
import { getClientKey } from "../src/chat/chat.controller.js";

const request = {
  header(name: string) {
    return name === "x-forwarded-for" ? "203.0.113.10" : undefined;
  },
  ip: "127.0.0.1",
  socket: {
    remoteAddress: "127.0.0.2",
  },
};

test("getClientKey ignores spoofable forwarded headers by default", () => {
  assert.equal(getClientKey(request), "127.0.0.1");
});

test("getClientKey can trust forwarded headers behind a configured proxy", () => {
  assert.equal(getClientKey(request, true), "203.0.113.10");
});
