import assert from "node:assert/strict";
import test from "node:test";
import { resolveWorkspaceEnvPath } from "../src/config/env.js";

test("resolveWorkspaceEnvPath points to the monorepo root .env file", () => {
  assert.match(resolveWorkspaceEnvPath(), /about-me-ai\/\.env$/);
});
