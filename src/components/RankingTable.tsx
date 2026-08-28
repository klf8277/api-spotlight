"use client";

import { Fragment, useMemo, useState } from "react";
import type { AuthenticityReport, Platform } from "@/types";

type SortKey = "name" | "latency_ms" | "success_rate";

const STATUS_LABEL: Record<Platform["status"], string> = {
  online: "在线",
  degraded: "波动",
  offline: "离线",
};

const STATUS_DOT: Record<Platform["status"], string> = {
  online: "bg-emerald-500",
  degraded: "bg-amber-500",
  offline: "bg-red-500",
};

// 🇨🇳 境内视角：本站本机实测观察（非官方保证）
const CN_ACCESS: Record<string, { label: string; dot: string; cls: string }> = {
  direct: {
    label: "境内直连",
    dot: "bg-emerald-500",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  unstable: {
    label: "境内受限",
    dot: "bg-amber-500",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  blocked: {
    label: "境内不可",
    dot: "bg-red-500",
    cls: "bg-red-500/15 text-red-500",
  },
};

function latencyTone(v: number): string {
  if (v < 200) return "text-emerald-600 dark:text-emerald-400";
  if (v < 400) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

function Sparkline({ points }: { points: number[] }) {
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
      aria-label="延迟历史（近 30 天）"
    >
      <title>延迟历史（近 30 天，由每日实测记录）</title>
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

function VerdictBadge({ report }: { report?: AuthenticityReport }) {
  const CONF: Record<string, { label: string; cls: string }> = {
    authentic: {
      label: "✅ 正宗",
      cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    suspect: { label: "⚠️ 掺假嫌疑", cls: "bg-red-500/15 text-red-500" },
    unknown: {
      label: "⏳ 未校准",
      cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    skipped: { label: "🚫 无 Key 跳过", cls: "bg-foreground/5 text-foreground/50" },
    "no-response": { label: "❌ 无响应", cls: "bg-red-500/15 text-red-500" },
  };
  if (!report) {
    return (
      <span
        className="text-foreground/40"
        title="未配置抽查档案（src/data/authenticity.json）"
      >
        —
      </span>
    );
  }
  const c = CONF[report.verdict] ?? {
    label: report.verdict,
    cls: "bg-foreground/5 text-foreground/50",
  };
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${c.cls}`}
      title={`${report.verdict} · ${report.model ?? ""} · ${report.checked_at ?? ""}${
        report.note ? " · " + report.note : ""
      }`}
    >
      {c.label}
    </span>
  );
}

function AuthDetail({ report }: { report?: AuthenticityReport }) {
  if (!report) {
    return (
      <span className="text-foreground/50">
        暂无该平台的抽查报告（未配置抽查档案 src/data/authenticity.json）。
      </span>
    );
  }
  const items: Array<[string, string]> = [
    ["温度档", (report.temps ?? []).map(String).join(" / ") || "—"],
    ["采样数", report.samples != null ? String(report.samples) : "—"],
    ["自 ID", report.self_id_seen ?? "—"],
    ["漂移度", report.token_stdev_pct != null ? `${report.token_stdev_pct}%` : "—"],
    ["响应中位", report.latency_ms != null ? `${report.latency_ms}ms` : "—"],
    ["中位 tokens", report.token_median != null ? String(report.token_median) : "—"],
    ["重复率", report.repeat_ratio != null ? String(report.repeat_ratio) : "—"],
    ["抽查时间", report.checked_at ?? "—"],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 font-mono text-[11px] leading-5 text-foreground/70 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <span key={k}>
          <span className="text-foreground/40">{k}：</span>
          {v}
        </span>
      ))}
      {report.summary && (
        <span className="col-span-2 sm:col-span-4">摘要：{report.summary}</span>
      )}
      {report.note && (
        <span className="col-span-2 text-amber-600 dark:text-amber-400 sm:col-span-4">
          备注：{report.note}
        </span>
      )}
    </div>
  );
}

export default function RankingTable({
  platforms,
  authenticityMap,
  latencyHistory,
}: {
  platforms: Platform[];
  authenticityMap: Record<string, AuthenticityReport>;
  latencyHistory?: Record<string, Array<{ date: string; latency: number }>>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("latency_ms");
  const [asc, setAsc] = useState(true);
  // 抽查详情展开行：点击徽标切换
  const [openId, setOpenId] = useState<string | null>(null);

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
          : String(va).localeCompare(String(vb), "zh");
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [platforms, sortKey, asc]);

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
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("name")}
                  className="hover:text-foreground"
                >
                  站点{arrow("name")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">真实性抽查</th>
              <th className="px-4 py-3 font-medium">🇨🇳 境内可用</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("latency_ms")}
                  className="hover:text-foreground"
                >
                  延迟 (ms){arrow("latency_ms")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => onSort("success_rate")}
                  className="hover:text-foreground"
                >
                  成功率{arrow("success_rate")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">模型</th>
              <th className="px-4 py-3 font-medium">入口</th>
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
                      title={p.type === "relay" ? "第三方中转节点" : "官方原厂直连节点"}
                    >
                      {p.type === "relay" ? "🔁 第三方中转" : "🏢 官方原厂"}
                    </span>
                    {p.is_featured && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ⭐ 推荐
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
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    className="text-left"
                    title="点击展开抽查详情"
                  >
                    <VerdictBadge report={authenticityMap[p.id]} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const cn = CN_ACCESS[p.cn_access ?? "direct"];
                    const pays = p.payment_methods ?? [];
                    return (
                      <>
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${cn.cls}`}
                          title={`支付方式：${pays.join("、") || "以官网为准"}（公开信息整理）`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cn.dot}`} />
                          {cn.label}
                        </span>
                        <div className="mt-0.5 text-[10px] text-foreground/40">
                          {pays.length > 0
                            ? pays.slice(0, 2).join(" · ") +
                              (pays.length > 2 ? ` +${pays.length - 2}` : "")
                            : "支付方式以官网为准"}
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
                  />
                </td>
                <td className="px-4 py-3 font-mono text-base font-semibold">{p.success_rate.toFixed(1)}%</td>
                <td
                  className="px-4 py-3 text-foreground/70"
                  title={p.supported_models.join("、")}
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
                    官网 ↗
                  </a>
                </td>
              </tr>
              {openId === p.id && (
                <tr className="border-b border-foreground/5 bg-foreground/[0.02]">
                  <td colSpan={9} className="px-4 py-3 text-xs">
                    <AuthDetail report={authenticityMap[p.id]} />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-foreground/50">
        指标说明：延迟为最近实测中位数（每站 3 次采样），成功率 = 成功请求 / 总请求；
        数据由 scripts/ping_test.py 定期更新，点击表头可排序。
        真实性列为 Phase 3 抽查结果（scripts/authenticity_test.py），
        未配置测试 Key 或指纹参考值未校准时显示 — / ⏳。
        点击徽标可展开抽查详情（温度档 / 自 ID / 漂移度 / 响应 / 时间戳）。
        🇨🇳 境内可用性为本站本机实测观察（非官方保证，跨境网络存在时点差异）；支付方式为公开信息整理，以官网为准。
        模型清单依据 2026-08 官方文档/公开模型列表整理，以官网为准。
      </p>
    </div>
  );
}
