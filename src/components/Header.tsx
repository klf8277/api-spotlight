import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// 社区链接为占位地址，上线前替换为真实群组/频道
const COMMUNITY = [
  { href: "https://t.me/apitest", label: "Telegram" },
  { href: "https://qm.qq.com/apitest", label: "QQ" },
];

// Commercial Hub 独立部署，仅导航互连；本站不读取其数据
const COMMERCIAL_HUB = "https://api-spotlight-commercial.pages.dev/";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-4 py-3 sm:gap-4">
        <Link
          href="/"
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
        <nav className="flex min-w-0 items-center justify-end gap-0 text-xs sm:gap-1.5 sm:text-sm">
          <Link href="/#ranking" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">评测排行榜</span>
            <span className="sm:hidden">榜单</span>
          </Link>
          <Link href="/#perks" className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 hover:bg-foreground/5 sm:px-2">
            <span className="hidden sm:inline">官方赠额区</span>
            <span className="sm:hidden">赠额</span>
          </Link>
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
      </div>
    </header>
  );
}
