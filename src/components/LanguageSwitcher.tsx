"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary, localePath, localePrefix, otherLocale, type Locale } from "@/lib/i18n";

/**
 * 语言切换：渲染成真实 <a>（可被爬虫发现），按当前路径换算出另一语种的对应页。
 */
export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || localePath(locale, "/");
  const dictionary = getDictionary(locale);
  const target = otherLocale(locale);

  const prefix = localePrefix(locale);
  const withoutPrefix = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const normalized = withoutPrefix.replace(/\/+$/, "");
  const href = localePath(target, normalized === "" ? "/" : normalized);

  const label = target === "zh" ? dictionary.language.zhLabel : dictionary.language.enLabel;
  const ariaLabel = target === "zh" ? dictionary.language.switchToZh : dictionary.language.switchToEn;

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-foreground/10 px-2 py-1.5 text-xs leading-none hover:bg-foreground/5"
    >
      <span aria-hidden>🌐</span>
      <span>{label}</span>
    </Link>
  );
}
