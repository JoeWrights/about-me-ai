import { Module } from "@nestjs/common";
import { RateLimitService } from "../rate-limit/rate-limit.service.js";
import { ResumeService } from "../resume/resume.service.js";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { LLM_CLIENT, OpenAiCompatibleLlmClient } from "./llm-client.js";

@Module({
  controllers: [ChatController],
  providers: [
    ResumeService,
    RateLimitService,
    {
      provide: LLM_CLIENT,
      useClass: OpenAiCompatibleLlmClient,
    },
    {
      inject: [ResumeService, LLM_CLIENT],
      provide: ChatService,
      useFactory: (
        resumeService: ResumeService,
        llmClient: OpenAiCompatibleLlmClient,
      ) => new ChatService(resumeService, llmClient),
    },
  ],
})
export class ChatModule {}
