import type { Metadata } from "next";
import Link from "next/link";
import { FreeTierCard } from "@/components/ContentCard";
import { freeTiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Verified Free Tier · APISpotlight",
  description: "按统一字段整理的 AI/API 免费额度、试用额度和免费层入口；每条记录附官方来源、核验日期与限制。",
  alternates: { canonical: "/free-tier/" },
  openGraph: { url: "https://api-spotlight.pages.dev/free-tier/", title: "Verified Free Tier · APISpotlight", description: "AI/API 免费额度与免费层的官方来源目录。" },
};

export default function FreeTierIndexPage() {
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href="/" className="text-sm text-foreground/60 hover:text-foreground">← 返回首页</Link><div className="mt-8 max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Verified Free Tier</p><h1 className="mt-3 text-3xl font-bold">AI/API 免费额度与免费层</h1><p className="mt-4 text-base leading-7 text-foreground/70">只收录有官方入口和核验日期的记录。额度、速率和有效期会变化；页面无法确认的字段明确标记为 Unknown。</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{freeTiers.map((entry) => <FreeTierCard key={entry.slug} entry={entry} />)}</div></div>;
}
