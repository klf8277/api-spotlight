interface HeroProps {
  platformCount: number;
  perkCount: number;
  lastChecked: string;
}

export default function Hero({ platformCount, perkCount, lastChecked }: HeroProps) {
  return (
    <section className="border-b border-foreground/10 bg-foreground/[0.015]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {"// APISpotlight · API 探照灯"}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            AI API 原厂模型实测与数据参考
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/70 sm:text-lg">
            通过真实请求记录延迟、成功率与可用性，并公开测试方法和最近更新时间。
            纯静态、零数据库，数据来自仓库中的可追溯 JSON。
          </p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#ranking"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm hover:opacity-90"
          >
            查看 Benchmark
          </a>
          <a
            href="#perks"
            className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            官方赠额区
          </a>
          <a
            href="/test"
            className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 sm:hidden"
          >
            模型测试 →
          </a>
        </div>
        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-4">
            <dt className="text-xs text-foreground/50">真实请求</dt>
            <dd className="mt-2 text-sm font-semibold">定期实测</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-4">
            <dt className="text-xs text-foreground/50">数据范围</dt>
            <dd className="mt-2 text-2xl font-semibold">{platformCount}</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-4">
            <dt className="text-xs text-foreground/50">公开赠额</dt>
            <dd className="mt-2 text-2xl font-semibold">{perkCount}</dd>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background/70 p-4">
            <dt className="text-xs text-foreground/50">最后实测</dt>
            <dd className="mt-2 font-mono text-sm font-semibold">{lastChecked}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-foreground/50">
          延迟、成功率和状态均来自实际数据字段；未用构建时间替代实测时间。
        </p>
      </div>
    </section>
  );
}
