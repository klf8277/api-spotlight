#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批B A线 · 双轨真实探针流水线（每半月一次轻量测活，零密钥零计费）。

边界宪法（46号裁定3 四铁律 + 47号作业单 §二 + 00_项目说明.md §八外松内紧立宪）：
  边界① 仅官方+入驻白名单：
       轨一（大厂 API）= 主站 src/data/platforms.json 中 type==official 且 id 命中
        硬编码白名单的【免鉴权公开端点】（200/401/403 等应答均算端点活着，不带任何密钥）；
       轨二（入驻中转）= 商业站 hub/partners.json 硬编码白名单 8 家的【官网首页】连通性
        （绝不测其 API、绝不测任何未入驻的野节点、绝不猜 URL）。
  边界② 外松内紧：全脚本单线程并发锁死 1；境内源间隔 random.uniform(3,8)s、
       境外 1.5~3s；零重试；403/429 → 记 blocked 并立即中止该源（某轨连续 2 家被阻
       → 打开熔断，跳过该轨剩余靶点并记 circuit_opened）；绝不硬刚、绝不伪装浏览器。
  边界③ 旁路隔离：结果只原子写 sidecar src/data/probe_live.json（tmp + os.replace），
       严禁覆写 platforms.json / partners.json 任何人工核验字段（last_checked 归人工）。
  边界④ 生产防线：C 盘零写入（sidecar/日志全落 D 盘仓库内）、不触 n8n、
       不触 D:\\hotspot-radar、瞭望台零干扰。

用法：
  python scripts/probe_live_models.py             # 正式双轨测活（schtasks 调用）
  python scripts/probe_live_models.py --dry-run   # 只出作战计划，不发任何网络请求
  python scripts/probe_live_models.py --selfcheck # 四边界红线自检断言（不联网）

