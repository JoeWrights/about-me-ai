import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App.js";

const stylesPath = fileURLToPath(new URL("../src/styles.css", import.meta.url));

test("App renders the personal homepage and assistant trigger", () => {
  const html = renderToStaticMarkup(React.createElement(App));

  assert.match(html, /Hi，我是 Joe Wright/);
  assert.match(html, /有什么想问我的吗/);
  assert.match(html, /如果你愿意，我可以直接回答这些问题/);
  assert.match(html, /关于我/);
  assert.match(html, /目前重点/);
  assert.match(html, /可以这样问/);
  assert.match(html, /React/);
  assert.match(html, /Vue/);
  assert.match(html, /TypeScript/);
  assert.match(html, /Qiankun/);
  assert.match(html, /Monorepo/);
  assert.match(html, /问我的项目/);
  assert.match(html, /常见开场/);
  assert.doesNotMatch(html, /NestJS/);
  assert.doesNotMatch(
    html,
    /Contact|Stack|Github|13800138000|github\.com\/joe-wright/,
  );
  assert.doesNotMatch(html, /这里是我的个人主页/);
  assert.doesNotMatch(
    html,
    /产品页|可部署的产品|AI Profile Console|Indexed memory map/,
  );
  assert.match(html, /aria-label="打开关于我 AI 助手"/);
});

test("App renders the A-direction AI brand mark with restrained motion", () => {
  const html = renderToStaticMarkup(React.createElement(App));
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(html, /aria-label="About Me AI 品牌标识"/);
  assert.match(html, /class="[^"]*ai-logo-mark/);
  assert.match(html, /AI/);
  assert.match(styles, /@keyframes aiLogoPulse/);
  assert.match(styles, /@keyframes aiLogoFloat/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
