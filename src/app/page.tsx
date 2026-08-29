import Hero from "@/components/Hero";
import Link from "next/link";
import RankingTable from "@/components/RankingTable";
import PerksGrid from "@/components/PerksGrid";
import { FreeTierCard, PlatformCard, ResourceCard } from "@/components/ContentCard";
import { platformContents, platforms, freeTiers, resources } from "@/lib/content";
import perkData from "@/data/perks.json";
import authenticityData from "@/data/authenticity.json";
import historyData from "@/data/history.json";
import type { AuthenticityReport, HistoryEntry, Perk } from "@/types";

// JSON 字面量类型收窄为数据模型（字段见 src/types.ts）
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
        freeTierCount={freeTiers.length}
        resourceCount={resources.length}
        lastChecked={lastChecked}
      />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">CONTENT FOUNDATION</p><h2 className="mt-2 text-2xl font-bold">先看真正有用的入口</h2><p className="mt-3 text-sm leading-6 text-foreground/70">APISpotlight 现在同时提供可复现的 Benchmark、独立平台页、已核验的 Free Tier 和面向开发者的精选资源。</p></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{platformContents.map((content) => { const platform = platforms.find((item) => item.id === content.platform_id); return platform ? <PlatformCard key={content.slug} platform={platform} content={content} /> : null; })}</div>
      </section>

      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">VERIFIED FREE TIER</p><h2 className="mt-2 text-2xl font-bold">免费额度与免费层</h2></div><Link href="/free-tier" className="text-sm underline underline-offset-4">查看全部 {freeTiers.length} 条 →</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{freeTiers.slice(0, 6).map((entry) => <FreeTierCard key={entry.slug} entry={entry} />)}</div></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">DEVELOPER RESOURCES</p><h2 className="mt-2 text-2xl font-bold">开发者资源</h2></div><Link href="/resources" className="text-sm underline underline-offset-4">进入资源目录 {resources.length} 条 →</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.slice(0, 6).map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div></section>

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
