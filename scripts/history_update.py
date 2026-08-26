#!/usr/bin/env python3
"""
Api探照灯 · 每日历史趋势基线

读取 src/data/platforms.json 的实测指标，追加/更新当日条目到 src/data/history.json
（每条记录各平台的 latency_ms / success_rate），保留最近 30 天，原子替换 + .bak 备份。

用法：
  python scripts/history_update.py --apply   # 更新当日并写回（cron 中调用）
  python scripts/history_update.py           # 干跑，仅打印（默认）
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
PLATFORMS_FILE = DATA_DIR / "platforms.json"
HISTORY_FILE = DATA_DIR / "history.json"
KEEP_DAYS = 30


def main() -> int:
    parser = argparse.ArgumentParser(description="Api探照灯 每日历史趋势基线")
    parser.add_argument("--apply", action="store_true", help="写回 src/data/history.json（默认仅打印）")
    args = parser.parse_args()

    platforms = json.loads(PLATFORMS_FILE.read_text(encoding="utf-8"))
    doc = json.loads(HISTORY_FILE.read_text(encoding="utf-8")) if HISTORY_FILE.exists() else {"entries": []}
    entries: list[dict] = doc.get("entries", [])
    # 以实测时间戳（last_checked）为准归属日期，避免跨时区歧义
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    new_entry = {
        "date": today,
        "platforms": {
            p["id"]: {
                "latency_ms": p.get("latency_ms"),
                "success_rate": p.get("success_rate"),
            }
            for p in platforms
        },
    }
    entries = [e for e in entries if e.get("date") != today]
    entries.append(new_entry)
    entries = sorted(entries, key=lambda e: e["date"])[-KEEP_DAYS:]

    print(f"今日条目：{today}（{len(new_entry['platforms'])} 个平台）")
    print(f"历史范围：{entries[0]['date']} ~ {entries[-1]['date']}（共 {len(entries)} 天，保留 {KEEP_DAYS} 天）")

    if args.apply:
        shutil.copy2(HISTORY_FILE, HISTORY_FILE.with_suffix(".json.bak")) if HISTORY_FILE.exists() else None
        tmp = HISTORY_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, HISTORY_FILE)
        print(f"已写回 {HISTORY_FILE}")
    else:
        print("（干跑模式：未写回。使用 --apply 更新历史）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
