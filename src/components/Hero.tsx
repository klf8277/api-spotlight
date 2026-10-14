import Link from "next/link";
import { commercialHubHref, getDictionary, localePath, type Locale } from "@/lib/i18n";

interface HeroProps {
  locale: Locale;
  platformCount: number;
  freeTierCount: number;
  resourceCount: number;
  lastChecked: string;
}

/**
 * 批F 工单2-A：Hero 改为全宽单栏（移除右侧「4 个真实入口」2x2 冗余卡片），
 * 次按钮直通商业站特惠大盘 /offers（2026 大厂官方免费额度与补贴指南）。
 */
export default function Hero({
  locale,
  platformCount,
  freeTierCount,
  resourceCount,
  lastChecked,
}: HeroProps) {
  const dictionary = getDictionary(locale);
  const hero = dictionary.hero;
  const path = (value: string) => localePath(locale, value);

  const stats: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: hero.statPlatforms, value: String(platformCount) },
    { label: hero.statFreeTiers, value: String(freeTierCount) },
    { label: hero.statResources, value: String(resourceCount) },
    { label: hero.statLastChecked, value: lastChecked, mono: true },
  ];

  return (
    <section className="border-b border-foreground/10 bg-foreground/[0.015]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          {hero.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {hero.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/70 sm:text-lg">{hero.subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={path("/test")}
            className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90"
          >
            {hero.ctaTest}
          </Link>
          <a
            href={`${commercialHubHref(locale)}offers/`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.08] px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
          >
            {hero.ctaFreeTier}
          </a>
          <Link
            href={path("/#ranking")}
            className="rounded-lg border border-foreground/10 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
          >
            {hero.ctaDirectory}
          </Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-foreground/50">{hero.securityNotice}</p>

        <dl className="mt-6 grid grid-cols-4 gap-1.5 sm:mt-8 sm:gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-foreground/10 bg-background/70 p-2.5 sm:p-4">
              <dt className="text-[10px] leading-4 text-foreground/50 sm:text-xs">{stat.label}</dt>
              <dd className={stat.mono ? "mt-0.5 font-mono text-[10px] font-semibold sm:mt-1 sm:text-sm" : "mt-0.5 text-lg font-semibold sm:mt-1 sm:text-2xl"}>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs leading-5 text-foreground/50 sm:mt-3">{hero.disclaimer}</p>
      </div>
    </section>
  );
}
