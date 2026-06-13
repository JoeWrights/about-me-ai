import assert from "node:assert/strict";
import test from "node:test";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ChatController } from "../src/chat/chat.controller.js";
import { ChatModule } from "../src/chat/chat.module.js";

test("ChatModule can be created by Nest dependency injection", async () => {
  const app = await NestFactory.createApplicationContext(ChatModule, {
    logger: false,
  });

  try {
    assert.ok(app.get(ChatController));
  } finally {
    await app.close();
  }
});
