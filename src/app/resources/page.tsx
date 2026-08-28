import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/ContentCard";
import { resources } from "@/lib/content";

export const metadata: Metadata = {
  title: "Developer Resources · APISpotlight",
  description: "围绕 AI、API、开发工具、免费数据、向量数据库、托管、算力与可观测性的精选开发者资源。",
  alternates: { canonical: "/resources/" },
  openGraph: { url: "https://api-spotlight.pages.dev/resources/", title: "Developer Resources · APISpotlight", description: "精选 AI/API 开发者资源目录。" },
};

export default function ResourcesPage() {
  const categories = [...new Map(resources.map((resource) => [resource.category_slug, resource.category])).entries()];
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href="/" className="text-sm text-foreground/60 hover:text-foreground">← 返回首页</Link><div className="mt-8 max-w-3xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Developer Resources</p><h1 className="mt-3 text-3xl font-bold">AI / API 开发者资源</h1><p className="mt-4 text-base leading-7 text-foreground/70">只收录与 AI、API、开发、基础设施直接相关的资源。每项附官方入口、免费说明、关联平台和质量评分；不做泛 AI 工具垃圾场。</p></div><nav className="mt-8 flex flex-wrap gap-2" aria-label="资源分类">{categories.map(([slug, label]) => <Link key={slug} href={`/resources/category/${slug}`} className="rounded-full border border-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/5">{label}</Link>)}</nav><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div></div>;
}
