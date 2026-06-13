import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Injectable } from "@nestjs/common";

const defaultResumePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../content/resume.html",
);

@Injectable()
export class ResumeService {
  constructor(private readonly resumePath = defaultResumePath) {}

  getResumeText() {
    return cleanResumeHtml(readFileSync(this.resumePath, "utf8"));
  }
}

export function cleanResumeHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<(br|\/h[1-6]|\/p|\/li|\/section|\/article|\/div)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n"),
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
