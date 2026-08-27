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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight"
        >
          <span aria-hidden>🔦</span>
          <span className="flex flex-col leading-none">
            <span>APISpotlight</span>
            <span className="text-[10px] font-normal tracking-widest text-foreground/50">
              API 探照灯
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1.5">
          <Link href="/#ranking" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            评测排行榜
          </Link>
          <Link href="/#perks" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            官方赠额区
          </Link>
          <Link href="/test" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            在线测试区
          </Link>
          <Link href="/method" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            方法学
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
