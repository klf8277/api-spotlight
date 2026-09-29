import type { Metadata } from "next";
import { otherLocale, localeUrl, ogLocale, SITE_URL, type Locale } from "./i18n";

export interface PageSeo {
  locale: Locale;
  /** 站内路径：以 "/" 开头、无尾斜杠，首页传 "/"。 */
  path: string;
  title: string;
  description: string;
  openGraphType?: "website" | "article";
}

/**
 * 每语种 TDK + canonical + 双向 hreflang。
 * canonical 与 sitemap 保持同一口径：绝对 URL 且不带尾斜杠
 * （CF Pages 对带尾斜杠的路径返回 308，尾斜杠会造成「网页会自动重定向」）。
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  openGraphType = "website",
}: PageSeo): Metadata {
  const canonical = localeUrl(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: localeUrl("en", path),
        zh: localeUrl("zh", path),
        "x-default": localeUrl("en", path),
      },
    },
    openGraph: {
      type: openGraphType,
      url: canonical,
      siteName: "APISpotlight",
      title,
      description,
      locale: ogLocale(locale),
      alternateLocale: ogLocale(otherLocale(locale)),
    },
  };
}

/** 站点级基础 metadata（每个根布局各注入一次）。 */
export function siteMetadata(locale: Locale, title: string, description: string): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    robots: { index: true, follow: true },
  };
}
