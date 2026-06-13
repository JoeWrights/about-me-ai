import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloatingAssistant } from "../src/index.js";

const stylesPath = fileURLToPath(
  new URL("../src/style/index.css", import.meta.url),
);

test("FloatingAssistant renders the launcher with configurable label", () => {
  const markup = renderToStaticMarkup(
    createElement(FloatingAssistant, { launcherLabel: "问" }),
  );

  assert.match(markup, /打开关于我 AI 助手/);
  assert.match(markup, />问</);
});

test("FloatingAssistant uses compact chat-first panel spacing", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(
    styles,
    /--assistant-panel-max-height:\s*min\(680px, calc\(100vh - 6rem\)\)/,
  );
  assert.match(styles, /--assistant-header-padding:\s*0\.75rem 1rem/);
  assert.match(styles, /--assistant-message-padding:\s*0\.75rem 1rem/);
  assert.match(styles, /--assistant-textarea-min-height:\s*3\.25rem/);
  assert.match(styles, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
});
