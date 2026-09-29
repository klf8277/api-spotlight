import type { Metadata } from "next";
import Link from "next/link";
import { FreeTierCard } from "@/components/ContentCard";
import { getSiteData } from "@/lib/content";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export function freeTierIndexMetadata(locale: Locale): Metadata {
  const dictionary = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/free-tier",
    title: dictionary.seo.freeTierTitle,
    description: dictionary.seo.freeTierDescription,
  });
}

export default function FreeTierIndexView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { freeTiers } = getSiteData(locale);
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href={localePath(locale, "/")} className="text-sm text-foreground/60 hover:text-foreground">{dictionary.common.backToHome}</Link><div className="mt-8 max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{dictionary.freeTierIndex.eyebrow}</p><h1 className="mt-3 text-3xl font-bold">{dictionary.freeTierIndex.title}</h1><p className="mt-4 text-base leading-7 text-foreground/70">{dictionary.freeTierIndex.lead}</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{freeTiers.map((entry) => <FreeTierCard key={entry.slug} locale={locale} entry={entry} />)}</div></div>;
}
