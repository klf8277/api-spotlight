import Hero from "@/components/Hero";
import RankingTable from "@/components/RankingTable";
import PerksGrid from "@/components/PerksGrid";
import platformData from "@/data/platforms.json";
import perkData from "@/data/perks.json";
import authenticityData from "@/data/authenticity.json";
import historyData from "@/data/history.json";
import type { AuthenticityReport, HistoryEntry, Perk, Platform } from "@/types";

// JSON 字面量类型收窄为数据模型（字段见 src/types.ts）
const platforms = platformData as Platform[];
const perks = perkData as Perk[];

// 真实性抽查报告：platform_id → 最新报告（来源 scripts/authenticity_test.py --apply）
const authenticityMap = Object.fromEntries(
  (authenticityData.reports as AuthenticityReport[]).map((r) => [r.platform_id, r]),
);

// 历史趋势（近 30 天）：platform_id → [{date, latency_ms}]，按日期升序
const latencyHistory = (() => {
  const acc: Record<string, Array<{ date: string; latency: number }>> = {};
  for (const e of (historyData.entries ?? []) as HistoryEntry[]) {
    for (const [pid, p] of Object.entries(e.platforms ?? {})) {
      if (p.latency_ms == null) continue;
      (acc[pid] ??= []).push({ date: e.date, latency: p.latency_ms });
    }
  }
  return acc;
})();

export default function Home() {
  const lastChecked = [...platforms]
    .map((p) => p.last_checked)
    .sort((a, b) => b.localeCompare(a))[0]?.slice(0, 10) ?? "—";

  return (
    <>
      <Hero
        platformCount={platforms.length}
        perkCount={perks.length}
        lastChecked={lastChecked}
      />

      <section id="ranking" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">01 · BENCHMARK</p>
            <h2 className="mt-1 text-2xl font-bold">📊 原厂 API 实测</h2>
          </div>
          <p className="text-xs text-foreground/50">
            点击表头排序 · 最近实测数据 · 数据源 src/data/platforms.json
          </p>
        </div>
        <RankingTable
          platforms={platforms}
          authenticityMap={authenticityMap}
          latencyHistory={latencyHistory}
        />
      </section>

      <section id="perks" className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">🎁 官方公开免费/赠额区</h2>
            <p className="text-xs text-foreground/50">
              各平台官方公开新用户福利 · 以官网为准 · 数据源 src/data/perks.json
            </p>
          </div>
          <PerksGrid perks={perks} />
        </div>
      </section>
    </>
  );
}
