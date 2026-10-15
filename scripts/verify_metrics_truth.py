#!/usr/bin/env python3
"""
CI / 预发门禁：度量真实性离线校验 (Metrics Truth Gatekeeper)
规则集合：
- R1（零同秒）：所有平台的 last_checked 集合，相同秒级时间戳的平台数 <= 3
- R2（零假直连）：凡 cn_access == 'blocked' 的平台，measured_via 必为 'tunnel'|'unknown'，且 latency_ms 必须为 None
- R3（零旁挂）：src/data/probe_live.json 必须被至少一个前台组件引用
- R4（零硬编码造假）：全局扫描 src/ 与 scripts/，禁止伪造延迟（如 random.randint）
- R5（无口径禁止上墙）：凡 latency_ms != None 的项，measured_via 必须明确为 'direct'
"""

import collections
import json
import pathlib
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_FILE = REPO_ROOT / "src" / "data" / "platforms.json"
PROBE_LIVE_FILE = REPO_ROOT / "src" / "data" / "probe_live.json"
SRC_DIR = REPO_ROOT / "src"
SCRIPTS_DIR = REPO_ROOT / "scripts"


def check_r1(platforms: list[dict]) -> tuple[bool, str]:
    """R1（零同秒）：相同秒级时间戳的平台数 <= 3"""
    counts = collections.Counter(p.get("last_checked") for p in platforms if p.get("last_checked"))
    violations = {ts: count for ts, count in counts.items() if count > 3}
    if violations:
        return False, f"发现批量统一盖章违规（同秒数 > 3）：{violations}"
    return True, f"零同秒校验通过（最大同秒平台数: {max(counts.values()) if counts else 0} <= 3）"


def check_r2(platforms: list[dict]) -> tuple[bool, str]:
    """R2（零假直连）：cn_access == 'blocked' 的平台，measured_via 为 tunnel/unknown 且 latency_ms 为 None"""
    bad = []
    for p in platforms:
        if p.get("cn_access") == "blocked":
            via = p.get("measured_via")
            lat = p.get("latency_ms")
            if via not in ("tunnel", "unknown") or lat is not None:
                bad.append(f"{p.get('id')} (cn_access=blocked, measured_via={via}, latency_ms={lat})")
    if bad:
        return False, f"发现受限平台冒充直连或落库延迟：{bad}"
    return True, "零假直连校验通过（所有 cn_access=blocked 平台均未暴露直连延迟）"


def check_r3() -> tuple[bool, str]:
    """R3（零旁挂）：src/data/probe_live.json 必须被至少一个前台组件引用"""
    if not PROBE_LIVE_FILE.exists():
        return False, f"probe_live.json 文件不存在：{PROBE_LIVE_FILE}"
    
    referenced_in = []
    for f in SRC_DIR.rglob("*.tsx"):
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "probe_live" in text:
            referenced_in.append(str(f.relative_to(REPO_ROOT)))
    
    if not referenced_in:
        return False, "src/data/probe_live.json 未被任何前台 .tsx 组件引用，处于旁挂状态"
    return True, f"零旁挂校验通过（被引用：{', '.join(referenced_in)}）"


def check_r4() -> tuple[bool, str]:
    """R4（零硬编码造假）：src/ 与 scripts/ 禁止出现伪造延迟的 random.randint"""
    bad_lines = []
    fake_patterns = [
        re.compile(r"randint\s*\(\s*\d+\s*,\s*\d+\s*\)"),
        re.compile(r"random\.uniform\s*\(\s*\d+\s*,\s*\d+\s*\)"),
    ]
    for folder in (SRC_DIR, SCRIPTS_DIR):
        for f in folder.rglob("*.*"):
            if f.suffix not in (".py", ".ts", ".tsx", ".js"):
                continue
            for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if any(pat.search(line) for pat in fake_patterns) and ("latency" in line.lower() or "ping" in line.lower()):
                    bad_lines.append(f"{f.relative_to(REPO_ROOT)}:{i}: {line.strip()}")
    if bad_lines:
        return False, f"发现硬编码随机造假痕迹：{bad_lines}"
    return True, "零硬编码造假校验通过（未发现任何伪造延迟的随机生成器）"


def check_r5(platforms: list[dict]) -> tuple[bool, str]:
    """R5（无口径禁止上墙）：凡 latency_ms != None 的项，measured_via 必须明确为 'direct'"""
    bad = []
    for p in platforms:
        lat = p.get("latency_ms")
        via = p.get("measured_via")
        if lat is not None and via != "direct":
            bad.append(f"{p.get('id')} (latency_ms={lat}, measured_via={via})")
    if bad:
        return False, f"发现非 direct 口径平台落库 latency_ms：{bad}"
    return True, "无口径禁止上墙校验通过（所有展示延迟的平台均具有 direct 明确口径）"


def check_r6_freshness() -> tuple[bool, str]:
    """令状 R5（探针副证保鲜防线）：probe_live.json 缺失或 >48h 告警拦截"""
    if not PROBE_LIVE_FILE.exists():
        return False, f"probe_live.json 缺失：{PROBE_LIVE_FILE}"
    try:
        from datetime import datetime, timezone
        data = json.loads(PROBE_LIVE_FILE.read_text(encoding="utf-8"))
        gen_str = data.get("generated_at")
        if not gen_str:
            return False, "probe_live.json 缺少 generated_at 生成时刻"
        gen_dt = datetime.fromisoformat(gen_str)
        now_dt = datetime.now(timezone.utc)
        age_hours = (now_dt - gen_dt).total_seconds() / 3600.0
        if age_hours > 48.0:
            return False, f"probe_live.json 探针副证已超期（生成于 {age_hours:.1f} 小时前，上限 48h），禁止陈旧探针上墙！"
        return True, f"探针保鲜校验通过（采样于 {age_hours:.1f} 小时前 <= 48h）"
    except Exception as e:
        return False, f"probe_live.json 解析时间戳失败: {e}"


def main() -> int:
    print("=" * 70)
    print("【度量真实性门禁校验】(Metrics Truth Gatekeeper)")
    print("=" * 70)

    if not DATA_FILE.exists():
        print(f"❌ 数据文件不存在: {DATA_FILE}", file=sys.stderr)
        return 1

    try:
        with DATA_FILE.open("r", encoding="utf-8") as f:
            platforms = json.load(f)
    except Exception as e:
        print(f"❌ 数据文件解析失败: {e}", file=sys.stderr)
        return 1

    checks = [
        ("R1 零同秒校验", check_r1(platforms)),
        ("R2 零假直连校验", check_r2(platforms)),
        ("R3 零旁挂校验", check_r3()),
        ("R4 零硬编码校验", check_r4()),
        ("R5 口径准入校验", check_r5(platforms)),
        ("R6 探针新鲜度校验", check_r6_freshness()),
    ]

    all_pass = True
    for name, (ok, msg) in checks:
        icon = "✅ PASS" if ok else "❌ FAIL"
        print(f"[{icon}] {name}: {msg}")
        if not ok:
            all_pass = False

    print("-" * 70)
    if all_pass:
        print("🎉 全部 6 项门禁校验通过！真实性指标达标，准予放行。")
        return 0
    else:
        print("🚨 存在未通过的真实性门禁，一票否决！禁止发布。", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