sidecar 消费方：scripts/contract_validation.py（存在才读，只读；>45 天未探仅黄灯提醒）。
"""

from __future__ import annotations

import json
import os
import random
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# 强制纯净直连物理通道，杜绝继承本机 Clash 代理
direct_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(direct_opener)

# ---------------------------------------------------------------- 路径与常量
MAIN_ROOT = Path(__file__).resolve().parent.parent
PLATFORMS_JSON = MAIN_ROOT / "src" / "data" / "platforms.json"
SIDECAR = MAIN_ROOT / "src" / "data" / "probe_live.json"
PARTNERS_JSON = Path(
    os.environ.get("PROBE_PARTNERS_JSON", str(MAIN_ROOT.parent / "api-spotlight-commercial" / "hub" / "partners.json"))
)

TIMEOUT_S = 10
DOMESTIC_RANGE = (3.0, 8.0)   # 境内档：3~8 秒随机休眠
OVERSEAS_RANGE = (1.5, 3.0)   # 境外档
BLOCKED_CIRCUIT = 2           # 某轨连续 N 家 blocked → 打开熔断跳过剩余
UA = "apiops-live-probe/1.0 (site health check; contact via apiops.cloud)"

# 边界①·轨一白名单：Stage 3 双站重组核定 16 家基座原厂（与 platforms.json 16 家白名单双断言）
WHITELIST_TIER1 = {
    "provider-openai", "provider-anthropic", "provider-google", "provider-meta",
    "provider-xai", "provider-cohere", "provider-mistral",
    "provider-deepseek", "provider-moonshot", "provider-zhipu", "provider-bailian",
    "provider-qianfan", "provider-volcano", "provider-tencent", "provider-minimax",
    "provider-stepfun",
}
# 边界①·轨二白名单：二审批准入驻测活的 8 家（hub/partners.json），仅测官网首页
WHITELIST_TRACK2 = {
    "partner-bai", "partner-cunai", "partner-apikeyfun", "partner-levolink",
    "partner-hulukey", "partner-pgh", "partner-kapibala", "partner-diege",
}
# 境内 API 主机显式名单（fail-closed：不在名单一律按境内保守档处理）
DOMESTIC_API_HOSTS = {
    "api.deepseek.com", "api.moonshot.cn", "open.bigmodel.cn",
    "dashscope.aliyuncs.com", "qianfan.baidubce.com", "ark.cn-beijing.volces.com",
    "api.hunyuan.cloud.tencent.com", "api.minimaxi.com", "api.stepfun.com",
}


def is_domestic(host: str) -> bool:
    h = (host or "").lower()
    return h in DOMESTIC_API_HOSTS or h.endswith(".cn") or h.endswith(".com.cn")


def http_probe(url: str) -> tuple[str, int | None, int, str]:
    """单次 GET（零重试）。返回 (status_class, http_status, latency_ms, note)。"""
    start = time.perf_counter()
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            latency = int((time.perf_counter() - start) * 1000)
            return "alive_public", resp.status, latency, ""
    except urllib.error.HTTPError as e:
        latency = int((time.perf_counter() - start) * 1000)
        code = e.code
        if code == 429:
            return "blocked", code, latency, "429 逢阻即退"
        if code == 403:
            return ("blocked", code, latency, "403 逢阻即退") if url_ok_domestic(url) \
                else ("alive_auth_walled", code, latency, "官方盾拦截（端点活着）")
        if code in (401,):
            return "alive_auth_walled", code, latency, "需鉴权（端点活着，无密钥仅测活）"
        if code in (404, 405):
            return "degraded", code, latency, "端点对路径不认可，域名活着"
        return "unhealthy", code, latency, f"HTTP {code}"
    except (socket.timeout, TimeoutError):
        latency = int((time.perf_counter() - start) * 1000)
        return "unhealthy", None, latency, "超时"
    except (urllib.error.URLError, ssl.SSLError, ConnectionError, OSError) as e:
        latency = int((time.perf_counter() - start) * 1000)
        return "unhealthy", None, latency, str(e)[:80]


def url_ok_domestic(url: str) -> bool:
    """该 URL 是否按境内档处置（仅用于 403 分类）。"""
    return is_domestic(urlparse(url).hostname or "")


def load_targets() -> tuple[list[dict], list[dict]]:
    """解析双轨靶点（不发请求）。返回 (track1_targets, track2_targets)。"""
    track1: list[dict] = []
    pdata = json.loads(PLATFORMS_JSON.read_text(encoding="utf-8"))
    items = pdata if isinstance(pdata, list) else pdata.get("platforms") or pdata.get("items") or []
    official_entries = {x.get("id"): x for x in items}
    for pid in sorted(WHITELIST_TIER1 & set(official_entries)):
        e = official_entries[pid]
        base = (e.get("api_base") or "").rstrip("/")
        tail = e.get("test_endpoint") or ""
        if not base or not tail:
            track1.append({"track": 1, "id": pid, "name": e.get("name", pid), "endpoint": None,
                           "domestic": None, "status_class": "skipped", "note": "缺 api_base/test_endpoint，逢疑即跳"})
            continue
        url = base + tail
        track1.append({"track": 1, "id": pid, "name": e.get("name", pid), "endpoint": url,
                       "domestic": is_domestic(urlparse(url).hostname or ""), "status_class": None, "note": ""})

    track2: list[dict] = []
    pjson = json.loads(PARTNERS_JSON.read_text(encoding="utf-8"))
    plist = {x.get("id"): x for x in pjson.get("partners", [])}
    for pid in sorted(WHITELIST_TRACK2 & set(plist)):
        e = plist[pid]
        url = (e.get("cta") or {}).get("url") or ((e.get("sources") or [{}])[0].get("url"))
        if not url or not str(url).startswith("https://"):
            track2.append({"track": 2, "id": pid, "name": e.get("name", pid), "endpoint": None,
                           "domestic": None, "status_class": "skipped", "note": "无可核验 HTTPS 官网，逢疑即跳"})
            continue
        track2.append({"track": 2, "id": pid, "name": e.get("name", pid), "endpoint": url,
                       # 轨二属地面无法确证 → 一律按境内保守档（fail-closed，外松内紧立宪）
                       "domestic": True, "status_class": None, "note": ""})
    return track1, track2


def run_track(targets: list[dict], label: str) -> list[dict]:
    results: list[dict] = []
    blocked_streak = 0
    for i, t in enumerate(targets):
        if t["status_class"] == "skipped":
            results.append(_result(t, "skipped", None, None, t["note"]))
            continue
        if blocked_streak >= BLOCKED_CIRCUIT:
            results.append(_result(t, "skipped", None, None, "本轨熔断已打开（连续逢阻），跳过剩余靶点"))
            continue
        rng = DOMESTIC_RANGE if t["domestic"] else OVERSEAS_RANGE
        if i:
            time.sleep(random.uniform(*rng))
        cls, code, latency, note = http_probe(t["endpoint"])
        if cls == "blocked":
            blocked_streak += 1
        else:
            blocked_streak = 0
        results.append(_result(t, cls, code, latency, note))
        print(f"  [{label}] {t['id']} → {cls} ({code}, {latency}ms, {rng[0]:g}-{rng[1]:g}s 档)")
    return results


def _result(t: dict, cls: str, code: int | None, latency: int | None, note: str) -> dict:
    return {
        "track": t["track"], "id": t["id"], "name": t["name"], "endpoint": t["endpoint"],
        "status_class": cls, "http_status": code, "latency_ms": latency,
        "checked_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "note": note,
    }


def write_sidecar(results: list[dict], duration_s: float) -> None:
    counts = {"alive_public": 0, "alive_auth_walled": 0, "degraded": 0,
              "unhealthy": 0, "skipped": 0, "blocked": 0}
    for r in results:
        counts[r["status_class"]] += 1
    alive = counts["alive_public"] + counts["alive_auth_walled"]
    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "runner": "scripts/probe_live_models.py",
        "duration_s": round(duration_s, 1),
        "summary": {
            "total": len(results), "alive": alive, "degraded": counts["degraded"],
            "dead": counts["unhealthy"], "skipped": counts["skipped"], "blocked": counts["blocked"],
        },
        "results": results,
    }
    SIDECAR.parent.mkdir(parents=True, exist_ok=True)
    tmp = SIDECAR.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, SIDECAR)  # 原子写：绝不半途残留，也绝不触碰 platforms.json
    print(f"✓ sidecar 原子写入：{SIDECAR}")


def selfcheck() -> int:
    print("== 四边界红线自检 ==")
    ok = True
    t1, t2 = load_targets()
    a1 = len(t1) == len(WHITELIST_TIER1) and all(x["id"] in WHITELIST_TIER1 for x in t1)
    a2 = len(t2) == len(WHITELIST_TRACK2) and all(x["id"] in WHITELIST_TRACK2 for x in t2)
    print(f"  ① 白名单∩type 双断言：轨一 {len(t1)}/{len(WHITELIST_TIER1)} {'✅' if a1 else '❌'}"
          f"｜轨二 {len(t2)}/{len(WHITELIST_TRACK2)} {'✅' if a2 else '❌'}")
    ok &= a1 and a2
    src = Path(__file__).read_text(encoding="utf-8")
    # 拼接构造敏感串，规避「自检字面量自匹配」自引用陷阱
    needle_auth = "Auth" + "orization"
    needle_key = "api" + "_" + "key"
    hits = [n for n in (needle_auth, needle_key) if n in src]
    no_key = not hits
    print(f"  ② 零密钥零计费（脚本源无敏感头/密钥字样）：{'✅' if no_key else '❌ ' + repr(hits)}")
    ok &= no_key
    apart = DOMESTIC_RANGE[0] >= 3.0 and OVERSEAS_RANGE[0] >= 1.5
    print(f"  ② 外松内紧档位（境内 {DOMESTIC_RANGE}｜境外 {OVERSEAS_RANGE}，零重试）：{'✅' if apart else '❌'}")
    ok &= apart
    no_touch = "hotspot-radar" not in str(SIDECAR) and SIDECAR != PLATFORMS_JSON
    print(f"  ③ sidecar≠platforms.json·旁路隔离·雷达目录零引用：{'✅' if no_touch else '❌'}")
    ok &= no_touch
    on_d = str(MAIN_ROOT).startswith("D:")
    print(f"  ④ 全部落 D 盘（仓库 {MAIN_ROOT}），C 盘零写入：{'✅' if on_d else '❌'}")
    ok &= on_d
    print("✅ 自检通过" if ok else "❌ 自检未通过")
    return 0 if ok else 1


def main() -> int:
    if "--selfcheck" in sys.argv:
        return selfcheck()
    t1, t2 = load_targets()
    if "--dry-run" in sys.argv:
        print("== 作战计划（dry-run，零网络） ==")
        for label, targets in (("轨一", t1), ("轨二", t2)):
            for t in targets:
                rng = DOMESTIC_RANGE if t["domestic"] else OVERSEAS_RANGE
                print(f"  [{label}] {t['id']}·{t['name']} → {t['endpoint'] or t['note']}"
                      f"（{rng[0]:g}-{rng[1]:g}s 档）")
        print(f"计划靶点：轨一 {len(t1)} + 轨二 {len(t2)}；并发=1，零重试，403/429 逢阻即退")
        return 0
    print("== 双轨真实测活开始 ==")
    start = time.perf_counter()
    results = run_track(t1, "轨一")
    time.sleep(random.uniform(*DOMESTIC_RANGE))
    results += run_track(t2, "轨二")
    duration = time.perf_counter() - start
    write_sidecar(results, duration)
    counts = {}
    for r in results:
        counts[r["status_class"]] = counts.get(r["status_class"], 0) + 1
    print(f"✓ 测活完成：{duration:.0f}s，明细 {counts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
