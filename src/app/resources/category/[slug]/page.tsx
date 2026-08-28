import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/ContentCard";
import { resources } from "@/lib/content";

export const dynamic = "force-static";
export function generateStaticParams() { return [...new Set(resources.map((item) => item.category_slug))].map((slug) => ({ slug })); }
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { return params.then(({ slug }) => { const item = resources.find((resource) => resource.category_slug === slug); return item ? { title: `${item.category} 资源分类 · APISpotlight`, description: `APISpotlight 精选 ${item.category} 开发者资源。`, alternates: { canonical: `/resources/category/${slug}/` } } : {}; }); }

export default async function ResourceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const items = resources.filter((resource) => resource.category_slug === slug); const label = items[0]?.category;
  if (!items.length) return <div className="mx-auto max-w-3xl px-4 py-12"><Link href="/resources">← 返回资源目录</Link><h1 className="mt-8 text-2xl font-bold">未找到资源分类</h1></div>;
  return <div className="mx-auto max-w-6xl px-4 py-12"><Link href="/resources" className="text-sm text-foreground/60 hover:text-foreground">← 返回资源目录</Link><h1 className="mt-8 text-3xl font-bold">{label}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/70">围绕 AI/API 开发工作流筛选的官方资源，免费条件和限制以各自官方来源为准。</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div></div>;
}
