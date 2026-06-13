import { resolve4 } from "node:dns/promises";
import { isIP } from "node:net";
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

async function requestOpenAiStream(input: RequestOpenAiStreamInput) {
  const configuredAddresses = parseConfiguredIpv4Addresses(
    process.env.OPENAI_COMPAT_IPV4_ADDRESSES,
  );
  const resolvedAddresses = await resolveIpv4Addresses(input.url);
  const addresses = mergeConfiguredAndResolvedIpv4Addresses(
    configuredAddresses,
    resolvedAddresses,
  );
  const targets = buildOpenAiRequestTargets(input.url, addresses);
  return requestOpenAiStreamWithRetry(input, targets);
}

export type OpenAiRequestTarget = {
  hostHeader?: string;
  servername?: string;
  url: URL;
};

export function buildOpenAiRequestTargets(
  url: URL,
  addresses: string[],
): OpenAiRequestTarget[] {
  if (addresses.length === 0) {
    return [{ url }];
  }

  return addresses.map((address) => {
    const targetUrl = new URL(url.toString());
    targetUrl.hostname = address;

    return {
      hostHeader: url.host,
      servername: url.hostname,
      url: targetUrl,
    };
  });
}

async function resolveIpv4Addresses(url: URL) {
  try {
    return await resolve4(url.hostname);
  } catch {
    return [];
  }
}

export function parseConfiguredIpv4Addresses(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((address) => address.trim())
      .filter((address) => isIP(address) === 4) ?? []
  );
}

export function mergeConfiguredAndResolvedIpv4Addresses(
  configuredAddresses: string[],
  resolvedAddresses: string[],
) {
  return [...new Set([...configuredAddresses, ...resolvedAddresses])];
}

type SendOpenAiRequestInput = RequestOpenAiStreamInput & {
  target: OpenAiRequestTarget;
};

type SendOpenAiRequest = (
  input: SendOpenAiRequestInput,
) => Promise<IncomingMessage>;

export async function requestOpenAiStreamWithRetry(
  input: RequestOpenAiStreamInput,
  targets: OpenAiRequestTarget[],
  sendRequest: SendOpenAiRequest = sendOpenAiRequest,
) {
  let lastError: unknown;

  for (const target of targets) {
    try {
      return await sendRequest({ ...input, target });
    } catch (error) {
      if (input.signal?.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed before receiving a response");
}

function sendOpenAiRequest({
  apiKey,
  body,
  signal,
  target,
}: SendOpenAiRequestInput) {
  const requestBody = JSON.stringify(body);
  const request = target.url.protocol === "http:" ? httpRequest : httpsRequest;

  return new Promise<IncomingMessage>((resolve, reject) => {
    const clientRequest = request(
      target.url,
      buildOpenAiRequestOptions(apiKey, requestBody, signal, target),
      resolve,
    );

    clientRequest.setTimeout(5000, () => {
      clientRequest.destroy(new Error("LLM connection timed out"));
    });
    clientRequest.on("error", reject);
    clientRequest.end(requestBody);
  });
}

export function buildOpenAiRequestOptions(
  apiKey: string,
  requestBody: string,
  signal?: AbortSignal,
  target?: OpenAiRequestTarget,
) {
  return {
    family: 4,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(requestBody),
      "Content-Type": "application/json",
      ...(target?.hostHeader ? { Host: target.hostHeader } : {}),
    },
    method: "POST",
    ...(target?.servername ? { servername: target.servername } : {}),
    signal,
    timeout: 5000,
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
