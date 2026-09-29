import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/ContentCard";
import { getLocalizedResource } from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function resourceDetailMetadata(locale: Locale, slug: string): Metadata {
  const dictionary = getDictionary(locale);
  const resource = getLocalizedResource(locale, slug);
  if (!resource) return {};
  return pageMetadata({
    locale,
    path: `/resources/${slug}`,
    title: template(dictionary.seo.resourceDetailTitle, { name: resource.name }),
    description: template(dictionary.seo.resourceDetailDescription, {
      name: resource.name,
      description: resource.description,
    }),
  });
}

export default function ResourceDetailView({ locale, slug }: { locale: Locale; slug: string }) {
  const dictionary = getDictionary(locale);
  const detail = dictionary.resourceDetail;
  const resource = getLocalizedResource(locale, slug);
  if (!resource) notFound();
  return <div className="mx-auto max-w-4xl px-4 py-12"><Link href={localePath(locale, "/resources")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToResources}</Link><main className="mt-8"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{detail.eyebrowPrefix} {resource.category}</p><h1 className="mt-3 text-3xl font-bold">{resource.name}</h1><p className="mt-4 text-lg leading-8 text-foreground/75">{resource.description}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.freeAndOpenSource}</h2><p className="mt-3 text-sm leading-6 text-foreground/70">{resource.free_summary}</p></div><div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.qualityScore}</h2><p className="mt-3 text-2xl font-semibold">{resource.quality.total}<span className="text-sm font-normal text-foreground/50"> / 30</span></p><p className="mt-1 text-xs text-foreground/50">{template(detail.qualityMeta, { verdict: resource.quality.verdict, risk: resource.quality.maintenance_risk })}</p></div></div><section className="mt-8 rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{detail.officialSources}</h2><div className="mt-3 space-y-2 text-sm"><SourceLink href={resource.official_url} label={detail.officialEntry} locale={locale}/>{resource.documentation_url && <SourceLink href={resource.documentation_url} label={detail.officialDocumentation} locale={locale}/>}</div><p className="mt-4 text-xs text-foreground/50">{template(detail.lastVerifiedNote, { date: resource.last_verified })}</p></section><section className="mt-8"><h2 className="font-semibold">{detail.keepExploring}</h2><div className="mt-3"><RelatedLinks locale={locale} platformIds={resource.related_platform_ids} freeTierSlugs={resource.related_free_tier_slugs}/></div></section></main></div>;
}

/** 数据里既有官方外链也有站内路径（如 "/free-tier"）：站内走 <Link>，外链新窗口打开。 */
function SourceLink({ href, label, locale }: { href: string; label: string; locale: Locale }) {
  const className = "block underline underline-offset-4 hover:text-emerald-600";
  if (href.startsWith("/")) {
    return <Link href={localePath(locale, href)} className={className}>{label} →</Link>;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{label} ↗</a>;
}
