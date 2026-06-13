import { Inject, Injectable } from "@nestjs/common";
import { ResumeService } from "../resume/resume.service.js";
import type { ChatEvent, ChatRequest } from "./chat.types.js";
import { LLM_CLIENT } from "./llm-client.js";
import type { LlmClient } from "./llm-client.js";
import { buildResumePrompt } from "./prompt.js";

const statusSteps = ["正在分析问题", "正在匹配简历经历", "正在组织回答"];

export type StreamAnswerOptions = {
  signal?: AbortSignal;
};

@Injectable()
export class ChatService {
  constructor(
    @Inject(ResumeService)
    private readonly resumeService: ResumeService,
    @Inject(LLM_CLIENT)
    private readonly llmClient: LlmClient,
  ) {}

  async *streamAnswer(
    { question }: ChatRequest,
    options: StreamAnswerOptions = {},
  ): AsyncIterable<ChatEvent> {
    for (const message of statusSteps) {
      yield { message, type: "status" };
    }

    try {
      const resumeText = this.resumeService.getResumeText();
      const prompt = buildResumePrompt({ question, resumeText });

      for await (const text of this.llmClient.streamChat({
        ...prompt,
        signal: options.signal,
      })) {
        yield { text, type: "delta" };
      }
    } catch (error) {
      console.error("LLM chat failed", error);
      yield {
        text: "这个问题我无法从简历中确认，但可以帮你总结简历里已有的经历、技能和项目亮点。",
        type: "delta",
      };
    }

    yield { type: "done" };
  }
}
