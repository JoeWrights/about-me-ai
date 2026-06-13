import { FloatingAssistant } from "@about-me-ai/floating-assistant";
import React from "react";

const skills = ["React", "TypeScript", "NestJS", "AI Assistant"];

const sections = [
  {
    description: "13800138000",
    title: "Contact",
  },
  {
    description: "构建个人智能问答助手，帮助访客快速了解简历、项目和技能。",
    title: "Work",
  },
  {
    description: "点击右下角 AI 助手，询问技能、经历或项目细节。",
    title: "Ask",
  },
];

export function App() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            About Me AI
          </p>
          <h1 className="mt-5 text-6xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-7xl">
            Joe Wright
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-stone-700">
            一个可以被询问经历、技能和项目判断的个人 AI 主页。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                className="rounded-full border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900"
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 border-t border-stone-300 pt-8 sm:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-lg font-semibold text-stone-950">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <FloatingAssistant />
    </main>
  );
}
