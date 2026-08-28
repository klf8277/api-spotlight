import Link from "next/link";
import type { DeveloperResource, FreeTierEntry, Platform, PlatformContent } from "@/types";
import { freeTierHref, platformHref, resourceHref } from "@/lib/content";

export function PlatformCard({ platform, content }: { platform: Platform; content: PlatformContent }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Platform</p>
          <h3 className="mt-2 text-lg font-semibold">{platform.name}</h3>
        </div>
        <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs">{platform.status === "online" ? "在线" : platform.status === "degraded" ? "波动" : "离线"}</span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-foreground/70">{content.short_description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/60">
        {platform.tags?.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-foreground/10 px-2 py-1">{tag}</span>)}
      </div>
      <Link href={`/platform/${content.slug}`} className="mt-5 inline-flex justify-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:opacity-90">查看平台页 →</Link>
    </article>
  );
}

export function FreeTierCard({ entry }: { entry: FreeTierEntry }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Free Tier</p>
      <h3 className="mt-2 text-lg font-semibold">{entry.provider}</h3>
      <p className="mt-1 text-xs text-foreground/50">{entry.api_service}</p>
      <p className="mt-4 flex-1 text-sm leading-6 text-foreground/80">{entry.free_amount}</p>
      <p className="mt-3 text-xs text-foreground/50">核验：{entry.last_verified} · {entry.confidence === "high" ? "高" : entry.confidence === "medium" ? "中" : "低"}置信度</p>
      <Link href={freeTierHref(entry.slug)} className="mt-4 inline-flex justify-center rounded-md border border-foreground/10 py-2 text-sm font-medium hover:bg-foreground/5">查看免费条件 →</Link>
    </article>
  );
}

export function ResourceCard({ resource }: { resource: DeveloperResource }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">{resource.category}</span>
        <span className="text-xs text-foreground/45">{resource.quality.total}/30</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{resource.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-foreground/70">{resource.description}</p>
      <p className="mt-3 text-xs text-foreground/50">{resource.free_summary}</p>
      <Link href={resourceHref(resource.slug)} className="mt-4 inline-flex justify-center rounded-md border border-foreground/10 py-2 text-sm font-medium hover:bg-foreground/5">查看资源 →</Link>
    </article>
  );
}

export function RelatedLinks({ platformIds = [], freeTierSlugs = [], resourceSlugs = [] }: { platformIds?: string[]; freeTierSlugs?: string[]; resourceSlugs?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {platformIds.map((id) => <Link key={id} href={platformHref(id)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">平台页</Link>)}
      {freeTierSlugs.map((slug) => <Link key={slug} href={freeTierHref(slug)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">Free Tier</Link>)}
      {resourceSlugs.map((slug) => <Link key={slug} href={resourceHref(slug)} className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5">开发资源</Link>)}
    </div>
  );
}
