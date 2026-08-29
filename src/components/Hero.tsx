import Link from "next/link";

interface HeroProps {
  platformCount: number;
  freeTierCount: number;
  resourceCount: number;
  lastChecked: string;
}

const ENTRY_POINTS = [
  {
    eyebrow: "API PLATFORMS",
    title: "浏览 API 平台",
    detail: "按实测数据和公开信息比较",
    href: "/#ranking",
  },
  {
    eyebrow: "FREE TIER",
    title: "查找免费额度",
    detail: "查看额度、条件与核验状态",
    href: "/free-tier",
  },
  {
    eyebrow: "GATEWAY TEST",
    title: "测试 Endpoint",
    detail: "对授权地址发起低影响实测",
    href: "/test",
  },
  {
    eyebrow: "DEVELOPER RESOURCES",
    title: "浏览开发资源",
    detail: "找到工具、基础设施与文档",
    href: "/resources",
  },
];

export default function Hero({
  platformCount,
  freeTierCount,
  resourceCount,
  lastChecked,
}: HeroProps) {
  return (
    <section className="border-b border-foreground/10 bg-foreground/[0.015]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:items-end lg:gap-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {"// APISpotlight · API 探照灯"}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              找 AI API、查免费额度，直接测试授权 Endpoint
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/70 sm:text-lg">
              发现官方 API 平台和开发者资源，查看免费层与公开核验状态，再用真实请求了解你有权使用的 Endpoint 实际返回了什么。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/test"
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90"
              >
                开始测试 →
              </Link>
              <Link
                href="/free-tier"
                className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                查找免费额度
              </Link>
              <Link
                href="/#ranking"
                className="rounded-lg border border-foreground/10 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                浏览 API 平台
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground/50">
              只测试你有权使用的 Endpoint；Key 仅在当前浏览器内存中使用，测试结束后清除。
            </p>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/65 p-3 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                START HERE
              </p>
              <span className="text-xs text-foreground/45">4 个真实入口</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
              {ENTRY_POINTS.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-foreground/10 p-2.5 hover:border-emerald-500/40 hover:bg-foreground/[0.03] sm:p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45">
                    {entry.eyebrow}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold sm:mt-2 sm:text-base">{entry.title}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-foreground/60 sm:block">{entry.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-4 gap-1.5 sm:mt-8 sm:gap-3">
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-2.5 sm:p-4">
            <dt className="text-[10px] leading-4 text-foreground/50 sm:text-xs">API 平台</dt>
            <dd className="mt-0.5 text-lg font-semibold sm:mt-1 sm:text-2xl">{platformCount}</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-2.5 sm:p-4">
            <dt className="text-[10px] leading-4 text-foreground/50 sm:text-xs">Free Tier</dt>
            <dd className="mt-0.5 text-lg font-semibold sm:mt-1 sm:text-2xl">{freeTierCount}</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-2.5 sm:p-4">
            <dt className="text-[10px] leading-4 text-foreground/50 sm:text-xs">开发者资源</dt>
            <dd className="mt-0.5 text-lg font-semibold sm:mt-1 sm:text-2xl">{resourceCount}</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-2.5 sm:p-4">
            <dt className="text-[10px] leading-4 text-foreground/50 sm:text-xs">最近实测</dt>
            <dd className="mt-0.5 font-mono text-[10px] font-semibold sm:mt-1 sm:text-sm">{lastChecked}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-foreground/50 sm:mt-3">
          平台延迟、成功率和状态来自实际数据字段；测试结果只描述本次观测，不代表永久认证。
        </p>
      </div>
    </section>
  );
}
