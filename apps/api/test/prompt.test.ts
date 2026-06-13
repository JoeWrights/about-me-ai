import assert from "node:assert/strict";
import test from "node:test";
import { buildResumePrompt } from "../src/chat/prompt.js";

test("buildResumePrompt constrains answers to resume context", () => {
  const prompt = buildResumePrompt({
    question: "你擅长什么技术？",
    resumeText: "Joe Wright\nSkills: React, TypeScript, NestJS",
  });

  assert.equal(prompt.messages.at(-1)?.role, "user");
  assert.match(prompt.messages[0]?.content ?? "", /只根据简历信息回答/);
  assert.match(prompt.messages[0]?.content ?? "", /无法从简历中确认/);
  assert.match(prompt.messages[0]?.content ?? "", /React, TypeScript, NestJS/);
  assert.match(prompt.messages.at(-1)?.content ?? "", /你擅长什么技术/);
});
