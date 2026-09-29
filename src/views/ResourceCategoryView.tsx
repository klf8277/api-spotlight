import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/ContentCard";
import { getSiteData } from "@/lib/content";
import { getDictionary, localePath, template, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function resourceCategoryMetadata(locale: Locale, slug: string): Metadata {
  const dictionary = getDictionary(locale);
  const { resources } = getSiteData(locale);
  const item = resources.find((resource) => resource.category_slug === slug);
  if (!item) return {};
  return pageMetadata({
    locale,
    path: `/resources/category/${slug}`,
    title: template(dictionary.resourceCategory.metaTitle, { label: item.category }),
    description: template(dictionary.resourceCategory.metaDescription, { label: item.category }),
  });
}

export default function ResourceCategoryView({ locale, slug }: { locale: Locale; slug: string }) {
  const dictionary = getDictionary(locale);
  const { resources } = getSiteData(locale);
  const items = resources.filter((resource) => resource.category_slug === slug);
  const label = items[0]?.category;
  if (!items.length) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><Link href={localePath(locale, "/resources")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToResources}</Link><h1 className="mt-8 text-2xl font-bold">{dictionary.resourceCategory.notFound}</h1></div>;
  }
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href={localePath(locale, "/resources")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToResources}</Link><h1 className="mt-8 text-3xl font-bold">{label}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/70">{dictionary.resourceCategory.lead}</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((resource) => <ResourceCard key={resource.slug} locale={locale} resource={resource} />)}</div></div>;
}
