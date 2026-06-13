import type { ChatStreamEvent } from "../../src/chat-client";

export const mockChatApiUrl = "/__floating_assistant_demo_chat__";

export function createMockChatResponse(question: string): Response {
  const normalizedQuestion = question.trim() || "这个问题";
  const events: ChatStreamEvent[] = [
    { message: "正在读取 demo 问题", type: "status" },
    {
      text: `你问的是“${normalizedQuestion}”。`,
      type: "delta",
    },
    {
      text: "这是 dumi 文档站中的模拟流式回答，可用于展示悬浮助手交互。",
      type: "delta",
    },
    { type: "done" },
  ];

  return new Response(events.map(toSseFrame).join(""), {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}

function toSseFrame(event: ChatStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}
