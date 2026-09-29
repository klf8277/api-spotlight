import type { Metadata } from "next";
import { resources } from "@/lib/content";
import ResourceCategoryView, { resourceCategoryMetadata } from "@/views/ResourceCategoryView";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [...new Set(resources.map((item) => item.category_slug))].map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => resourceCategoryMetadata("zh", slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ResourceCategoryView locale="zh" slug={slug} />;
}
