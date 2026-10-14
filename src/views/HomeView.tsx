import Link from "next/link";
import Hero from "@/components/Hero";
import PerksGrid from "@/components/PerksGrid";
import RankingTable from "@/components/RankingTable";
import { ResourceCard } from "@/components/ContentCard";
import {
  getAuthenticityMap,
  getLastChecked,
  getLatencyHistory,
  getSiteData,
} from "@/lib/content";
import { commercialHubHref, getDictionary, localePath, template, type Locale } from "@/lib/i18n";

/**
 * 批F 工单2：首页黄金动线极简大瘦身。
 *   已拔除「先看真正有用的入口」（9 张平台卡，与下方实测表重复）与
 *   「免费额度与免费层」（6 张生硬卡片，与底部官方赠额撞车；/free-tier 路由保留）。
 *   瘦身后动线：Hero ➔ 01·原厂 API 实测排行榜 ➔ 官方赠额算力卡（Perks）➔ 精选开发者资源（6 张）➔ 商业站特惠大盘 CTA。
 */
export default function HomeView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { platforms, freeTiers, resources, perks } = getSiteData(locale);
  const authenticityMap = getAuthenticityMap(locale);
  const latencyHistory = getLatencyHistory();
  const lastChecked = getLastChecked();
  const path = (value: string) => localePath(locale, value);

  // 批F 2.5 工单2：榜单导流胶囊平台集 = 存在公开免费额度记录（free-tiers）或大厂直属·国内可付（支付宝 / 微信）
  // 判定对中英双语数据标签均成立，保证 zh / en 页面口径一致
  const MOBILE_PAY_LABELS = ["支付宝", "微信支付", "Alipay", "WeChat Pay"];
  const promoPlatformIds = platforms
    .filter(
      (platform) =>
        freeTiers.some((entry) => entry.platform_id === platform.id) ||
        (platform.payment_methods ?? []).some((m) => MOBILE_PAY_LABELS.includes(m)),
    )
    .map((platform) => platform.id);

  return (
    <>
      <Hero
        locale={locale}
        platformCount={platforms.length}
        freeTierCount={freeTiers.length}
        resourceCount={resources.length}
        lastChecked={lastChecked}
      />

      <section id="ranking" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">{dictionary.home.rankingEyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold">{dictionary.home.rankingTitle}</h2>
          </div>
          <p className="text-xs text-foreground/50">{dictionary.home.rankingNote}</p>
        </div>
        {/* 批F 工单2-④：移动端滑动提示（微动效，仅小屏展示；表格 min-w 需横向滑动） */}
        <p className="animate-swipe-hint mb-3 text-center text-xs font-medium text-emerald-600 sm:hidden dark:text-emerald-400">
          {dictionary.home.rankingSwipeHint}
        </p>
        <RankingTable
          locale={locale}
          platforms={platforms}
          authenticityMap={authenticityMap}
          latencyHistory={latencyHistory}
          promoPlatformIds={promoPlatformIds}
        />
      </section>

      <section id="perks" className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">{dictionary.home.perksTitle}</h2>
            <p className="text-xs text-foreground/50">{dictionary.home.perksNote}</p>
          </div>
          <PerksGrid locale={locale} perks={perks} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.home.resourcesEyebrow}</p><h2 className="mt-2 text-2xl font-bold">{dictionary.home.resourcesTitle}</h2></div><Link href={path("/resources")} className="text-sm underline underline-offset-4">{template(dictionary.common.viewAll, { count: resources.length })}</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.slice(0, 6).map((resource) => <ResourceCard key={resource.slug} locale={locale} resource={resource} />)}</div></section>

      {/* 批F 工单3-①：底部大盘引流卡 → 商业站特惠大盘（/offers）
          min-w-0 + 标题可断行：中文大标题在 keep-all 全局规则下会撑破窄屏 flex 卡（真机 375px 实测溢出 81px 已修） */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 sm:p-8">
          <div className="min-w-0 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.home.hubCtaEyebrow}</p>
            <h2 className="mt-2 text-xl font-bold [word-break:normal] sm:text-2xl">{dictionary.home.hubCtaTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/70">{dictionary.home.hubCtaBody}</p>
            <p className="mt-2 text-xs text-foreground/50">{dictionary.home.hubCtaNote}</p>
          </div>
          <a
            href={`${commercialHubHref(locale)}offers/`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-sm hover:opacity-90"
          >
            {dictionary.home.hubCtaButton}
          </a>
        </div>
      </section>
    </>
  );
}
