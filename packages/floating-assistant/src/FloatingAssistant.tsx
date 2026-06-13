import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { streamChat } from "./chat-client";
import "./style/index.css";
import { takeNextCharacter } from "./typewriter";

type ChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

export type FloatingAssistantProps = {
  apiUrl?: string;
  brand?: string;
  className?: string;
  description?: string;
  idleHint?: string;
  launcherLabel?: string;
  placeholder?: string;
  streamingHint?: string;
  title?: string;
  welcomePrompts?: string[];
};

const defaultWelcomePrompts = [
  "你擅长什么技术？",
  "介绍一个项目经历",
  "你的联系方式是什么？",
];

const prefix = "about-me-ai-assistant";

export function FloatingAssistant({
  apiUrl,
  brand = "About Me AI",
  className,
  description = "我可以根据简历回答技能、经历和项目相关问题。",
  idleHint = "",
  launcherLabel = "AI",
  placeholder = "问任何与简历、项目、技能相关的问题",
  streamingHint = "正在回答...",
  title = "你好，",
  welcomePrompts = defaultWelcomePrompts,
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusSteps, setStatusSteps] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queuedTextRef = useRef("");
  const typewriterTimerRef = useRef<number | null>(null);

  const appendToLastAssistantMessage = useCallback((text: string) => {
    setMessages((current) => {
      const next = [...current];
      const lastMessage = next.at(-1);
      if (lastMessage?.role !== "assistant") {
        return [...next, createMessage("assistant", text)];
      }

      next[next.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return next;
    });
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current !== null) {
      window.clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  const startTypewriter = useCallback(() => {
    if (typewriterTimerRef.current !== null) {
      return;
    }

    typewriterTimerRef.current = window.setInterval(() => {
      const step = takeNextCharacter(queuedTextRef.current);
      if (!step) {
        stopTypewriter();
        return;
      }

      queuedTextRef.current = step.remainingText;
      appendToLastAssistantMessage(step.character);
    }, 18);
  }, [appendToLastAssistantMessage, stopTypewriter]);

  useEffect(() => stopTypewriter, [stopTypewriter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) {
      return;
    }

    setInput("");
    setIsOpen(true);
    setStatusSteps([]);
    queuedTextRef.current = "";
    stopTypewriter();
    setMessages((current) => [
      ...current,
      createMessage("user", question),
      createMessage("assistant", ""),
    ]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsStreaming(true);

    try {
      await streamChat({
        apiUrl,
        onEvent(event) {
          if (event.type === "status") {
            setStatusSteps((current) =>
              current.includes(event.message)
                ? current
                : [...current, event.message],
            );
            return;
          }

          if (event.type === "delta") {
            queuedTextRef.current += event.text;
            startTypewriter();
            return;
          }

          if (event.type === "done") {
            setStatusSteps([]);
          }
        },
        question,
        signal: abortController.signal,
      });
    } catch (error) {
      if (!abortController.signal.aborted) {
        appendToLastAssistantMessage(
          error instanceof Error ? error.message : "请求失败，请稍后再试。",
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  function stopStreaming() {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStatusSteps([]);
    queuedTextRef.current = "";
    stopTypewriter();
  }

  const rootClassName = className ? `${prefix} ${className}` : prefix;

  return (
    <div className={rootClassName}>
      <button
        aria-label="打开关于我 AI 助手"
        className={`${prefix}__launcher`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {launcherLabel}
      </button>

      {isOpen ? (
        <aside className={`${prefix}__panel`}>
          <header className={`${prefix}__header`}>
            <div className={`${prefix}__header-row`}>
              <div>
                <p className={`${prefix}__brand`}>{brand}</p>
                <h2 className={`${prefix}__title`}>{title}</h2>
                <p className={`${prefix}__description`}>{description}</p>
              </div>
              <button
                className={`${prefix}__close`}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                关闭
              </button>
            </div>

            <div className={`${prefix}__prompts`}>
              {welcomePrompts.map((prompt) => (
                <button
                  className={`${prefix}__prompt`}
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </header>

          <div className={`${prefix}__messages`}>
            {messages.length === 0 ? (
              <div className={`${prefix}__empty`}>
                试试询问“你擅长什么技术？”或“介绍一个你做过的项目”。
              </div>
            ) : (
              messages.map((message) => (
                <article
                  className={
                    message.role === "user"
                      ? `${prefix}__message ${prefix}__message--user`
                      : `${prefix}__message ${prefix}__message--assistant`
                  }
                  key={message.id}
                >
                  {message.content ||
                    (message.role === "assistant" ? "正在准备回答..." : "")}
                </article>
              ))
            )}

            {statusSteps.length > 0 ? (
              <div className={`${prefix}__status`}>
                {statusSteps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            ) : null}
          </div>

          <form className={`${prefix}__form`} onSubmit={handleSubmit}>
            <div className={`${prefix}__input-wrap`}>
              <textarea
                className={`${prefix}__textarea`}
                disabled={isStreaming}
                onChange={(event) => setInput(event.target.value)}
                placeholder={placeholder}
                value={input}
              />
              <div className={`${prefix}__form-row`}>
                <span className={`${prefix}__hint`}>
                  {isStreaming ? streamingHint : idleHint}
                </span>
                {isStreaming ? (
                  <button
                    className={`${prefix}__stop`}
                    onClick={stopStreaming}
                    type="button"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    className={`${prefix}__send`}
                    disabled={!input.trim()}
                    type="submit"
                  >
                    发送
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      ) : null}
    </div>
  );
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    content,
    id: crypto.randomUUID(),
    role,
  };
}
