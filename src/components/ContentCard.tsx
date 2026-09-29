import Link from "next/link";
import type { DeveloperResource, FreeTierEntry, Platform, PlatformContent } from "@/types";
import { formatStatus, freeTierHref, platformHref, platformSlug, resourceHref } from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";

export function PlatformCard({
  locale,
  platform,
  content,
}: {
  locale: Locale;
  platform: Platform;
  content: PlatformContent;
}) {
  const dictionary = getDictionary(locale);
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.card.platformEyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold">{platform.name}</h3>
        </div>
        <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs">{formatStatus(locale, platform.status)}</span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-foreground/70">{content.short_description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/60">
        {platform.tags?.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-foreground/10 px-2 py-1">{tag}</span>)}
      </div>
      <Link href={localePath(locale, `/platform/${content.slug}`)} className="mt-5 inline-flex justify-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:opacity-90">{dictionary.card.platformCta}</Link>
    </article>
  );
}

export function FreeTierCard({ locale, entry }: { locale: Locale; entry: FreeTierEntry }) {
  const dictionary = getDictionary(locale);
  const confidence = entry.confidence === "high"
    ? dictionary.card.confidenceHigh
    : entry.confidence === "medium"
      ? dictionary.card.confidenceMedium
      : dictionary.card.confidenceLow;
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 p-4 sm:p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.card.freeTierEyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold">{entry.provider}</h3>
      <p className="mt-1 text-xs text-foreground/50">{entry.api_service}</p>
      <p className="mt-4 flex-1 text-sm leading-6 text-foreground/80">{entry.free_amount}</p>
      <p className="mt-3 text-xs text-foreground/50">{template(dictionary.card.freeTierVerified, { date: entry.last_verified, confidence })}</p>
      <Link href={freeTierHref(locale, entry.slug)} className="mt-4 inline-flex justify-center rounded-md border border-foreground/10 py-2 text-sm font-medium hover:bg-foreground/5">{dictionary.card.freeTierCta}</Link>
    </article>
  );
}

export function ResourceCard({ locale, resource }: { locale: Locale; resource: DeveloperResource }) {
  const dictionary = getDictionary(locale);
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">{resource.category}</span>
        <span className="text-xs text-foreground/45">{resource.quality.total}/30</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{resource.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-foreground/70">{resource.description}</p>
      <p className="mt-3 text-xs text-foreground/50">{resource.free_summary}</p>
      <Link href={resourceHref(locale, resource.slug)} className="mt-4 inline-flex justify-center rounded-md border border-foreground/10 py-2 text-sm font-medium hover:bg-foreground/5">{dictionary.card.resourceCta}</Link>
    </article>
  );
}

export function RelatedLinks({
  locale,
  platformIds = [],
  freeTierSlugs = [],
  resourceSlugs = [],
}: {
  locale: Locale;
  platformIds?: string[];
  freeTierSlugs?: string[];
  resourceSlugs?: string[];
}) {
  const dictionary = getDictionary(locale);
  return (
    <div className="flex flex-wrap gap-2">
      {platformIds.map((id) => {
        const slug = platformSlug(id);
        return slug ? <Link key={id} href={platformHref(locale, id)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">{dictionary.card.relatedPlatform}</Link> : null;
      })}
      {freeTierSlugs.map((slug) => <Link key={slug} href={freeTierHref(locale, slug)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">{dictionary.nav.freeTier}</Link>)}
      {resourceSlugs.map((slug) => <Link key={slug} href={resourceHref(locale, slug)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">{dictionary.card.relatedResource}</Link>)}
    </div>
  );
}
