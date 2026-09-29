import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/ContentCard";
import { getSiteData } from "@/lib/content";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function resourcesIndexMetadata(locale: Locale): Metadata {
  const dictionary = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/resources",
    title: dictionary.seo.resourcesTitle,
    description: dictionary.seo.resourcesDescription,
  });
}

export default function ResourcesIndexView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { resources } = getSiteData(locale);
  const categories = [...new Map(resources.map((resource) => [resource.category_slug, resource.category])).entries()];
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href={localePath(locale, "/")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToHome}</Link><div className="mt-8 max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.resourcesIndex.eyebrow}</p><h1 className="mt-3 text-3xl font-bold">{dictionary.resourcesIndex.title}</h1><p className="mt-4 text-base leading-7 text-foreground/70">{dictionary.resourcesIndex.lead}</p></div><nav className="mt-8 flex flex-wrap gap-2" aria-label={dictionary.resourcesIndex.categoryNavLabel}>{categories.map(([slug, label]) => <Link key={slug} href={localePath(locale, `/resources/category/${slug}`)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/5">{label}</Link>)}</nav><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.slug} locale={locale} resource={resource} />)}</div></div>;
}
