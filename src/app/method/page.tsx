import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "测试方法论 · APISpotlight",
  description:
    "APISpotlight 测试方法论：节点位置、采样方法、超时设置、数据更新频率与判定口径。",
  alternates: {
    canonical: "/method/",
  },
  openGraph: {
    url: "https://api-spotlight.pages.dev/method/",
    title: "测试方法论 · APISpotlight",
    description: "APISpotlight 测试方法论：节点位置、采样方法、超时设置、数据更新频率与判定口径。",
  },
};

const SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "🧪 测试节点（诚实声明单节点局限）",
    items: [
      "🇨🇳 中国内地本机：榜单「境内可用」列的数据源（开发机所在网络，非专线）；",
      "🌍 GitHub Actions Runner（海外，位置由 GitHub 编排）：latency / success_rate 的数据源，每 6 小时自动运行；",
      "两个视角均为「观察值」：跨境网络存在时点差异（可见性、路由、限流均可能变化），非官方保证。",
    ],
  },
  {
    title: "📏 采样与判定口径",
    items: [
      "每站对 {api_base}/models 端点 GET 请求，3 次采样取中位数作为延迟；",
      "成功率 = 状态码 < 500 且非 404 的请求比例；",
      "401/403 = 服务可达但缺少测试 Key（记为成功）；404 = 端点配置有误（记为失败）；",
      "单次超时 10s，并发上限 8；一个站点超时不影响其他站点。",
    ],
  },
  {
    title: "⏰ 更新频率",
    items: [
      "GitHub Actions cron：每 6 小时（UTC 02:00 / 08:00 / 14:00 / 20:00，北京时间 +8）自动实测；",
      "指标变化自动写回仓库并触发展示部署；",
      "数据文件原子替换（临时文件 + os.replace）并保留 .bak 备份，前端所见即所存。",
    ],
  },
  {
    title: "🔐 真实性抽查（Phase 3）判定铁律",
    items: [
      "Temperature 采样（默认 0.3 / 0.7 / 1.3）+ 自 ID / token 长度 / 漂移 / 重复率指纹比对；",
      "指纹参考值未校准（calibrated=false）一律返回「⏳ 未校准」，绝不臆断；",
      "校准基线必须来自官方直连正版渠道（scripts/authenticity_test.py --calibrate）；",
      "任何质疑或申诉渠道：请以 GitHub Issue 提出（附时间戳，我们可复现原始采样）。",
    ],
  },
  {
    title: "💻 直接使用数据",
    items: [
      "公开 JSON API（构建时快照）：curl https://api-spotlight.pages.dev/data/platforms.json",
      "代码库（MIT License）：https://github.com/klf8277/api-spotlight",
    ],
  },
];

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">🧪 测试方法论</h1>
      <p className="mt-3 text-sm leading-7 text-foreground/70">
        本站所有数据均可复现：方法公之于此，脚本开源（scripts/*.py），
        数据即所存。以下口径与页面展示一一对应。
      </p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold">{s.title}</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-foreground/70">
              {s.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">·</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Link
        href="/"
        className="mt-10 inline-block rounded-lg border border-foreground/10 px-4 py-2 text-sm hover:bg-foreground/5"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
