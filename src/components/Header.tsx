"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

// 社区链接为占位地址，上线前替换为真实群组/频道
const COMMUNITY = [
  { href: "https://t.me/apitest", label: "Telegram" },
  { href: "https://qm.qq.com/apitest", label: "QQ" },
];

// Commercial Hub 独立部署，仅导航互连；本站不读取其数据
const COMMERCIAL_HUB = "https://api-spotlight-commercial.pages.dev/";

const MOBILE_NAV = [
  { href: "/", label: "首页" },
  { href: "/#ranking", label: "API 平台" },
  { href: "/free-tier", label: "免费额度" },
  { href: "/test", label: "模型测试" },
  { href: "/resources", label: "开发者资源" },
];

const MOBILE_SECONDARY_NAV = [
  { href: "/method", label: "方法与数据" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <Link
          href="/"
          onClick={closeDrawer}
          className="flex shrink-0 items-center gap-2 font-mono text-base font-bold tracking-tight sm:text-lg"
        >
          <span aria-hidden>🔦</span>
          <span className="flex flex-col leading-none">
            <span>APISpotlight</span>
            <span className="hidden text-[10px] font-normal tracking-widest text-foreground/50 sm:block">
              API 探照灯
            </span>
          </span>
        </Link>
        <nav className="hidden min-w-0 items-center justify-end gap-0 text-xs sm:flex sm:gap-1.5 sm:text-sm">
          <Link href="/#ranking" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">评测排行榜</span>
            <span className="sm:hidden">榜单</span>
          </Link>
          <Link href="/#perks" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">官方赠额区</span>
            <span className="sm:hidden">赠额</span>
          </Link>
          <Link href="/free-tier" className="hidden shrink-0 whitespace-nowrap rounded-md px-2 py-1 hover:bg-foreground/5 sm:inline">Free Tier</Link>
          <Link href="/resources" className="hidden shrink-0 whitespace-nowrap rounded-md px-2 py-1 hover:bg-foreground/5 sm:inline">资源</Link>
          <Link href="/test" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">在线测试区</span>
            <span className="sm:hidden">测试</span>
          </Link>
          <Link href="/method" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">方法学</span>
            <span className="sm:hidden">方法</span>
          </Link>
          <a
            href={COMMERCIAL_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-2 py-1 text-foreground/70 hover:bg-foreground/5 hover:text-foreground sm:inline"
          >
            第三方 API 方案<span aria-hidden> ↗</span>
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
          <ThemeToggle />
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={drawerOpen ? "关闭导航菜单" : "打开导航菜单"}
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
            aria-label="移动端主导航"
            className="ml-auto min-h-[calc(100vh-65px)] w-[min(88vw,22rem)] border-l border-foreground/10 bg-background px-5 py-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <span className="font-mono text-sm font-semibold">APISpotlight</span>
              <button type="button" onClick={closeDrawer} aria-label="关闭导航菜单" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-foreground/10 text-xl hover:bg-foreground/5">
                <span aria-hidden>×</span>
              </button>
            </div>
            <div className="mt-4 grid gap-1">
              {MOBILE_NAV.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeDrawer} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-foreground/5">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="my-4 border-t border-foreground/10" />
            <div className="grid gap-1">
              {MOBILE_SECONDARY_NAV.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                  {item.label}
                </Link>
              ))}
              <a href={COMMERCIAL_HUB} target="_blank" rel="noopener noreferrer" onClick={closeDrawer} className="rounded-lg px-3 py-3 text-sm text-foreground/75 hover:bg-foreground/5">
                第三方 API 方案 ↗
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
