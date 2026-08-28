import platformData from "@/data/platforms.json";
import platformContentData from "@/data/platform-content.json";
import freeTierData from "@/data/free-tiers.json";
import resourceData from "@/data/resources.json";
import type { DeveloperResource, FreeTierEntry, Platform, PlatformContent } from "@/types";

export const platforms = platformData as Platform[];
export const platformContents = platformContentData as PlatformContent[];
export const freeTiers = freeTierData as FreeTierEntry[];
export const resources = resourceData as DeveloperResource[];

export function getPlatformContent(slug: string) {
  return platformContents.find((item) => item.slug === slug);
}

export function getPlatform(slug: string) {
  const content = getPlatformContent(slug);
  return content ? platforms.find((item) => item.id === content.platform_id) : undefined;
}

export function getPlatformById(platformId: string) {
  const content = platformContents.find((item) => item.platform_id === platformId);
  return content ? platforms.find((item) => item.id === platformId) : undefined;
}

export function platformSlug(platformId: string) {
  return platformContents.find((item) => item.platform_id === platformId)?.slug;
}

export function getFreeTier(slug: string) {
  return freeTiers.find((item) => item.slug === slug);
}

export function getResource(slug: string) {
  return resources.find((item) => item.slug === slug);
}

export function platformHref(platformId: string) {
  return `/platform/${platformContents.find((item) => item.platform_id === platformId)?.slug ?? ""}`;
}

export function resourceHref(slug: string) {
  return `/resources/${slug}`;
}

export function freeTierHref(slug: string) {
  return `/free-tier/${slug}`;
}

export function formatStatus(status: Platform["status"]) {
  return { online: "在线", degraded: "波动", offline: "离线" }[status];
}
