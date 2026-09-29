import en from "@/locales/en.json";
import zh from "@/locales/zh.json";

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

/** 默认语种（不带路径前缀，直接占根路径） */
export const DEFAULT_LOCALE: Locale = "en";

export const SITE_URL = "https://api-spotlight.pages.dev";

/** Commercial Hub 独立部署，仅导航互连；本站不读取其数据。 */
export const COMMERCIAL_HUB_URL = "https://api-spotlight-commercial.pages.dev/";

/** Commercial Hub 英文占根路径、中文在 /zh，故按本站语种指向对应版本。 */
export function commercialHubHref(locale: Locale): string {
  return `${COMMERCIAL_HUB_URL}${locale === "zh" ? "zh/" : ""}`;
}

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function htmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}

export function ogLocale(locale: Locale): string {
  return locale === "zh" ? "zh_CN" : "en_US";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "zh" : "en";
}

/** 该语种的路径前缀：默认语种为空串，其余为 "/zh"。 */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/** 生成站内路径。path 必须以 "/" 开头，无尾斜杠，首页传 "/"。 */
export function localePath(locale: Locale, path: string): string {
  if (path === "/") return localePrefix(locale) || "/";
  return `${localePrefix(locale)}${path}`;
}

/** 生成规范绝对 URL（无尾斜杠，与 sitemap 口径一致）。 */
export function localeUrl(locale: Locale, path: string): string {
  const localized = localePath(locale, path);
  return localized === "/" ? SITE_URL : `${SITE_URL}${localized}`;
}

/** 数据里出现的链接：站内相对路径加语种前缀，外部 URL 原样返回。 */
export function localizeHref(locale: Locale, href: string): string {
  return href.startsWith("/") ? localePath(locale, href) : href;
}

/** 词典模板插值："View all {count} →" + { count: 3 }。 */
export function template(value: string, vars: Record<string, string | number>): string {
  return value.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
