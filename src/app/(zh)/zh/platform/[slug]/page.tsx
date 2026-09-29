import type { Metadata } from "next";
import { platformContents } from "@/lib/content";
import PlatformDetailView, { platformDetailMetadata } from "@/views/PlatformDetailView";

export const dynamic = "force-static";

export function generateStaticParams() {
  return platformContents.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => platformDetailMetadata("zh", slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlatformDetailView locale="zh" slug={slug} />;
}
