import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("docs index keeps usage snippets as pure source blocks", () => {
  const markdown = readFileSync("docs/index.md", "utf8");
  const executableTsxBlocks = [...markdown.matchAll(/^```tsx\n/gm)];

  assert.equal(executableTsxBlocks.length, 0);
  assert.match(markdown, /```tsx \| pure\n/);
  assert.match(markdown, /<code src="\.\/demo\/basic\.tsx"><\/code>/);
});
