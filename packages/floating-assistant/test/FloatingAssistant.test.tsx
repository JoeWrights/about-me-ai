import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloatingAssistant } from "../src/index.js";

test("FloatingAssistant renders the launcher with configurable label", () => {
  const markup = renderToStaticMarkup(
    createElement(FloatingAssistant, { launcherLabel: "问" }),
  );

  assert.match(markup, /打开关于我 AI 助手/);
  assert.match(markup, />问</);
});
