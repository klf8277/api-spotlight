#!/usr/bin/env python3
"""
Api探照灯 · 接口连通性实测脚本（Phase 1 脚手架）

零第三方依赖（asyncio + 标准库 urllib），适配 Python 3.8+。
读取 src/data/platforms.json，对每站的 test_endpoint 做 N 次采样，
输出延迟中位数 / 成功率 / HTTP 状态，可选择写回 JSON。

用法：
    python scripts/ping_test.py                # 仅实测并打印（默认，不写回）
    python scripts/ping_test.py --apply        # 实测并写回 src/data/platforms.json
    python scripts/ping_test.py --samples 5 --timeout 8 --concurrency 4

安全约束：
    测试 Key 仅从环境变量读取（环境变量名由 platforms.json 的 api_key_env 字段指定）；
    未配置时跳过 Authorization 头。Key 严禁写入代码与 JSON 文件。

可靠性：
    写回采用「临时文件 + os.replace」原子替换，替换前生成 .bak 备份；
    单站超时 + 信号量限并发，一个站点挂死不会拖垮整个测试。
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "src" / "data" / "platforms.json"


def _http_status(url: str, headers: dict, timeout: float) -> int | None:
    """单次 GET 请求；返回 HTTP 状态码，网络异常返回 None。"""
    req = Request(url, headers=headers, method="GET")
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.status
    except HTTPError as exc:
        # 服务可达：记录状态码（成功判定见 probe_site）
        return exc.code
    except (URLError, OSError, TimeoutError):
        return None


async def probe_site(
    site: dict,
    sem: asyncio.Semaphore,
    key_env: str,
    samples: int,
    timeout: float,
) -> dict:
    """对单站采样 samples 次，返回结果摘要（不修改原站数据）。"""
    base = (site.get("url") or "").rstrip("/")
    endpoint = site.get("test_endpoint") or "/v1/models"
    if not base:
        return {"id": site["id"], "name": site["name"], "error": "url 为空，跳过"}

    api_key = os.environ.get(site.get("api_key_env") or key_env, "")
    headers = {
        "User-Agent": "ApiSpotlight/1.0",
        "Accept": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    async def one_attempt() -> tuple[int | None, float]:
        async with sem:
            start = time.perf_counter()
            code = await asyncio.to_thread(_http_status, base + endpoint, headers, timeout)
            return code, (time.perf_counter() - start) * 1000

    codes: list[int | None] = []
    latencies: list[float] = []
    for _ in range(samples):
        code, elapsed = await one_attempt()
        codes.append(code)
        if code is not None:
            latencies.append(elapsed)

    # 成功 = 收到响应、状态码 < 500 且非 404；
    # 404 = 端点配置有误（失败）；401/403 = 服务可达但缺 Key（成功，避免误标离线）
    successes = sum(1 for c in codes if c is not None and c < 500 and c != 404)
    success_rate = round(successes / samples * 100, 1)
    median_ms = round(statistics.median(latencies)) if latencies else None

    if success_rate >= 95:
        status = "online"
    elif success_rate >= 60:
        status = "degraded"
    else:
        status = "offline"

    return {
        "id": site["id"],
        "name": site["name"],
        "status": status,
        "latency_ms": median_ms,
        "success_rate": success_rate,
        "codes": sorted({c for c in codes if c is not None}),
        "auth": "key" if api_key else "no-key",
        "endpoint": endpoint,
    }


async def run_all(sites: list[dict], key_env: str, samples: int, timeout: float, concurrency: int) -> list[dict]:
    sem = asyncio.Semaphore(concurrency)
    return await asyncio.gather(*(probe_site(s, sem, key_env, samples, timeout) for s in sites))


def print_report(results: list[dict]) -> None:
    print(f"{'状态':<4} {'成功率':>7} {'延迟中位':>9}  {'站点':<14} 端点 / HTTP 记录")
    print("-" * 90)
    for r in results:
        if "error" in r:
            print(f"ERR       {r['error']}")
            continue
        latency = f"{r['latency_ms']}ms" if r["latency_ms"] is not None else "-"
        codes = ",".join(str(c) for c in r["codes"]) or "不可达"
        auth = r["auth"]
        print(
            f"{r['status']:<4} {r['success_rate']:>6.1f}% {latency:>9}  {r['name']:<12} "
            f"{r['endpoint']} [{codes}] ({auth})"
        )


def update_data_file(results: list[dict]) -> int:
    """原子写回：先备份 .bak，再临时文件 + os.replace。"""
    if not DATA_FILE.exists():
        print(f"！找不到数据文件：{DATA_FILE}", file=sys.stderr)
        return 1

    with DATA_FILE.open("r", encoding="utf-8") as fh:
        sites = json.load(fh)

    by_id = {r["id"]: r for r in results if "error" not in r}
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for site in sites:
        r = by_id.get(site["id"])
        if not r:
            continue
        site.update(
            {
                "status": r["status"],
                "latency_ms": r["latency_ms"],
                "success_rate": r["success_rate"],
                "last_checked": now,
            }
        )

    shutil.copy2(DATA_FILE, DATA_FILE.with_suffix(".json.bak"))
    tmp = DATA_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(sites, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, DATA_FILE)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Api探照灯 接口实测脚本（默认只读预览）")
    parser.add_argument("--apply", action="store_true", help="实测后写回 src/data/platforms.json（默认仅打印）")
    parser.add_argument("--samples", type=int, default=3, help="每站采样次数（默认 3）")
    parser.add_argument("--timeout", type=float, default=10.0, help="单次请求超时秒数（默认 10）")
    parser.add_argument("--concurrency", type=int, default=8, help="并发站点数（默认 8）")
    parser.add_argument("--key-env", default="SPOTLIGHT_TEST_KEY", help="默认测试 Key 环境变量名")
    args = parser.parse_args()

    if not DATA_FILE.exists():
        print(f"！找不到数据文件：{DATA_FILE}", file=sys.stderr)
        return 1

    with DATA_FILE.open("r", encoding="utf-8") as fh:
        sites = json.load(fh)

    print(f"开始实测：{len(sites)} 个站点 × {args.samples} 次采样，并发 {args.concurrency}，超时 {args.timeout}s\n")
    results = asyncio.run(run_all(sites, args.key_env, args.samples, args.timeout, args.concurrency))
    print_report(results)

    if args.apply:
        rc = update_data_file(results)
        print(f"\n已写回 {DATA_FILE}（原文件备份为 .json.bak）" if rc == 0 else "\n写回失败")
        return rc

    print("\n（预览模式：未写回。使用 --apply 写回数据文件）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
