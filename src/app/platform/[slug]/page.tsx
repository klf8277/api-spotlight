import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/ContentCard";
import { freeTiers, getPlatform, getPlatformContent, platformContents } from "@/lib/content";

export const dynamic = "force-static";

export function generateStaticParams() {
  return platformContents.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const content = getPlatformContent(slug);
    const platform = getPlatform(slug);
    if (!content || !platform) return {};
    return {
      title: `${platform.name} API 平台页 · APISpotlight`,
      description: `${platform.name} 的 API 能力、免费条件、官方定价、文档、Benchmark 与推荐用法。最后核验 ${content.last_verified}。`,
      alternates: { canonical: `/platform/${slug}/` },
      openGraph: { url: `https://api-spotlight.pages.dev/platform/${slug}/`, title: `${platform.name} API 平台页 · APISpotlight`, description: content.short_description },
    };
  });
}

export default async function PlatformPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = getPlatformContent(slug);
  const platform = getPlatform(slug);
  if (!content || !platform) notFound();
  const freeTier = freeTiers.find((entry) => entry.platform_id === platform.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/" className="text-sm text-foreground/60 hover:text-foreground">← 返回首页</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <main>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Platform / {content.slug}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{platform.name} API</h1>
          <p className="mt-4 text-base leading-7 text-foreground/70">{content.short_description}</p>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <Info title="API 能力" items={content.capabilities} />
            <Info title="推荐用法" items={content.recommended_use_cases} />
            <Info title="重要限制" items={content.restrictions} />
            <Info title="免费层" items={[content.free_tier_summary, `免费限制：${content.free_limits}`, `信用卡：${content.credit_card}`, `注册：${content.signup}`]} />
          </section>

          <section className="mt-8 rounded-xl border border-foreground/10 p-5">
            <h2 className="font-semibold">Benchmark 观察</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/70">当前公开实测：状态 {platform.status === "online" ? "在线" : platform.status === "degraded" ? "波动" : "离线"}，延迟 {platform.latency_ms == null ? "—" : `${platform.latency_ms} ms`}，成功率 {platform.success_rate}%。这些值直接来自现有平台数据，不在内容层重复维护。</p>
            <Link href="/#ranking" className="mt-3 inline-block text-sm underline underline-offset-4">查看完整 Benchmark 榜单 →</Link>
          </section>
        </main>
        <aside className="space-y-4">
          <div className="rounded-xl border border-foreground/10 p-5">
            <h2 className="font-semibold">官方入口</h2>
            <div className="mt-4 space-y-2 text-sm">
              <External href={content.website_url} label="官方网站" />
              <External href={content.documentation_url} label="官方文档" />
              <External href={content.pricing_url} label="官方定价" />
            </div>
            <p className="mt-4 text-xs text-foreground/50">最后核验：{content.last_verified} · {content.verification_status === "verified" ? "已核验" : "部分核验"}</p>
          </div>
          {freeTier && <div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">相关 Free Tier</h2><Link href={`/free-tier/${freeTier.slug}`} className="mt-3 inline-block text-sm underline underline-offset-4">{freeTier.free_amount} →</Link></div>}
          <div className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">继续探索</h2><div className="mt-3"><RelatedLinks resourceSlugs={content.related_resource_slugs} /></div></div>
        </aside>
      </div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-foreground/10 p-5"><h2 className="font-semibold">{title}</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">{items.map((item) => <li key={item}>· {item}</li>)}</ul></section>;
}

function External({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 hover:text-emerald-600">{label} ↗</a>;
}
