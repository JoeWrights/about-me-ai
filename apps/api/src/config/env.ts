import { setDefaultResultOrder } from "node:dns";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export function resolveWorkspaceEnvPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../../../.env");
}

export function loadWorkspaceEnv() {
  config({ path: resolveWorkspaceEnvPath(), quiet: true });
}

export function parseWebOrigins(value: string | undefined) {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins && origins.length > 0 ? origins : ["http://localhost:3000"];
}

export function configureDnsForOutboundRequests() {
  setDefaultResultOrder("ipv4first");
}
