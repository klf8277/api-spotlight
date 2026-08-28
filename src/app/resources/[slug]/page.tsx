import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/ContentCard";
import { getResource, resources } from "@/lib/content";

export const dynamic = "force-static";
export function generateStaticParams() { return resources.map((resource) => ({ slug: resource.slug })); }
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { return params.then(({ slug }) => { const resource = getResource(slug); return resource ? { title: `${resource.name} · APISpotlight`, description: `${resource.name}：${resource.description} 官方入口、免费说明与关联 AI/API 平台。`, alternates: { canonical: `/resources/${slug}/` }, openGraph: { url: `https://api-spotlight.pages.dev/resources/${slug}/`, title: `${resource.name} · APISpotlight`, description: resource.description } } : {}; }); }

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const resource = getResource(slug); if (!resource) notFound();
  return <div className="mx-auto max-w-4xl px-4 py-12"><Link href="/resources" className="text-sm text-foreground/60 hover:text-foreground">← 返回资源目录</Link><main className="mt-8"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Resource / {resource.category}</p><h1 className="mt-3 text-3xl font-bold">{resource.name}</h1><p className="mt-4 text-lg leading-8 text-foreground/75">{resource.description}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">免费与开源</h2><p className="mt-3 text-sm leading-6 text-foreground/70">{resource.free_summary}</p></div><div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">质量评分</h2><p className="mt-3 text-2xl font-semibold">{resource.quality.total}<span className="text-sm font-normal text-foreground/50"> / 30</span></p><p className="mt-1 text-xs text-foreground/50">{resource.quality.verdict} · 维护风险 {resource.quality.maintenance_risk}/5</p></div></div><section className="mt-8 rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">Official sources</h2><div className="mt-3 space-y-2 text-sm"><External href={resource.official_url} label="官方入口"/>{resource.documentation_url && <External href={resource.documentation_url} label="官方文档"/>}</div><p className="mt-4 text-xs text-foreground/50">最后核验：{resource.last_verified}。免费层不是永久承诺，使用前请重新核对官方条件。</p></section><section className="mt-8"><h2 className="font-semibold">继续探索</h2><div className="mt-3"><RelatedLinks platformIds={resource.related_platform_ids} freeTierSlugs={resource.related_free_tier_slugs}/></div></section></main></div>;
}

function External({ href, label }: { href: string; label: string }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 hover:text-emerald-600">{label} ↗</a>; }
