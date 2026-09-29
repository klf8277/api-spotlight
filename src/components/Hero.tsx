import Link from "next/link";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";

interface HeroProps {
  locale: Locale;
  platformCount: number;
  freeTierCount: number;
  resourceCount: number;
  lastChecked: string;
}

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

  const entryPoints = [
    {
      eyebrow: hero.entryPlatformsEyebrow,
      title: hero.entryPlatformsTitle,
      detail: hero.entryPlatformsDetail,
      href: "/#ranking",
    },
    {
      eyebrow: "FREE TIER",
      title: hero.entryFreeTierTitle,
      detail: hero.entryFreeTierDetail,
      href: "/free-tier",
    },
    {
      eyebrow: hero.entryTesterEyebrow,
      title: hero.entryTesterTitle,
      detail: hero.entryTesterDetail,
      href: "/test",
    },
    {
      eyebrow: "DEVELOPER RESOURCES",
      title: hero.entryResourcesTitle,
      detail: hero.entryResourcesDetail,
      href: "/resources",
    },
  ];

  const stats: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: hero.statPlatforms, value: String(platformCount) },
    { label: hero.statFreeTiers, value: String(freeTierCount) },
    { label: hero.statResources, value: String(resourceCount) },
    { label: hero.statLastChecked, value: lastChecked, mono: true },
  ];

  return (
    <section className="border-b border-foreground/10 bg-foreground/[0.015]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:items-end lg:gap-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {hero.eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/70 sm:text-lg">{hero.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={path("/test")}
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90"
              >
                {hero.ctaTest}
              </Link>
              <Link
                href={path("/free-tier")}
                className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                {hero.ctaFreeTier}
              </Link>
              <Link
                href={path("/#ranking")}
                className="rounded-lg border border-foreground/10 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                {hero.ctaDirectory}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground/50">{hero.securityNotice}</p>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/65 p-3 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {hero.startHere}
              </p>
              <span className="text-xs text-foreground/45">{hero.quickEntries}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
              {entryPoints.map((entry) => (
                <Link
                  key={entry.href}
                  href={path(entry.href)}
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
