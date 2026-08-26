import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// 社区链接为占位地址，上线前替换为真实群组/频道
const COMMUNITY = [
  { href: "https://t.me/apitest", label: "Telegram" },
  { href: "https://qm.qq.com/apitest", label: "QQ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight"
        >
          <span aria-hidden>🔦</span>
          Api探照灯
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1.5">
          <a href="/#ranking" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            评测排行榜
          </a>
          <a href="/#perks" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            官方赠额区
          </a>
          <Link href="/test" className="rounded-md px-2 py-1 hover:bg-foreground/5">
            在线测试区
          </Link>
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
