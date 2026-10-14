"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { commercialHubHref, getDictionary, localePath, type Locale } from "@/lib/i18n";

// 社区链接为占位地址，上线前替换为真实群组/频道（批F 工单2-A：QQ 死链已彻底拔除）
const COMMUNITY = [
  { href: "https://t.me/klf_ai_radar", label: "Telegram" },
];

// Commercial Hub 独立部署，仅导航互连；本站不读取其数据（链接按语种指向对应版本）

export default function Header({ locale }: { locale: Locale }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dictionary = getDictionary(locale);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);
  const path = (value: string) => localePath(locale, value);
  const radarHref = locale === "zh" ? "https://hub.apiops.cloud/zh/radar/" : "https://hub.apiops.cloud/radar/";

  // 批F 工单1 防撞定案（2026-10-15 真机实测 7 视口 × 中英双语）：
  //   · Logo 侧常驻 mr-4 lg:mr-8 安全区，1024px 以下整栏收进抽屉（头部只留 Logo + 菜单键）；
  //   · 1024px+ 展示「核心六项 + 开源武器库 + 大厂特惠」短词全量导航（含语言 / 主题切换），
  //     1280px+ 字号升到 text-sm；实测导航总宽恒小于可用宽度（1024 档 ≈744/773px、1280 档 ≈858/916px），
  //     不触发换行、绝不与 Logo 碰撞；
  //   · 「第三方 API 方案 / Telegram」等低频链接统一常驻抽屉（汉堡键全宽度可用，≥1024 即“更多”菜单），
  //     避免 1152px 容器里硬塞 12 项导致物理溢出。
  const mobilePrimary = [
    { href: "/", label: dictionary.nav.home },
    { href: "/#ranking", label: dictionary.nav.platforms },
    { href: "/#perks", label: dictionary.nav.perks },
    { href: "/free-tier", label: dictionary.nav.freeTier },
    { href: "/test", label: dictionary.nav.modelTest },
    { href: "/resources", label: dictionary.nav.resources },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      {/* 批F 工单1：头部行 flex-wrap 兜底——极窄屏（<360px）只会换行，绝不产生横向溢出 */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <Link
          href={path("/")}
          onClick={closeDrawer}
          className="group mr-4 flex shrink-0 items-center gap-2.5 tracking-tight lg:mr-8"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-cyan-500/10 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.12)] transition-all group-hover:border-emerald-500/50 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.22)] dark:text-emerald-400">
            <svg
              className="h-4.5 w-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" className="opacity-30" />
              <circle cx="12" cy="12" r="4.5" className="opacity-70" />
              <circle cx="12" cy="12" r="1.5" className="fill-current" />
              <line x1="12" y1="1" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="23" />
              <line x1="1" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="23" y2="12" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-mono text-base font-bold tracking-tight text-foreground sm:text-lg">
              APISpotlight
            </span>
            <span className="mt-1 hidden text-[10px] font-sans font-medium tracking-wider text-foreground/50 sm:block">
              {dictionary.common.tagline}
            </span>
          </span>
        </Link>
        {/* 批F 工单1：桌面导航 lg 起展开（短词全量，实测恒稳单行）；flex-wrap 兜底——任何意外超宽只会换行，绝不可能压到 Logo */}
        <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-0 text-xs lg:flex lg:gap-1.5 xl:text-sm">
          <Link href={path("/#ranking")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.rankingShort}
          </Link>
          <Link href={path("/#perks")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.perksShort}
          </Link>
          <Link href={path("/free-tier")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.freeTier}
          </Link>
          <Link href={path("/resources")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.resources}
          </Link>
          <Link href={path("/test")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.testShort}
          </Link>
          <Link href={path("/method")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 xl:px-2">
            {dictionary.nav.methodologyShort}
          </Link>
          <a
            href={radarHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 font-semibold text-amber-500 hover:bg-foreground/5 hover:text-amber-400 xl:px-2"
          >
            {dictionary.nav.radarShort}
          </a>
          {/* 批F 工单2-A：常驻特惠药丸 → 商业站 /offers（漏斗顶部曝光） */}
          <a
            href={`${commercialHubHref(locale)}offers/`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {dictionary.nav.deals}
          </a>
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />
        </nav>
        {/* 批F 工单1：汉堡菜单全宽度常驻——lg 以下展开全量抽屉；lg 以上作为「更多」菜单，
            常驻「第三方 API 方案 / Telegram」等低频链接，保证任何视口下全站导航零遗漏 */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher locale={locale} />
            <ThemeToggle locale={locale} />
          </div>
          <button
            type="button"
            aria-label={drawerOpen ? dictionary.nav.closeDrawer : dictionary.nav.openDrawer}
            aria-expanded={drawerOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-foreground/10 text-lg hover:bg-foreground/5"
          >
            <span aria-hidden>{drawerOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>
      {drawerOpen && (
        <div className="absolute inset-x-0 top-full min-h-[calc(100vh-65px)] bg-black/30" onClick={closeDrawer}>
          <nav
            id="mobile-navigation-drawer"
            aria-label={dictionary.nav.mobileNavLabel}
            className="ml-auto min-h-[calc(100vh-65px)] w-[min(88vw,22rem)] border-l border-foreground/10 bg-background px-5 py-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" className="opacity-30" />
                    <circle cx="12" cy="12" r="4.5" className="opacity-70" />
                    <circle cx="12" cy="12" r="1.5" className="fill-current" />
                  </svg>
                </span>
                <span className="font-mono text-sm font-semibold">APISpotlight</span>
              </div>
              <button type="button" onClick={closeDrawer} aria-label={dictionary.nav.closeDrawer} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-foreground/10 text-xl hover:bg-foreground/5">
                <span aria-hidden>×</span>
              </button>
            </div>
            <div className="mt-4 grid gap-1">
              {mobilePrimary.map((item) => (
                <Link key={item.href} href={path(item.href)} onClick={closeDrawer} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-foreground/5">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="my-4 border-t border-foreground/10" />
            <div className="grid gap-1">
              {/* 批F 工单2-A：移动端抽屉同步常驻特惠药丸 */}
              <a
                href={`${commercialHubHref(locale)}offers/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeDrawer}
                className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
              >
                <span>{dictionary.nav.deals}</span>
                <span className="text-xs">↗</span>
              </a>
              <Link href={path("/method")} onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                {dictionary.nav.methodology}
              </Link>
              <a
                href={radarHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeDrawer}
                className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-amber-500 hover:bg-foreground/5"
              >
                <span>{dictionary.nav.radar || (locale === "zh" ? "🛠️ 开源武器库 (副业雷达) ↗" : "🛠️ Open-Source Toolkit ↗")}</span>
              </a>
              <a href={commercialHubHref(locale)} target="_blank" rel="noopener noreferrer" onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                {dictionary.nav.commercial}
              </a>
              {COMMUNITY.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeDrawer}
                  className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
