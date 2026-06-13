export type ChatStreamEvent =
  | {
      message: string;
      type: "status";
    }
  | {
      text: string;
      type: "delta";
    }
  | {
      type: "done";
    };

export type ParsedSseChunk = {
  buffer: string;
  events: ChatStreamEvent[];
};

export type StreamChatOptions = {
  apiUrl?: string;
  onEvent: (event: ChatStreamEvent) => void;
  question: string;
  signal?: AbortSignal;
};

const defaultApiUrl = "http://localhost:4000/api/chat";

export function parseSseChunk(buffer: string, chunk: string): ParsedSseChunk {
  const combined = buffer + chunk;
  const frames = combined.split("\n\n");
  const nextBuffer = frames.pop() ?? "";
  const events = frames
    .map((frame) =>
      frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s*/, ""))
        .join("\n"),
    )
    .filter(Boolean)
    .map((data) => JSON.parse(data) as ChatStreamEvent);

  return {
    buffer: nextBuffer,
    events,
  };
}

export async function streamChat({
  apiUrl = defaultApiUrl,
  onEvent,
  question,
  signal,
}: StreamChatOptions) {
  const response = await fetch(apiUrl, {
    body: JSON.stringify({ question }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(await readErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const parsed = parseSseChunk(
      buffer,
      decoder.decode(value, { stream: true }),
    );
    buffer = parsed.buffer;
    for (const event of parsed.events) {
      onEvent(event);
    }
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? "请求失败，请稍后再试。";
  } catch {
    return "请求失败，请稍后再试。";
  }
}
