import { Body, Controller, Header, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  RateLimitExceededError,
  RateLimitService,
} from "../rate-limit/rate-limit.service.js";
import { ResumeService } from "../resume/resume.service.js";
import { ChatService } from "./chat.service.js";
import type { ChatRequest } from "./chat.types.js";
import { OpenAiCompatibleLlmClient } from "./llm-client.js";

@Controller("api/chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService = createDefaultChatService(),
    private readonly rateLimitService: RateLimitService = new RateLimitService(),
  ) {}

  @Post()
  @Header("X-Accel-Buffering", "no")
  async chat(
    @Body() body: ChatRequest,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      this.rateLimitService.assertAllowed({
        key: getClientKey(request, process.env.TRUST_PROXY_HEADERS === "true"),
        question: body.question ?? "",
      });
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw this.rateLimitService.toHttpException(error);
      }
      throw error;
    }

    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");

    const abortController = new AbortController();
    request.on("close", () => abortController.abort());

    for await (const event of this.chatService.streamAnswer(body, {
      signal: abortController.signal,
    })) {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    response.end();
  }
}

function createDefaultChatService() {
  return new ChatService(new ResumeService(), new OpenAiCompatibleLlmClient());
}

type ClientKeyRequest = Pick<Request, "header" | "ip" | "socket">;

export function getClientKey(
  request: ClientKeyRequest,
  trustProxyHeaders = false,
) {
  if (trustProxyHeaders) {
    const forwardedFor = request
      .header("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    if (forwardedFor) {
      return forwardedFor;
    }
  }

  return request.ip || request.socket.remoteAddress || "anonymous";
}
