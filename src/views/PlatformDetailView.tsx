import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/ContentCard";
import {
  getLocalizedPlatform,
  getLocalizedPlatformContent,
  getSiteData,
} from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function platformDetailMetadata(locale: Locale, slug: string): Metadata {
  const dictionary = getDictionary(locale);
  const content = getLocalizedPlatformContent(locale, slug);
  const platform = getLocalizedPlatform(locale, slug);
  if (!content || !platform) return {};
  return pageMetadata({
    locale,
    path: `/platform/${slug}`,
    title: template(dictionary.seo.platformTitle, { name: platform.name }),
    description: template(dictionary.seo.platformDescription, {
      name: platform.name,
      date: content.last_verified,
    }),
  });
}

export default function PlatformDetailView({ locale, slug }: { locale: Locale; slug: string }) {
  const dictionary = getDictionary(locale);
  const detail = dictionary.platform;
  const content = getLocalizedPlatformContent(locale, slug);
  const platform = getLocalizedPlatform(locale, slug);
  if (!content || !platform) notFound();
  const freeTier = getSiteData(locale).freeTiers.find((entry) => entry.platform_id === platform.id);

  const benchmarkStatus = platform.status === "online"
    ? dictionary.common.online
    : platform.status === "degraded"
      ? dictionary.common.degraded
      : dictionary.common.offline;
  const verification = content.verification_status === "verified"
    ? detail.verificationVerified
    : detail.verificationPartial;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href={localePath(locale, "/")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToHome}</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <main>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{detail.eyebrowPrefix} {content.slug}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{platform.name} {detail.titleSuffix}</h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">{content.short_description}</p>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <Info title={detail.capabilities} items={content.capabilities} />
            <Info title={detail.recommendedUse} items={content.recommended_use_cases} />
            <Info title={detail.restrictions} items={content.restrictions} />
            <Info title={detail.freeTierSection} items={[content.free_tier_summary, `${detail.freeLimitsPrefix}${content.free_limits}`, `${detail.creditCardPrefix}${content.credit_card}`, `${detail.signupPrefix}${content.signup}`]} />
          </section>

          <section className="mt-8 rounded-xl border border-foreground/10 p-5">
            <h2 className="font-semibold">{detail.benchmarkTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/70">{template(detail.benchmarkBody, {
              status: benchmarkStatus,
              latency: platform.latency_ms == null ? "—" : `${platform.latency_ms} ms`,
              successRate: platform.success_rate,
            })}</p>
            <Link href={localePath(locale, "/#ranking")} className="mt-3 inline-block text-sm underline underline-offset-4">{detail.viewFullRanking}</Link>
          </section>
        </main>
        <aside className="space-y-4">
          <div className="rounded-xl border border-foreground/10 p-5">
            <h2 className="font-semibold">{detail.officialEntry}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <External href={content.website_url} label={detail.website} />
              <External href={content.documentation_url} label={detail.documentation} />
              <External href={content.pricing_url} label={detail.pricing} />
            </div>
            <p className="mt-4 text-xs text-foreground/50">{template(detail.lastVerifiedLine, { date: content.last_verified, status: verification })}</p>
          </div>
          {freeTier && <div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.relatedFreeTier}</h2><Link href={localePath(locale, `/free-tier/${freeTier.slug}`)} className="mt-3 inline-block text-sm underline underline-offset-4">{freeTier.free_amount} →</Link></div>}
          <div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.keepExploring}</h2><div className="mt-3"><RelatedLinks locale={locale} resourceSlugs={content.related_resource_slugs} /></div></div>
        </aside>
      </div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{title}</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">{items.map((item) => <li key={item}>· {item}</li>)}</ul></section>;
}

function External({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 hover:text-emerald-600">{label} ↗</a>;
}
