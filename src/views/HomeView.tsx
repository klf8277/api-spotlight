import Link from "next/link";
import Hero from "@/components/Hero";
import PerksGrid from "@/components/PerksGrid";
import RankingTable from "@/components/RankingTable";
import { FreeTierCard, PlatformCard, ResourceCard } from "@/components/ContentCard";
import {
  getAuthenticityMap,
  getLastChecked,
  getLatencyHistory,
  getSiteData,
} from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";

export default function HomeView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { platforms, platformContents, freeTiers, resources, perks } = getSiteData(locale);
  const authenticityMap = getAuthenticityMap(locale);
  const latencyHistory = getLatencyHistory();
  const lastChecked = getLastChecked();
  const path = (value: string) => localePath(locale, value);

  return (
    <>
      <Hero
        locale={locale}
        platformCount={platforms.length}
        freeTierCount={freeTiers.length}
        resourceCount={resources.length}
        lastChecked={lastChecked}
      />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.home.foundationEyebrow}</p><h2 className="mt-2 text-2xl font-bold">{dictionary.home.foundationTitle}</h2><p className="mt-3 text-sm leading-6 text-foreground/70">{dictionary.home.foundationBody}</p></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{platformContents.map((content) => { const platform = platforms.find((item) => item.id === content.platform_id); return platform ? <PlatformCard key={content.slug} locale={locale} platform={platform} content={content} /> : null; })}</div>
      </section>

      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.home.freeTierEyebrow}</p><h2 className="mt-2 text-2xl font-bold">{dictionary.home.freeTierTitle}</h2></div><Link href={path("/free-tier")} className="text-sm underline underline-offset-4">{template(dictionary.common.viewAll, { count: freeTiers.length })}</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{freeTiers.slice(0, 6).map((entry) => <FreeTierCard key={entry.slug} locale={locale} entry={entry} />)}</div></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.home.resourcesEyebrow}</p><h2 className="mt-2 text-2xl font-bold">{dictionary.home.resourcesTitle}</h2></div><Link href={path("/resources")} className="text-sm underline underline-offset-4">{template(dictionary.common.viewAll, { count: resources.length })}</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.slice(0, 6).map((resource) => <ResourceCard key={resource.slug} locale={locale} resource={resource} />)}</div></section>

      <section id="ranking" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">{dictionary.home.rankingEyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold">{dictionary.home.rankingTitle}</h2>
          </div>
          <p className="text-xs text-foreground/50">{dictionary.home.rankingNote}</p>
        </div>
        <RankingTable
          locale={locale}
          platforms={platforms}
          authenticityMap={authenticityMap}
          latencyHistory={latencyHistory}
        />
      </section>

      <section id="perks" className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">{dictionary.home.perksTitle}</h2>
            <p className="text-xs text-foreground/50">{dictionary.home.perksNote}</p>
          </div>
          <PerksGrid locale={locale} perks={perks} />
        </div>
      </section>
    </>
  );
}
