#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Probe official model sources & generate src/data/models_diff.json.

长效模型对账探针（B 链）：
- 读取 src/data/platforms.json 与 src/data/official_sources.json
- 比对前台平台配置模型与权威官方源模型（diff added / removed）
- 严禁代理污染（绕过系统代理）
- 输出结构化审计产物 src/data/models_diff.json
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data"


def main():
    platforms_file = SRC / "platforms.json"
    sources_file = SRC / "official_sources.json"
    out_diff_file = SRC / "models_diff.json"

    if not platforms_file.exists():
        print(f"❌ 找不到 {platforms_file}")
        return 1
    if not sources_file.exists():
        print(f"❌ 找不到 {sources_file}")
        return 1

    with open(platforms_file, "r", encoding="utf-8") as f:
        platforms = json.load(f)

    with open(sources_file, "r", encoding="utf-8") as f:
        sources_data = json.load(f)

    sources_map = {s["platform_id"]: s for s in sources_data.get("sources", [])}

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    diff_list = []
    synced_count = 0
    divergent_count = 0

    for p in platforms:
        pid = p.get("id")
        pname = p.get("name")
        configured_models = p.get("supported_models", [])
        src = sources_map.get(pid)

        if not src:
            diff_list.append({
                "platform_id": pid,
                "name": pname,
                "status": "untracked",
                "configured_models": configured_models,
                "official_models": [],
                "added": configured_models,
                "removed": [],
                "models_url": None,
                "error": "未在 official_sources.json 登记权威官方源",
                "last_checked": now_iso
            })
            divergent_count += 1
            continue

        official_models = src.get("active_models", [])
        models_url = src.get("models_url")

        set_cfg = set(configured_models)
        set_off = set(official_models)

        added = sorted(list(set_cfg - set_off))
        removed = sorted(list(set_off - set_cfg))

        is_synced = (len(added) == 0 and len(removed) == 0)
        status = "synced" if is_synced else "divergent"

        if is_synced:
            synced_count += 1
        else:
            divergent_count += 1

        diff_list.append({
            "platform_id": pid,
            "name": pname,
            "type": p.get("type"),
            "status": status,
            "configured_models": configured_models,
            "official_models": official_models,
            "added": added,
            "removed": removed,
            "models_url": models_url,
            "hosted_upstream": src.get("hosted_upstream"),
            "evidence": src.get("evidence"),
            "last_verified": src.get("last_verified"),
            "last_checked": now_iso
        })

    report = {
        "schema_version": "1.0",
        "generated_at": now_iso,
        "summary": {
            "total_platforms": len(platforms),
            "synced_platforms": synced_count,
            "divergent_platforms": divergent_count,
            "status": "clean" if divergent_count == 0 else "action_required"
        },
        "diffs": diff_list
    }

    with open(out_diff_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"✓ models_diff.json 已生成: 共 {len(platforms)} 家平台，{synced_count} 家完全同步，{divergent_count} 家存在差异。")
    return 0 if divergent_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
