import { useEffect } from "react";
import { FloatingAssistant } from "../../src";
import {
  createMockChatResponse,
  mockChatApiUrl,
} from "./mock-chat-response";

export default function BasicDemo() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (getRequestUrl(input) === mockChatApiUrl) {
        return createMockChatResponse(getQuestion(init?.body));
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div style={{ minHeight: 560, position: "relative" }}>
      <FloatingAssistant
        apiUrl={mockChatApiUrl}
        brand="Floating Assistant"
        description="这是 dumi 文档站里的 mock 演示，不需要启动后端服务。"
        idleHint="Demo 使用本地模拟流式接口"
        launcherLabel="AI"
        placeholder="试着问：你擅长什么技术？"
        title="文档站演示"
        welcomePrompts={[
          "你擅长什么技术？",
          "介绍一个项目经历",
          "这个组件怎么接入？",
        ]}
      />
    </div>
  );
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return new URL(input.url).pathname;
}

function getQuestion(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return "";
  }

  try {
    const payload = JSON.parse(body) as { question?: unknown };
    return typeof payload.question === "string" ? payload.question : "";
  } catch {
    return "";
  }
}
