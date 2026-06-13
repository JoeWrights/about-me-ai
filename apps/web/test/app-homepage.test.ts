import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App.js";

test("App renders the approved minimal personal homepage and assistant trigger", () => {
  const html = renderToStaticMarkup(React.createElement(App));

  assert.match(html, /Joe Wright/);
  assert.match(html, /React/);
  assert.match(html, /TypeScript/);
  assert.match(html, /NestJS/);
  assert.match(html, /13800138000/);
  assert.match(html, /点击右下角 AI 助手/);
  assert.match(html, /aria-label="打开关于我 AI 助手"/);
});
