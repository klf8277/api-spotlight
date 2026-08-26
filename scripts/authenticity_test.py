#!/usr/bin/env python3
"""
Api探照灯 · Phase 3：模型真实性抽查脚本（独立方法学实现）

方法学（公开技术路线，独立实现，不复用任何第三方仓库代码）：
  1. Temperature 采样：固定探针提示词，多温度（默认 0.3 / 0.7 / 1.3）下重复采样；
  2. 特征提取：
     - 自 ID：让模型自报内部标识（模型名/参数代号），与期望值比对；
     - 输出特征：token 长度中位数、温度间漂移（stdev/median）、重复率（unigram 占比）；
  3. 指纹比对：与 scripts/fingerprints.json 参考值比对（参考值需实测校准，未校准 → unknown）；
  4. verdict：authentic / suspect / unknown / skipped / no-response。

用法：
  python scripts/authenticity_test.py               # 干跑（默认，不写回）
  python scripts/authenticity_test.py --apply       # 写回 src/data/authenticity.json（原子替换 + .bak 备份）
  python scripts/authenticity_test.py --provider provider-openai,provider-deepseek --samples-per-temp 2

指纹校准（一次性，必须用官方直连正版渠道的 Key）：
  set SPOTLIGHT_TEST_KEY=sk-official-xxx
  python scripts/authenticity_test.py --provider provider-openai --samples-per-temp 4 --calibrate
  # --calibrate 会以本次采样为基线自动回写 scripts/fingerprints.json（置 calibrated=true）；
  # 建议 ≥8 次成功采样（2 温度 × 4 次）；样本不足拒绝回写。

安全：Key 仅从环境变量读取（复用 platforms.json 的 api_key_env 安全链）；
      响应内容只保留截断摘要，不打印完整文本。
成本：每次调用消耗调用方 Key 的 token，默认 2 温度 × 2 采样 × max_tokens 600，可调低。
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import shutil
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
PROFILES_FILE = DATA_DIR / "authenticity.json"
PLATFORMS_FILE = DATA_DIR / "platforms.json"
FINGERPRINTS_FILE = Path(__file__).resolve().parent / "fingerprints.json"

PROBE_PROMPT = (
    "请只回答一行：你的模型内部标识（内部名称、版本代号或参数代号）是什么？"
    "如果官方没有赋予内部代号，请回复 UNKNOWN。不要写其他内容。"
)


def _load_json(path: Path, required: bool = True):
    if not path.exists():
        if required:
            print(f"！找不到文件：{path}", file=sys.stderr)
            sys.exit(1)
        return {}
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _post_json(base: str, endpoint: str, payload: dict, headers: dict, timeout: float):
    """POST chat/completions；返回 (解析后的 JSON or None, http code or None)。"""
    url = base.rstrip("/") + endpoint
    req = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except HTTPError as exc:
        return None, exc.code
    except (URLError, OSError, TimeoutError):
        return None, None


def _first_line(text: str) -> str:
    return (text or "").strip().split("\n", 1)[0].strip()


def _repeat_ratio(text: str) -> float | None:
    words = [w for w in re.findall(r"[A-Za-z0-9_-]+", text or "")]
    if len(words) < 5:
        return None
    return round(len(set(words)) / len(words), 3)


def _extract_self_id(text: str, patterns: list[str]) -> str | None:
    low = (text or "").lower()
    for p in patterns:
        if p.lower() in low:
            return p
    return None


async def probe_platform(
    site: dict,
    profile: dict,
    ref: dict,
    sem: asyncio.Semaphore,
    samples_per_temp: int,
    max_tokens: int,
    timeout: float,
) -> dict:
    """对单个平台的一个模型做多温度采样，返回特征与判定报告。"""
    base = (site.get("api_base") or site.get("url") or "").rstrip("/")
    endpoint = profile.get("chat_endpoint") or "/v1/chat/completions"
    model = profile.get("model") or ""
    temps = profile.get("temps") or [0.3, 0.7, 1.3]

    # Key 安全链：环境变量名由 platforms.json 的 api_key_env 指定，只读环境，不落盘
    api_key = os.environ.get(site.get("api_key_env") or "SPOTLIGHT_TEST_KEY", "")
    if not api_key:
        return {
            "platform_id": site["id"],
            "model": model,
            "verdict": "skipped",
            "note": "未配置测试 Key（api_key_env 指向的环境变量为空），仅连通性由 ping_test 覆盖",
            "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "ApiSpotlight/1.0",
        "Authorization": f"Bearer {api_key}",
    }

    async def one_attempt(temp: float) -> dict:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": PROBE_PROMPT}],
            "temperature": temp,
            "max_tokens": max_tokens,
            "stream": False,
        }
        async with sem:
            start = time.perf_counter()
            body, code = await asyncio.to_thread(_post_json, base, endpoint, payload, headers, timeout)
            elapsed_ms = round((time.perf_counter() - start) * 1000)
        if body is None:
            return {"ok": False, "code": code, "latency_ms": elapsed_ms}
        try:
            content = body["choices"][0]["message"]["content"]
            tokens = body.get("usage", {}).get("total_tokens", 0)
        except (KeyError, IndexError, TypeError):
            return {"ok": False, "code": code, "latency_ms": elapsed_ms, "note": "响应结构异常"}
        return {"ok": True, "code": code, "latency_ms": elapsed_ms, "content": content, "tokens": tokens}

    results = []
    for temp in temps:
        for _ in range(samples_per_temp):
            r = await one_attempt(temp)
            r["temp"] = temp
            results.append(r)

    ok = [r for r in results if r.get("ok")]
    if not ok:
        codes = sorted({r.get("code") for r in results if r.get("code") is not None})
        return {
            "platform_id": site["id"],
            "model": model,
            "endpoint": endpoint,
            "verdict": "no-response",
            "note": f"全部采样失败，HTTP 记录 {codes or '网络不可达'}",
            "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

    texts = [r["content"] for r in ok]
    tokens_list = [r["tokens"] for r in ok]
    token_median = round(statistics.median(tokens_list)) if tokens_list else None
    token_stdev_pct = (
        round(statistics.pstdev(tokens_list) / token_median * 100, 1) if token_median else None
    )
    repeats = [x for x in (_repeat_ratio(t) for t in texts) if x is not None]
    repeat = round(statistics.median(repeats), 3) if repeats else None

    patterns = (ref or {}).get("self_id_patterns") or [model]
    self_id = next((sid for sid in (_extract_self_id(t, patterns) for t in texts) if sid), None)

    # —— 指纹比对判定（参考值未校准 → unknown，绝不臆断）——
    verdict, notes = "unknown", []
    if self_id:
        notes.append(f"自 ID 命中：{self_id}（{patterns} 中命中）")
    if not ref or not ref.get("calibrated"):
        notes.append("参考值未校准（fingerprints.json 未填基线），暂不判定真伪")
    else:
        id_ok = (self_id is not None) or ref.get("expected_self_id") is None
        med = ref.get("median_tokens")
        tol_pct = ref.get("token_tolerance_pct") or 20
        med_ok = med is None or (token_median is not None and abs(token_median - med) / med <= tol_pct / 100)
        rep_ok = ref.get("max_repeat") is None or (repeat is not None and repeat <= ref["max_repeat"])
        if id_ok and med_ok and rep_ok:
            verdict = "authentic"
        else:
            verdict = "suspect"
            notes.append(f"比对失败：id_ok={id_ok} med_ok={med_ok} rep_ok={rep_ok}")

    return {
        "platform_id": site["id"],
        "model": model,
        "endpoint": endpoint,
        "verdict": verdict,
        "samples": len(ok),
        "temps": temps,
        "latency_ms": round(statistics.median([r["latency_ms"] for r in ok])),
        "token_median": token_median,
        "token_stdev_pct": token_stdev_pct,
        "repeat_ratio": repeat,
        "self_id_seen": self_id,
        "summary": _first_line(texts[0])[:120],
        "note": "；".join(notes) or None,
        "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


async def run_all(reports: list[dict]) -> None:
    sem = asyncio.Semaphore(4)
    for r in reports:
        await asyncio.sleep(0)  # 保持事件循环响应
        # reports 由 main 拼装（避免复杂嵌套），此处占位——实际调度见 main


def calibrate_fingerprints(results: list[dict], fingerprints: dict, min_samples: int = 8):
    """用本次采样生成基线并回写 fingerprints.json（原子替换 + .bak 备份，样本不足拒绝）。"""
    updated, skipped = 0, []
    for r in results:
        model = r.get("model", "")
        samples = r.get("samples") or 0
        median = r.get("token_median")
        if r.get("verdict") in ("skipped", "no-response") or samples < min_samples or median is None:
            skipped.append(f"{model}: 成功采样 {samples} 次 / 判定 {r.get('verdict')}")
            continue
        ref = fingerprints.get(model) or {}
        ref["calibrated"] = True
        ref["median_tokens"] = median
        stdev = r.get("token_stdev_pct") or 10.0
        ref["token_tolerance_pct"] = max(20, round(stdev * 2 + 10))
        if r.get("repeat_ratio") is not None:
            ref["max_repeat"] = round(min(1.0, r["repeat_ratio"] + 0.15), 3)
        if not ref.get("self_id_patterns"):
            ref["self_id_patterns"] = [model]
        if ref.get("expected_self_id") is None:
            ref["expected_self_id"] = r.get("self_id_seen")
        ref["note"] = f"基线由 authenticity_test.py --calibrate 于 {r['checked_at']} 采样回写"
        fingerprints[model] = ref
        updated += 1
    if updated:
        shutil.copy2(FINGERPRINTS_FILE, FINGERPRINTS_FILE.with_suffix(".json.bak"))
        tmp = FINGERPRINTS_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(fingerprints, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, FINGERPRINTS_FILE)
    return updated, "；".join(skipped) or "无"


async def main() -> int:
    parser = argparse.ArgumentParser(description="Api探照灯 模型真实性抽查（Phase 3，默认干跑）")
    parser.add_argument("--apply", action="store_true", help="写回 src/data/authenticity.json（默认仅打印）")
    parser.add_argument("--provider", default="", help="仅抽查指定平台 id（逗号分隔，默认全量）")
    parser.add_argument("--samples-per-temp", type=int, default=2, help="每个温度的采样次数（默认 2）")
    parser.add_argument("--max-tokens", type=int, default=600, help="单次响应最大 token（默认 600）")
    parser.add_argument("--timeout", type=float, default=60.0, help="单次请求超时秒数（默认 60）")
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument(
        "--calibrate",
        action="store_true",
        help="用本次采样校准并回写 scripts/fingerprints.json（建议≥8 次成功采样，必须用官方直连 Key）",
    )
    args = parser.parse_args()

    profiles_doc = _load_json(PROFILES_FILE)
    platforms = _load_json(PLATFORMS_FILE)
    fingerprints = _load_json(FINGERPRINTS_FILE)
    platforms_by_id = {p["id"]: p for p in platforms}

    wanted = {x.strip() for x in args.provider.split(",") if x.strip()}
    targets = [pf for pf in profiles_doc.get("profiles", []) if not wanted or pf.get("platform_id") in wanted]
    if not targets:
        print("没有匹配的抽查档案（src/data/authenticity.json）。", file=sys.stderr)
        return 1

    print(f"开始抽查：{len(targets)} 个档案 × 温度采样，并发 {args.concurrency}，超时 {args.timeout}s\n")
    sem = asyncio.Semaphore(args.concurrency)
    jobs = [
        probe_platform(
            platforms_by_id.get(pf.get("platform_id"), {}),
            pf,
            fingerprints.get(pf.get("model"), {}),
            sem,
            args.samples_per_temp,
            args.max_tokens,
            args.timeout,
        )
        for pf in targets
    ]
    results = await asyncio.gather(*jobs)

    print(f"{'平台':<24} {'模型':<26} {'判定':<12} 采样 中位token 特征")
    print("-" * 96)
    for r in results:
        verdict = r.get("verdict", "?")
        print(
            f"{r.get('platform_id','')[:22]:<24} {r.get('model','')[:24]:<26} {verdict:<12} "
            f"{r.get('samples','-'):<4} {str(r.get('token_median','-')):<9} "
            f"自ID={r.get('self_id_seen','-')} 重复={r.get('repeat_ratio','-')} 漂移={r.get('token_stdev_pct','-')}%"
        )
        if r.get("note"):
            print(f"    ↳ {r['note'][:110]}")
        print(f"    ↳ 摘要：{r.get('summary','')[:80]}")

    if args.calibrate:
        updated, skipped_msg = calibrate_fingerprints(results, fingerprints, min_samples=8)
        if updated:
            print(
                f"\n✅ 指纹基线已回写 scripts/fingerprints.json：更新 {updated} 个模型（calibrated=true）\n"
                "   下一步：用同样模型再跑普通抽查（不带 --calibrate）即可得到 authentic/suspect 判定。"
            )
        else:
            print(f"\n⚠️ 未回写指纹基线：{skipped_msg}")
            print("   请检查：是否配置了官方直连正版渠道的 Key？成功采样是否 ≥8 次？")

    if args.apply:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        profiles_doc["reports"] = results
        profiles_doc["last_checked"] = now
        shutil.copy2(PROFILES_FILE, PROFILES_FILE.with_suffix(".json.bak"))
        tmp = PROFILES_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(profiles_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, PROFILES_FILE)
        print(f"\n已写回 {PROFILES_FILE}（原文件备份为 .json.bak）")
    else:
        print("\n（干跑模式：未写回。使用 --apply 写回 authenticity.json）")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
