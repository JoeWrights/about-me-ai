import { FloatingAssistant } from "@about-me-ai/floating-assistant";

const promptSuggestions = ["问我的项目", "问我的技能", "问联系方式"];

const highlights = [
  "我最近重点在做企业信息化与 AI 辅助研发实践，覆盖招聘、办公地图、人事等业务域。",
  "我长期使用 React、Vue、TypeScript，熟悉 Qiankun 微前端与 Monorepo 工程协作。",
  "我有复杂中后台场景的落地经验，包括审批流、权限、报表与数据看板。",
  "我持续建设组件库和工具链（release-cli / web-deploy / MCP Tool）提升交付效率。",
];

export function App() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#111111]">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-black/15 bg-white/90 px-3 py-2 pr-4 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/60 shadow-[0_18px_48px_rgba(107,76,230,0.12)]">
            <span
              aria-label="About Me AI 品牌标识"
              className="ai-logo-mark relative grid h-11 w-11 place-items-center rounded-[1.05rem] bg-[linear-gradient(145deg,#8a35f8,#694cf1)] text-base font-medium tracking-[-0.08em] text-white"
              role="img"
            >
              AI
            </span>
            <span>About Me AI</span>
            <span className="rounded-full bg-black px-2 py-0.5 text-[0.58rem] tracking-[0.2em] text-white">
              Live
            </span>
          </div>

          <h1 className="mt-7 text-5xl font-black leading-[0.93] tracking-[-0.06em] sm:text-7xl lg:text-[5.2rem]">
            Hi，我是 Joe Wright
            <span className="block text-[#6b4ce6]">有什么想问我的吗？</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-black/70">
            如果你愿意，我可以直接回答这些问题。
          </p>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">
              可以这样问
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {promptSuggestions.map((prompt) => (
                <span
                  className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black/85"
                  key={prompt}
                >
                  {prompt}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-black/12 bg-[#151620] p-6 text-[#f7f3ea] shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <div className="border-b border-white/10 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8bbff]">
              关于我
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em]">
              目前重点
            </h2>
          </div>

          <ul className="mt-6 grid gap-3">
            {highlights.map((item) => (
              <li
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/88"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl bg-[#f4f1ea] p-5 text-[#111111]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b4ce6]">
              常见开场
            </p>
            <p className="mt-3 text-lg font-semibold leading-8 tracking-[-0.02em]">
              “你擅长什么技术？”
            </p>
            <p className="mt-3 text-sm leading-6 text-black/65">
              点击右下角 AI 助手，继续了解我的经历、项目细节或技术选择。
            </p>
          </div>
        </aside>
      </section>
      <FloatingAssistant apiUrl="http://117.72.118.82/api/about-me-ai/chat" />
    </main>
  );
}
