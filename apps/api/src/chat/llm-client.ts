import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage } from "node:http";
import { Injectable } from "@nestjs/common";
import type { ChatMessage } from "./prompt.js";

export const LLM_CLIENT = Symbol("LLM_CLIENT");

export type StreamChatInput = {
  signal?: AbortSignal;
  messages: ChatMessage[];
};

export type LlmClient = {
  streamChat(input: StreamChatInput): AsyncIterable<string>;
};

@Injectable()
export class OpenAiCompatibleLlmClient implements LlmClient {
  async *streamChat({
    messages,
    signal,
  }: StreamChatInput): AsyncIterable<string> {
    const apiKey = process.env.OPENAI_COMPAT_API_KEY;
    const model = process.env.OPENAI_COMPAT_MODEL;
    const maxTokens = Number(process.env.OPENAI_COMPAT_MAX_TOKENS ?? 600);
    const baseUrl =
      process.env.OPENAI_COMPAT_BASE_URL ?? "https://api.openai.com/v1";

    if (!apiKey || !model) {
      throw new Error("LLM is not configured");
    }

    const response = await requestOpenAiStream({
      apiKey,
      body: buildOpenAiRequestBody({ maxTokens, messages, model }),
      signal,
      url: new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`),
    });

    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`LLM request failed with status ${response.statusCode}`);
    }

    yield* parseOpenAiStream(response);
  }
}

export type OpenAiRequestBodyInput = {
  maxTokens: number;
  messages: ChatMessage[];
  model: string;
};

export function buildOpenAiRequestBody({
  maxTokens,
  messages,
  model,
}: OpenAiRequestBodyInput) {
  return {
    max_tokens: maxTokens,
    messages,
    model,
    stream: true,
    temperature: 0.3,
  };
}

type RequestOpenAiStreamInput = {
  apiKey: string;
  body: ReturnType<typeof buildOpenAiRequestBody>;
  signal?: AbortSignal;
  url: URL;
};

function requestOpenAiStream({
  apiKey,
  body,
  signal,
  url,
}: RequestOpenAiStreamInput) {
  const requestBody = JSON.stringify(body);
  const request = url.protocol === "http:" ? httpRequest : httpsRequest;

  return new Promise<IncomingMessage>((resolve, reject) => {
    const clientRequest = request(
      url,
      buildOpenAiRequestOptions(apiKey, requestBody, signal),
      resolve,
    );

    clientRequest.on("error", reject);
    clientRequest.end(requestBody);
  });
}

export function buildOpenAiRequestOptions(
  apiKey: string,
  requestBody: string,
  signal?: AbortSignal,
) {
  return {
    family: 4,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(requestBody),
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  };
}

export async function* parseOpenAiStream(
  body: AsyncIterable<Uint8Array>,
): AsyncIterable<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }

      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") {
        return;
      }

      const parsed = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
