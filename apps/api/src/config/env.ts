import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export function resolveWorkspaceEnvPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../../../.env");
}

export function loadWorkspaceEnv() {
  config({ path: resolveWorkspaceEnvPath(), quiet: true });
}
