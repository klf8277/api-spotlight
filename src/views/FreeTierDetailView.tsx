import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/ContentCard";
import { getLocalizedFreeTier, getLocalizedPlatform, platformSlug } from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function freeTierDetailMetadata(locale: Locale, slug: string): Metadata {
  const dictionary = getDictionary(locale);
  const entry = getLocalizedFreeTier(locale, slug);
  if (!entry) return {};
  if (slug === "openrouter") {
    return pageMetadata({
      locale,
      path: `/free-tier/${slug}`,
      title: dictionary.seo.openrouterFreeTierTitle,
      description: dictionary.seo.openrouterFreeTierDescription,
    });
  }
  return pageMetadata({
    locale,
    path: `/free-tier/${slug}`,
    title: template(dictionary.seo.freeTierDetailTitle, { provider: entry.provider }),
    description: template(dictionary.seo.freeTierDetailDescription, { provider: entry.provider }),
  });
}

export default function FreeTierDetailView({ locale, slug }: { locale: Locale; slug: string }) {
  const dictionary = getDictionary(locale);
  const detail = dictionary.freeTierDetail;
  const entry = getLocalizedFreeTier(locale, slug);
  if (!entry) notFound();

  const platform = entry.platform_id ? getLocalizedPlatform(locale, platformSlug(entry.platform_id) ?? "") : undefined;
  const platformPath = entry.platform_id ? platformSlug(entry.platform_id) : undefined;
  const facts: Array<[string, string]> = [
    [detail.factApiService, entry.api_service],
    [detail.factUnit, entry.unit],
    [detail.factResetPeriod, entry.reset_period],
    [detail.factRateLimits, entry.rate_limits],
    [detail.factCreditCard, entry.credit_card],
    [detail.factSignup, entry.signup],
    [detail.factExpiration, entry.expiration],
    [detail.factVerification, `${entry.last_verified} · ${entry.verification_status} · ${entry.confidence} confidence`],
  ];
  const heading = slug === "openrouter" ? detail.openrouterHeading : `${entry.provider} Free Tier`;

  return <div className="mx-auto max-w-4xl px-4 py-12"><Link href={localePath(locale, "/free-tier")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToFreeTier}</Link><main className="mt-8"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{detail.eyebrowPrefix} {entry.slug}</p><h1 className="mt-3 text-3xl font-bold">{heading}</h1><p className="mt-4 text-lg leading-8 text-foreground/75">{entry.free_amount}</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label} className="rounded-xl border border-foreground/10 p-4"><p className="text-xs text-foreground/50">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>)}</div><section className="mt-8 rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.restrictions}</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">{entry.restrictions.map((item) => <li key={item}>· {item}</li>)}</ul></section><section className="mt-8 rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.officialSources}</h2><div className="mt-3 space-y-2 text-sm"><External href={entry.official_website_url} label={detail.officialWebsite}/><External href={entry.official_documentation_url} label={detail.officialDocumentation}/><External href={entry.official_pricing_url} label={detail.officialPricing}/></div><p className="mt-4 text-xs leading-5 text-foreground/50">{template(detail.sourceNote, { sourceType: entry.source_type })}</p></section>{platform && platformPath && <section className="mt-8 rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.providerPage}</h2><Link href={localePath(locale, `/platform/${platformPath}`)} className="mt-3 inline-block text-sm underline underline-offset-4">{detail.providerPageLink}</Link></section>}<section className="mt-8"><h2 className="font-semibold">{detail.relatedResources}</h2><div className="mt-3"><RelatedLinks locale={locale} resourceSlugs={entry.related_resource_slugs}/></div></section></main></div>;
}

function External({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 hover:text-emerald-600">{label} ↗</a>;
}
