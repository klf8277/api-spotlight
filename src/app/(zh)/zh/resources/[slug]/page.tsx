import type { Metadata } from "next";
import { resources } from "@/lib/content";
import ResourceDetailView, { resourceDetailMetadata } from "@/views/ResourceDetailView";

export const dynamic = "force-static";

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => resourceDetailMetadata("zh", slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ResourceDetailView locale="zh" slug={slug} />;
}
