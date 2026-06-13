import assert from "node:assert/strict";
import test from "node:test";
import { takeNextCharacter } from "../src/typewriter.js";

test("takeNextCharacter consumes one character at a time", () => {
  const first = takeNextCharacter("你好");
  const second = takeNextCharacter(first?.remainingText ?? "");
  const third = takeNextCharacter(second?.remainingText ?? "");

  assert.deepEqual(first, { character: "你", remainingText: "好" });
  assert.deepEqual(second, { character: "好", remainingText: "" });
  assert.equal(third, null);
});
