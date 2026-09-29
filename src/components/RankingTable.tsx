"use client";

import { Fragment, useMemo, useState } from "react";
import type { AuthenticityReport, Platform } from "@/types";
import { getDictionary, template, type Locale } from "@/lib/i18n";

type SortKey = "name" | "latency_ms" | "success_rate";

const STATUS_DOT: Record<Platform["status"], string> = {
  online: "bg-emerald-500",
  degraded: "bg-amber-500",
  offline: "bg-red-500",
};

const CN_ACCESS_DOT: Record<string, string> = {
  direct: "bg-emerald-500",
  unstable: "bg-amber-500",
  blocked: "bg-red-500",
};

const CN_ACCESS_CLS: Record<string, string> = {
  direct: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  unstable: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  blocked: "bg-red-500/15 text-red-500",
};

const VERDICT_CLS: Record<string, string> = {
  authentic: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  suspect: "bg-red-500/15 text-red-500",
  unknown: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  skipped: "bg-foreground/5 text-foreground/50",
  "no-response": "bg-red-500/15 text-red-500",
};

function latencyTone(v: number): string {
  if (v < 200) return "text-emerald-600 dark:text-emerald-400";
  if (v < 400) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

function Sparkline({ points, ariaLabel, title }: { points: number[]; ariaLabel: string; title: string }) {
  if (points.length < 2) return null;
  const w = 96,
    h = 24,
    pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const d = points
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(pad + i * step).toFixed(1)},${(
          h - pad - ((v - min) / range) * (h - pad * 2)
        ).toFixed(1)}`,
    )
    .join(" ");
  const improving = points[points.length - 1] < points[0];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`mt-1 h-5 w-24 ${
        improving ? "text-emerald-500/80" : "text-amber-500/80"
      }`}
      role="img"
      aria-label={ariaLabel}
    >
      <title>{title}</title>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerdictBadge({ report, locale }: { report?: AuthenticityReport; locale: Locale }) {
  const dictionary = getDictionary(locale).ranking;
  const labels: Record<string, string> = {
    authentic: dictionary.verdictAuthentic,
    suspect: dictionary.verdictSuspect,
    unknown: dictionary.verdictUnknown,
    skipped: dictionary.verdictSkipped,
    "no-response": dictionary.verdictNoResponse,
  };
  if (!report) {
    return (
      <span className="text-foreground/40" title={dictionary.notConfiguredTitle}>
        {dictionary.notConfigured}
      </span>
    );
  }
  const label = labels[report.verdict] ?? report.verdict;
  const cls = VERDICT_CLS[report.verdict] ?? "bg-foreground/5 text-foreground/50";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
      title={`${report.verdict} · ${report.model ?? ""} · ${report.checked_at ?? ""}${
        report.note ? " · " + report.note : ""
      }`}
    >
      {label}
    </span>
  );
}

function AuthDetail({ report, locale }: { report?: AuthenticityReport; locale: Locale }) {
  const dictionary = getDictionary(locale).ranking;
  if (!report) {
    return <span className="text-foreground/50">{dictionary.noReport}</span>;
  }
  const items: Array<[string, string]> = [
    [dictionary.detailTemperature, (report.temps ?? []).map(String).join(" / ") || "—"],
    [dictionary.detailSamples, report.samples != null ? String(report.samples) : "—"],
    [dictionary.detailSelfId, report.self_id_seen ?? "—"],
    [dictionary.detailDrift, report.token_stdev_pct != null ? `${report.token_stdev_pct}%` : "—"],
    [dictionary.detailLatency, report.latency_ms != null ? `${report.latency_ms}ms` : "—"],
    [dictionary.detailTokenMedian, report.token_median != null ? String(report.token_median) : "—"],
    [dictionary.detailRepeatRatio, report.repeat_ratio != null ? String(report.repeat_ratio) : "—"],
    [dictionary.detailCheckedAt, report.checked_at ?? "—"],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 font-mono text-[11px] leading-5 text-foreground/70 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <span key={k}>
          <span className="text-foreground/40">{k}{locale === "zh" ? "：" : ": "}</span>
          {v}
        </span>
      ))}
      {report.summary && (
        <span className="col-span-2 sm:col-span-4">{dictionary.detailSummary}{report.summary}</span>
      )}
      {report.note && (
        <span className="col-span-2 text-amber-600 dark:text-amber-400 sm:col-span-4">
          {dictionary.detailNote}{report.note}
        </span>
      )}
    </div>
  );
}

export default function RankingTable({
  locale,
  platforms,
  authenticityMap,
  latencyHistory,
}: {
  locale: Locale;
  platforms: Platform[];
  authenticityMap: Record<string, AuthenticityReport>;
  latencyHistory?: Record<string, Array<{ date: string; latency: number }>>;
}) {
  const dictionary = getDictionary(locale);
  const ranking = dictionary.ranking;
  const [sortKey, setSortKey] = useState<SortKey>("latency_ms");
  const [asc, setAsc] = useState(true);
  // 抽查详情展开行：点击徽标切换
  const [openId, setOpenId] = useState<string | null>(null);

  const cnAccessLabels: Record<string, string> = {
    direct: ranking.cnAccessDirect,
    unstable: ranking.cnAccessUnstable,
    blocked: ranking.cnAccessBlocked,
  };
  const statusLabels: Record<Platform["status"], string> = {
    online: dictionary.common.online,
    degraded: dictionary.common.degraded,
    offline: dictionary.common.offline,
  };
  const listSeparator = locale === "zh" ? "、" : ", ";

  const sorted = useMemo(() => {
    const arr = [...platforms];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      // 无数据（null）恒排底部，避免排序方向切换时跳动
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp =
        typeof va === "number"
          ? va - (vb as number)
          : String(va).localeCompare(String(vb), locale);
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [platforms, sortKey, asc, locale]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setAsc(!asc);
    } else {
      setSortKey(key);
      // 成功率默认降序（越高越好），其余默认升序
      setAsc(key !== "success_rate");
    }
  };

  const arrow = (key: SortKey) => (sortKey === key ? (asc ? " ↑" : " ↓") : "");

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-background shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3 font-medium">{ranking.colRank}</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("name")}
                  className="hover:text-foreground"
                >
                  {ranking.colSite}{arrow("name")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">{ranking.colStatus}</th>
              <th className="px-4 py-3 font-medium">{ranking.colAuthenticity}</th>
              <th className="px-4 py-3 font-medium">{ranking.colCnAccess}</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("latency_ms")}
                  className="hover:text-foreground"
                >
                  {ranking.colLatency}{arrow("latency_ms")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("success_rate")}
                  className="hover:text-foreground"
                >
                  {ranking.colSuccessRate}{arrow("success_rate")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">{ranking.colModels}</th>
              <th className="px-4 py-3 font-medium">{ranking.colEntry}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <Fragment key={p.id}>
              <tr
                className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.03]"
              >
                <td className="px-4 py-3 font-mono text-foreground/40">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{p.name}</span>
                    <span
                      className={
                        p.type === "relay"
                          ? "rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                          : "rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                      }
                      title={p.type === "relay" ? ranking.typeRelayTitle : ranking.typeOfficialTitle}
                    >
                      {p.type === "relay" ? ranking.typeRelay : ranking.typeOfficial}
                    </span>
                    {p.is_featured && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {ranking.featured}
                      </span>
                    )}
                  </div>
                  {(p.tags ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(p.tags ?? []).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-foreground/5 px-1.5 py-0.5 text-[11px] text-foreground/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5 text-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status]}`}
                    />
                    {statusLabels[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    className="text-left"
                    title={ranking.expandTitle}
                    aria-label={ranking.expandAria}
                    aria-expanded={openId === p.id}
                  >
                    <VerdictBadge report={authenticityMap[p.id]} locale={locale} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const key = p.cn_access ?? "direct";
                    const pays = p.payment_methods ?? [];
                    return (
                      <>
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${CN_ACCESS_CLS[key] ?? ""}`}
                          title={template(ranking.paymentTitle, { list: pays.join(listSeparator) || ranking.paymentFallback })}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${CN_ACCESS_DOT[key] ?? ""}`} />
                          {cnAccessLabels[key] ?? key}
                        </span>
                        <div className="mt-0.5 text-[10px] text-foreground/40">
                          {pays.length > 0
                            ? pays.slice(0, 2).join(" · ") +
                              (pays.length > 2 ? ` +${pays.length - 2}` : "")
                            : ranking.paymentInlineFallback}
                        </div>
                      </>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 font-mono text-base font-semibold">
                  {p.latency_ms === null ? (
                    <span className="text-foreground/40">—</span>
                  ) : (
                    <span className={latencyTone(p.latency_ms)}>{p.latency_ms}</span>
                  )}
                  <Sparkline
                    points={(latencyHistory?.[p.id] ?? []).map((e) => e.latency)}
                    ariaLabel={ranking.latencySparkAria}
                    title={ranking.latencySparkTitle}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-base font-semibold">{p.success_rate.toFixed(1)}%</td>
                <td
                  className="px-4 py-3 text-foreground/70"
                  title={p.supported_models.join(listSeparator)}
                >
                  {p.supported_models.slice(0, 3).join(" · ")}
                  {p.supported_models.length > 3 && (
                    <span className="text-foreground/40">
                      {" "}
                      +{p.supported_models.length - 3}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {ranking.website}
                  </a>
                </td>
              </tr>
              {openId === p.id && (
                <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                  <td colSpan={9} className="px-4 py-3 text-xs">
                    <AuthDetail report={authenticityMap[p.id]} locale={locale} />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-foreground/50">{ranking.footnote}</p>
    </div>
  );
}
