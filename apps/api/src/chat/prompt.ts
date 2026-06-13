export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  content: string;
  role: ChatRole;
};

export type ResumePrompt = {
  messages: ChatMessage[];
};

export type ResumePromptInput = {
  question: string;
  resumeText: string;
};

const maxResumeContextLength = 12_000;

export function buildResumePrompt({
  question,
  resumeText,
}: ResumePromptInput): ResumePrompt {
  const boundedResumeText = resumeText.slice(0, maxResumeContextLength);

  return {
    messages: [
      {
        content: [
          "你是一个“关于我”的智能问答助手。",
          "只根据简历信息回答访客问题，不要编造简历中没有的事实。",
          "如果问题无法从简历中确认，请明确说明“这个问题我无法从简历中确认”，然后只补充与简历相关的可确认信息。",
          "回答要自然、简洁、适合网页聊天场景。优先用中文回答。",
          "",
          "简历信息：",
          boundedResumeText,
        ].join("\n"),
        role: "system",
      },
      {
        content: question,
        role: "user",
      },
    ],
  };
}
