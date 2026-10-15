"use client";

import probeLiveData from "@/data/probe_live.json";
import type { Locale } from "@/lib/i18n";

export interface ProbeResult {
  track?: number;
  id: string;
  name?: string;
  endpoint?: string;
  status_class: string;
  http_status?: number | null;
  latency_ms?: number | null;
  checked_at?: string;
  note?: string;
}

const probeMap: Record<string, ProbeResult> = {};
if (Array.isArray(probeLiveData?.results)) {
  for (const item of probeLiveData.results) {
    if (item?.id) {
      probeMap[item.id] = item as ProbeResult;
    }
  }
}

interface ProbeBadgeProps {
  platformId: string;
  locale: Locale;
  className?: string;
}

export function ProbeBadge({ platformId, locale, className = "" }: ProbeBadgeProps) {
  const probe = probeMap[platformId];
  if (!probe) return null;

  const isZh = locale === "zh";

  let badgeCls = "bg-foreground/5 text-foreground/60 border-foreground/10";
  let desktopText = "";
  let mobileText = "";

  if (probe.http_status === 401 || probe.status_class === "alive_auth_walled") {
    badgeCls = "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
    desktopText = isZh ? "端点存活 · 探测未携Key (HTTP 401)" : "Alive · Unauthenticated (HTTP 401)";
    mobileText = isZh ? "存活·无Key" : "Alive·NoKey";
  } else if (probe.status_class === "blocked") {
    badgeCls = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    desktopText = isZh ? "大陆直连阻断 · 需境外节点 (TUN)" : "Direct Access Blocked · Requires Proxy";
    mobileText = isZh ? "直连阻断" : "Blocked";
  } else if (probe.http_status === 200 || probe.status_class === "alive_public") {
    badgeCls = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    desktopText = isZh ? "端点存活 (HTTP 200)" : "Endpoint Alive (HTTP 200)";
    mobileText = isZh ? "存活(200)" : "Alive(200)";
  } else if (probe.status_class === "unhealthy") {
    badgeCls = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    desktopText = isZh ? "端点异常 · 握手失败" : "Endpoint Unhealthy";
    mobileText = isZh ? "端点异常" : "Unhealthy";
  } else {
    badgeCls = "bg-foreground/5 text-foreground/50 border-foreground/10";
    desktopText = isZh ? (probe.note || "未测直连") : (probe.status_class === "skipped" ? "Skipped" : "Not probed");
    mobileText = isZh ? "未测直连" : "Not probed";
  }

  const rawTime = probe.checked_at || (probeLiveData as { generated_at?: string })?.generated_at;
  let isExpired = false;
  if (rawTime) {
    try {
      const diffHours = (Date.now() - new Date(rawTime).getTime()) / (1000 * 3600);
      if (diffHours > 48) isExpired = true;
    } catch {
      // ignore
    }
  }

  if (isExpired) {
    desktopText += isZh ? " (数据已过期)" : " (Expired)";
    mobileText += isZh ? "(过期)" : "(Exp)";
  }

  const tooltip = isZh
    ? [
        `[真机探针物理取证]`,
        probe.endpoint ? `端点: ${probe.endpoint}` : "",
        probe.http_status ? `HTTP: ${probe.http_status}` : "",
        probe.note ? `说明: ${probe.note}` : "",
        probe.checked_at ? `采样时刻: ${probe.checked_at}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `[Live Probe Evidence]`,
        probe.endpoint ? `Endpoint: ${probe.endpoint}` : "",
        probe.http_status ? `HTTP: ${probe.http_status}` : "",
        probe.status_class ? `Class: ${probe.status_class}` : "",
        probe.checked_at ? `Probed At: ${probe.checked_at}` : "",
      ]
        .filter(Boolean)
        .join("\n");

  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-help ${badgeCls} ${className}`}
      title={tooltip}
    >
      <span className="hidden md:inline">{desktopText}</span>
      <span className="inline md:hidden">{mobileText}</span>
    </span>
  );
}

export default ProbeBadge;
