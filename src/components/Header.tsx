"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { commercialHubHref, getDictionary, localePath, type Locale } from "@/lib/i18n";

// 社区链接为占位地址，上线前替换为真实群组/频道
const COMMUNITY = [
  { href: "https://t.me/klf_ai_radar", label: "Telegram" },
  { href: "https://qm.qq.com/apitest", label: "QQ" },
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

  const mobilePrimary = [
    { href: "/", label: dictionary.nav.home },
    { href: "/#ranking", label: dictionary.nav.platforms },
    { href: "/free-tier", label: dictionary.nav.freeTier },
    { href: "/test", label: dictionary.nav.modelTest },
    { href: "/resources", label: dictionary.nav.resources },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <Link
          href={path("/")}
          onClick={closeDrawer}
          className="flex shrink-0 items-center gap-2 font-mono text-base font-bold tracking-tight sm:text-lg"
        >
          <span aria-hidden>🔦</span>
          <span className="flex flex-col leading-none">
            <span>APISpotlight</span>
            <span className="hidden text-[10px] font-normal tracking-widest text-foreground/50 sm:block">
              {dictionary.common.tagline}
            </span>
          </span>
        </Link>
        <nav className="hidden min-w-0 items-center justify-end gap-0 text-xs sm:flex sm:gap-1.5 sm:text-sm">
          <Link href={path("/#ranking")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">{dictionary.nav.ranking}</span>
            <span className="sm:hidden">{dictionary.nav.rankingShort}</span>
          </Link>
          <Link href={path("/#perks")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">{dictionary.nav.perks}</span>
            <span className="sm:hidden">{dictionary.nav.perksShort}</span>
          </Link>
          <Link href={path("/free-tier")} className="hidden shrink-0 whitespace-nowrap rounded-md px-2 py-1 hover:bg-foreground/5 sm:inline">{dictionary.nav.freeTier}</Link>
          <Link href={path("/resources")} className="hidden shrink-0 whitespace-nowrap rounded-md px-2 py-1 hover:bg-foreground/5 sm:inline">{dictionary.nav.resources}</Link>
          <Link href={path("/test")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">{dictionary.nav.test}</span>
            <span className="sm:hidden">{dictionary.nav.testShort}</span>
          </Link>
          <Link href={path("/method")} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">{dictionary.nav.methodology}</span>
            <span className="sm:hidden">{dictionary.nav.methodologyShort}</span>
          </Link>
          <a
            href={locale === "zh" ? "https://hub.apiops.cloud/zh/radar/" : "https://hub.apiops.cloud/radar/"}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-2 py-1 font-semibold text-amber-500 hover:bg-foreground/5 hover:text-amber-400 sm:inline"
          >
            {dictionary.nav.radar || (locale === "zh" ? "🔥 AI 副业雷达 ↗" : "AI Radar ↗")}
          </a>
          <a
            href={commercialHubHref(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-2 py-1 text-foreground/70 hover:bg-foreground/5 hover:text-foreground sm:inline"
          >
            {dictionary.nav.commercial}
          </a>
          {COMMUNITY.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-md px-2 py-1 text-foreground/70 hover:bg-foreground/5 hover:text-foreground sm:inline"
            >
              {c.label}
            </a>
          ))}
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />
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
        <div className="absolute inset-x-0 top-full min-h-[calc(100vh-65px)] bg-black/30 sm:hidden" onClick={closeDrawer}>
          <nav
            id="mobile-navigation-drawer"
            aria-label={dictionary.nav.mobileNavLabel}
            className="ml-auto min-h-[calc(100vh-65px)] w-[min(88vw,22rem)] border-l border-foreground/10 bg-background px-5 py-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <span className="font-mono text-sm font-semibold">APISpotlight</span>
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
              <Link href={path("/method")} onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                {dictionary.nav.methodology}
              </Link>
              <a
                href={locale === "zh" ? "https://hub.apiops.cloud/zh/radar/" : "https://hub.apiops.cloud/radar/"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeDrawer}
                className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-amber-500 hover:bg-foreground/5"
              >
                <span>{dictionary.nav.radar || (locale === "zh" ? "🔥 AI 副业雷达 ↗" : "AI Radar ↗")}</span>
                <span className="text-xs">↗</span>
              </a>
              <a href={commercialHubHref(locale)} target="_blank" rel="noopener noreferrer" onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                {dictionary.nav.commercial}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
