interface HeroProps {
  platformCount: number;
  perkCount: number;
  lastChecked: string;
}

export default function Hero({ platformCount, perkCount, lastChecked }: HeroProps) {
  return (
    <section className="border-b border-foreground/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          {"// Api Spotlight"}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          全网 AI 接口公正评测
          <br className="hidden sm:block" />
          与福利导航
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-foreground/70">
          定期实测 · 数据透明 · 轻量纯静态，零数据库依赖。
          榜单与福利数据由本地 JSON 驱动，所见即所存。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#ranking"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            查看评测排行榜
          </a>
          <a
            href="#perks"
            className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            免费羊毛专区
          </a>
        </div>
        <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 font-mono text-sm text-foreground/60">
          <div>
            <dt className="text-xs uppercase tracking-wider">收录站点</dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">
              {platformCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider">羊毛福利</dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">{perkCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider">最近实测</dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">{lastChecked}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
