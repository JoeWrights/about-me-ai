import assert from "node:assert/strict";
import test from "node:test";
import { cleanResumeHtml } from "../src/resume/resume.service.js";

test("cleanResumeHtml extracts readable text and removes scripts", () => {
  const html = `
    <html>
      <head><style>.hidden { display: none; }</style></head>
      <body>
        <h1>Joe Wright</h1>
        <script>alert("ignore")</script>
        <p>Frontend engineer&nbsp;with React experience.</p>
      </body>
    </html>
  `;

  const text = cleanResumeHtml(html);

  assert.equal(text, "Joe Wright\nFrontend engineer with React experience.");
});
