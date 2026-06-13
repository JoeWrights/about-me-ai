import assert from "node:assert/strict";
import test from "node:test";
import { parseWebOrigins, resolveWorkspaceEnvPath } from "../src/config/env.js";

test("resolveWorkspaceEnvPath points to the monorepo root .env file", () => {
  assert.match(resolveWorkspaceEnvPath(), /about-me-ai\/\.env$/);
});

test("parseWebOrigins supports comma-separated local and deployed origins", () => {
  assert.deepEqual(
    parseWebOrigins("http://117.72.118.82, http://localhost:3000"),
    ["http://117.72.118.82", "http://localhost:3000"],
  );
});
