import type { MetadataRoute } from "next";
import { freeTiers, platformContents, resources } from "@/lib/content";
import { localeUrl, LOCALES } from "@/lib/i18n";

export const dynamic = "force-static";

// 与语种无关的站内路由清单；英文为默认语种（占根路径），中文在 /zh
const ROUTES = [
  "/",
  "/method",
  "/test",
  "/free-tier",
  "/resources",
  ...platformContents.map((item) => `/platform/${item.slug}`),
  ...freeTiers.map((item) => `/free-tier/${item.slug}`),
  ...resources.map((item) => `/resources/${item.slug}`),
  ...[...new Set(resources.map((item) => item.category_slug))].map((slug) => `/resources/category/${slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(locale, route),
        changeFrequency: route === "/" ? "daily" : "monthly",
        priority: route === "/" ? 1 : 0.6,
        // 双向 hreflang：每个 URL 都声明两个语种与 x-default，中英互为镜像
        alternates: {
          languages: {
            en: localeUrl("en", route),
            zh: localeUrl("zh", route),
            "x-default": localeUrl("en", route),
          },
        },
      });
    }
  }
  return entries;
}
