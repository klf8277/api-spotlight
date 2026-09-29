import type { Metadata } from "next";
import { freeTiers } from "@/lib/content";
import FreeTierDetailView, { freeTierDetailMetadata } from "@/views/FreeTierDetailView";

export const dynamic = "force-static";

export function generateStaticParams() {
  return freeTiers.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => freeTierDetailMetadata("en", slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FreeTierDetailView locale="en" slug={slug} />;
}
