import platformData from "@/data/platforms.json";
import platformContentData from "@/data/platform-content.json";
import freeTierData from "@/data/free-tiers.json";
import resourceData from "@/data/resources.json";
import perkData from "@/data/perks.json";
import authenticityData from "@/data/authenticity.json";
import historyData from "@/data/history.json";
import overlayData from "@/data/i18n/en.json";
import { getDictionary, localePath, type Locale } from "./i18n";
import type {
  AuthenticityReport,
  DeveloperResource,
  FreeTierEntry,
  HistoryEntry,
  Perk,
  Platform,
  PlatformContent,
  TranslationOverlay,
} from "@/types";

// 基线数据（中文原文，Contract v1 冻结文件，禁止在代码里改写）
export const platforms = platformData as Platform[];
export const platformContents = platformContentData as PlatformContent[];
export const freeTiers = freeTierData as FreeTierEntry[];
export const resources = resourceData as DeveloperResource[];
export const perks = perkData as Perk[];
export const authenticityReports = authenticityData.reports as AuthenticityReport[];

const overlay = overlayData as TranslationOverlay;

/** 覆盖层缺项（undefined / null / 空数组）一律回退基线，保证英文页永不出现空字段。 */
function mergeEntry<T extends object>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  const merged = { ...base } as Record<string, unknown>;
  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[field] = value;
  }
  return merged as T;
}

function localizeList<T extends object, P extends Partial<T>>(
  locale: Locale,
  items: T[],
  keyOf: (item: T) => string,
  patches: Record<string, P> | undefined,
): T[] {
  if (locale === "zh" || !patches) return items;
  return items.map((item) => mergeEntry(item, patches[keyOf(item)]));
}

export interface SiteData {
  platforms: Platform[];
  platformContents: PlatformContent[];
  freeTiers: FreeTierEntry[];
  resources: DeveloperResource[];
  perks: Perk[];
}

export function getSiteData(locale: Locale): SiteData {
  return {
    platforms: localizeList(locale, platforms, (item) => item.id, overlay.platforms),
    platformContents: localizeList(locale, platformContents, (item) => item.slug, overlay.platformContent),
    freeTiers: localizeList(locale, freeTiers, (item) => item.slug, overlay.freeTiers),
    resources: localizeList(locale, resources, (item) => item.slug, overlay.resources),
    perks: localizeList(locale, perks, (item) => item.id, overlay.perks),
  };
}

export function getLocalizedPlatformContent(locale: Locale, slug: string) {
  return getSiteData(locale).platformContents.find((item) => item.slug === slug);
}

export function getLocalizedPlatform(locale: Locale, slug: string) {
  const { platformContents: contents, platforms: list } = getSiteData(locale);
  const content = contents.find((item) => item.slug === slug);
  return content ? list.find((item) => item.id === content.platform_id) : undefined;
}

export function getLocalizedFreeTier(locale: Locale, slug: string) {
  return getSiteData(locale).freeTiers.find((item) => item.slug === slug);
}

export function getLocalizedResource(locale: Locale, slug: string) {
  return getSiteData(locale).resources.find((item) => item.slug === slug);
}

/** platform_id → 最新真实性抽查报告（后写覆盖先写，与页面展示口径一致）。 */
export function getAuthenticityMap(locale: Locale): Record<string, AuthenticityReport> {
  const map: Record<string, AuthenticityReport> = {};
  for (const report of authenticityReports) {
    const note = locale === "en" ? overlay.authenticity?.[report.platform_id]?.note : undefined;
    map[report.platform_id] = note ? { ...report, note } : report;
  }
  return map;
}

/** 近 30 天延迟趋势：platform_id → [{date, latency}]，按日期升序（数据源 history.json）。 */
export function getLatencyHistory(): Record<string, Array<{ date: string; latency: number }>> {
  const history = (historyData.entries ?? []) as HistoryEntry[];
  const acc: Record<string, Array<{ date: string; latency: number }>> = {};
  for (const entry of history) {
    for (const [platformId, point] of Object.entries(entry.platforms ?? {})) {
      if (point.latency_ms == null) continue;
      (acc[platformId] ??= []).push({ date: entry.date, latency: point.latency_ms });
    }
  }
  return acc;
}

/** 榜单「最近实测」日期：全部平台里最新的 last_checked（YYYY-MM-DD）。 */
export function getLastChecked(): string {
  return [...platforms]
    .map((item) => item.last_checked)
    .sort((a, b) => b.localeCompare(a))[0]
    ?.slice(0, 10) ?? "—";
}

// 路由与 slug 均与语种无关，仅用于生成静态参数与 sitemap
export function platformSlug(platformId: string) {
  return platformContents.find((item) => item.platform_id === platformId)?.slug;
}

export function platformHref(locale: Locale, platformId: string) {
  const slug = platformSlug(platformId);
  return localePath(locale, slug ? `/platform/${slug}` : "/");
}

export function resourceHref(locale: Locale, slug: string) {
  return localePath(locale, `/resources/${slug}`);
}

export function freeTierHref(locale: Locale, slug: string) {
  return localePath(locale, `/free-tier/${slug}`);
}

export function formatStatus(locale: Locale, status: Platform["status"]) {
  const dictionary = getDictionary(locale);
  return {
    online: dictionary.common.online,
    degraded: dictionary.common.degraded,
    offline: dictionary.common.offline,
  }[status];
}
