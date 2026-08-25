"use client";

import { useMemo, useState } from "react";
import type { Platform } from "@/types";

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

function latencyTone(v: number): string {
  if (v < 200) return "text-emerald-600 dark:text-emerald-400";
  if (v < 400) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

export default function RankingTable({ platforms }: { platforms: Platform[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("latency_ms");
  const [asc, setAsc] = useState(true);

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
      <div className="overflow-x-auto rounded-xl border border-foreground/10">
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
              <tr
                key={p.id}
                className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.03]"
              >
                <td className="px-4 py-3 font-mono text-foreground/40">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{p.name}</span>
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
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status]}`}
                    />
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">
                  {p.latency_ms === null ? (
                    <span className="text-foreground/40">—</span>
                  ) : (
                    <span className={latencyTone(p.latency_ms)}>{p.latency_ms}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono">{p.success_rate.toFixed(1)}%</td>
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
                    官网
                  </a>
                  {p.affiliate_url && (
                    <a
                      href={p.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="ml-2 text-foreground/60 hover:underline"
                    >
                      推广
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-foreground/50">
        指标说明：延迟为最近实测中位数（每站 3 次采样），成功率 = 成功请求 / 总请求；
        数据由 scripts/ping_test.py 定期更新，点击表头可排序。
      </p>
    </div>
  );
}
