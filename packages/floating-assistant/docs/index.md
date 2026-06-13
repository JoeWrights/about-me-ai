# Floating Assistant

可复用的个人 AI 悬浮助手组件，适合放在个人主页或简历页右下角，用于回答技能、经历和项目相关问题。

## 基础演示

下面的 demo 使用文档站内置 mock 流式接口，不需要启动后端服务。

<code src="./demo/basic.tsx"></code>

## 接入真实接口

生产环境只需要把 `apiUrl` 指向兼容 SSE 事件格式的聊天接口。

```tsx | pure
import { FloatingAssistant } from "@about-me-ai/floating-assistant";

export default function App() {
  return <FloatingAssistant apiUrl="http://localhost:4000/api/chat" />;
}
```

接口需要返回 `text/event-stream`，每一帧的 `data` 字段应为以下事件之一：

```ts
type ChatStreamEvent =
  | { message: string; type: "status" }
  | { text: string; type: "delta" }
  | { type: "done" };
```

## 自定义文案

```tsx | pure
import { FloatingAssistant } from "@about-me-ai/floating-assistant";

export default function App() {
  return (
    <FloatingAssistant
      brand="Resume AI"
      description="我可以回答简历、项目和技能相关问题。"
      placeholder="输入你的问题"
      title="你好，"
      welcomePrompts={["你擅长什么技术？", "介绍一个项目经历"]}
    />
  );
}
```
