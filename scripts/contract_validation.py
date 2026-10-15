#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Contract v1 数据契约校验（zero-dep，本地与 CI 通用）。

校验对象：
- src/data/*.json   （数据源，默认校验）
- public/data/*.json（构建产物快照；存在 contract.json 时自动校验）

Contract v1 红线（详见 docs/contract-v1.md）：
- 公开数据以 contract.json 信封声明 schema_version（当前 1.0）
- platforms.json：affiliate_url 必须恒为 null；禁止任何商业字段前缀
- 指标只由测试脚本产生：本脚本只读校验，永不写回数据
- 校验失败 exit 1（CI 闸门），提示信息为中文，逐条列出
"""

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

# 确保在 Windows 控制台（cp936/GBK）下输出带 emoji 提示时不报 UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data"
PUB = ROOT / "public" / "data"
SCHEMA_VERSION = "1.0"

# 数据保鲜门禁（批F第3阶段）：核验日期超过该天数即控制台警告，防止再出现数月无人复核。
FRESHNESS_MAX_DAYS = 30
# 批B A线探针 sidecar（src/data/probe_live.json）只读消费：超 45 天未探仅黄灯提醒，
# 不阻断构建（30 天人工核验硬闸仍以 last_checked 为准，探针是旁路辅助证词）。
PROBE_STALE_WARN_DAYS = 45
FRESHNESS_TARGETS = (
    # (文件, 日期字段优先序, 展示名) —— platforms.json 为探针写回的 last_checked，其余为人工核验日期
    ("platforms.json", ("last_verified", "last_checked"), "平台实测"),
    ("free-tiers.json", ("last_verified",), "免费额度"),
    ("platform-content.json", ("last_verified",), "平台内容"),
    ("perks.json", ("verified_at",), "官方赠额"),
    ("resources.json", ("last_verified",), "开发者资源"),
)

FORBIDDEN_PREFIXES = (
    "partner_", "sponsor_", "ad_", "promo_", "commercial_",
    "tracking_", "utm_", "affiliate_link", "ref_", "referral_",
)
ISO8601 = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def load(path: Path, name: str):
    if not path.exists():
        err(f"{name}: 文件缺失（{path}）")
        return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        err(f"{name}: JSON 解析失败 line {e.lineno} col {e.colno}")
        return None


def require_str(d: dict, key: str, where: str) -> None:
    v = d.get(key)
    if not isinstance(v, str) or not v.strip():
        err(f"{where}.{key} 必须为非空字符串")


def check_forbidden_keys(d: dict, where: str) -> None:
    for k in d.keys():
        for p in FORBIDDEN_PREFIXES:
            if k.startswith(p):
                err(f"{where} 出现商业字段名「{k}」（违规前缀 {p}*）")
        if k == "affiliate_url":
            if d[k] is not None:
                err(f"{where} affiliate_url 必须为 null（Zero Affiliate 红线）")


def validate_platforms(data, where: str) -> None:
    if not isinstance(data, list) or not data:
        err(f"{where}: 必须为非空数组")
        return
    ids: dict[str, int] = {}
    for i, x in enumerate(data):
        w = f"{where}[{i}]"
        if not isinstance(x, dict):
            err(f"{w}: 必须为对象")
            continue
        for f in ("id", "name", "url", "test_endpoint", "last_checked"):
            require_str(x, f, w)
        if x.get("type") not in ("official", "relay"):
            err(f"{w}.type 必须为 official|relay")
        if x.get("status") not in ("online", "degraded", "offline"):
            err(f"{w}.status 必须为 online|degraded|offline（仅脚本可产出）")
        lat = x.get("latency_ms")
        if lat is not None and (not isinstance(lat, (int, float)) or lat < 0):
            err(f"{w}.latency_ms 必须为 null 或非负数")
        sr = x.get("success_rate")
        if not isinstance(sr, (int, float)) or not (0 <= sr <= 100):
            err(f"{w}.success_rate 必须为 0-100 数值")
        if not isinstance(x.get("supported_models"), list) or not x["supported_models"]:
            err(f"{w}.supported_models 必须为非空字符串数组")
        if not ISO8601.match(str(x.get("last_checked", ""))):
            err(f"{w}.last_checked 必须为 ISO8601（如 2026-08-27T10:21:24Z）")
        if "cn_access" in x and x["cn_access"] not in ("direct", "unstable", "blocked"):
            err(f"{w}.cn_access 必须为 direct|unstable|blocked")
        sid = x.get("id", "")
        if sid:
            if sid in ids:
                err(f"{where} 出现重复 id「{sid}」（[0]={ids[sid]}）")
            ids[sid] = i
        check_forbidden_keys(x, w)


def validate_perks(data, where: str) -> None:
    if not isinstance(data, list) or not data:
        err(f"{where}: 必须为非空数组")
        return
    ids: set[str] = set()
    for i, x in enumerate(data):
        w = f"{where}[{i}]"
        for f in ("id", "name", "provider", "content", "link"):
            require_str(x, f, w)
        va = x.get("verified_at")
        if va is not None and not DATE.match(str(va)):
            err(f"{w}.verified_at 必须为 YYYY-MM-DD")
        sid = x.get("id", "")
        if sid and sid in ids:
            err(f"{where} 出现重复 id「{sid}」")
        ids.add(sid)


def validate_authenticity(platform_ids: set[str], data, where: str) -> None:
    if not isinstance(data, dict):
        err(f"{where}: 必须为对象")
        return
    profiles = data.get("profiles")
    if not isinstance(profiles, list) or not profiles:
        err(f"{where}.profiles 必须为非空数组")
    else:
        seen = set()
        for i, p in enumerate(profiles):
            w = f"{where}.profiles[{i}]"
            require_str(p, "platform_id", w)
            require_str(p, "model", w)
            if p.get("platform_id", "") in seen:
                err(f"{w}: 重复 platform_id")
            seen.add(p.get("platform_id", ""))
            if p.get("platform_id") not in platform_ids:
                err(f"{w}.platform_id={p.get('platform_id')} 未在 platforms.json 中定义")
    reports = data.get("reports")
    if not isinstance(reports, list):
        err(f"{where}.reports 必须为数组")
        return
    allowed = ("authentic", "suspect", "unknown", "skipped", "no-response")
    for i, r in enumerate(reports):
        w = f"{where}.reports[{i}]"
        require_str(r, "platform_id", w)
        require_str(r, "model", w)
        if r.get("platform_id") not in platform_ids:
            err(f"{w}.platform_id={r.get('platform_id')} 未在 platforms.json 中定义")
        if r.get("verdict") not in allowed:
            err(f"{w}.verdict 必须为 {'|'.join(allowed)}")
        if not ISO8601.match(str(r.get("checked_at", ""))):
            err(f"{w}.checked_at 必须为 ISO8601")


def validate_trends(data, where: str, platform_ids: set[str]) -> None:
    if not isinstance(data, dict):
        err(f"{where}: 必须为对象")
        return
    if data.get("schema_version") != SCHEMA_VERSION:
        err(f"{where}.schema_version 必须为 {SCHEMA_VERSION}")
    entries = data.get("entries")
    if not isinstance(entries, list) or not entries:
        err(f"{where}.entries 必须为非空数组")
        return
    for i, e in enumerate(entries):
        w = f"{where}.entries[{i}]"
        require_str(e, "date", w)
        if not DATE.match(str(e.get("date", ""))):
            err(f"{w}.date 必须为 YYYY-MM-DD")
        pts = e.get("platforms")
        if not isinstance(pts, dict) or not pts:
            err(f"{w}.platforms 必须为非空对象")
            continue
        for pid, pt in pts.items():
            pw = f"{w}.platforms.{pid}"
            if not isinstance(pt, dict):
                err(f"{pw}: 必须为对象")
                continue
            lat = pt.get("latency_ms")
            if lat is not None and (not isinstance(lat, (int, float)) or lat < 0):
                err(f"{pw}.latency_ms 必须为 null 或非负数")
            sr = pt.get("success_rate")
            if not isinstance(sr, (int, float)) or not (0 <= sr <= 100):
                err(f"{pw}.success_rate 必须为 0-100 数值")
            if pid not in platform_ids:
                warn(f"{pw}: 平台已不在 platforms.json（历史条目，保留）")


def validate_contract() -> dict:
    path = PUB / "contract.json"
    if not path.exists():
        err(f"contract.json 缺失（{path}）—— 请在构建时同步生成")
        return {}
    c = load(path, "contract.json") or {}
    if c.get("schema_version") != SCHEMA_VERSION:
        err(f"contract.json.schema_version 必须为 {SCHEMA_VERSION}")
    files = c.get("files")
    if not isinstance(files, dict):
        err("contract.json.files 必须为对象")
        return c
    expected = {"platforms.json", "perks.json", "authenticity.json", "trends.json"}
    if set(files.keys()) != expected:
        err(f"contract.json.files 键必须为 {sorted(expected)}，当前 {sorted(files.keys())}")
    if "generated_at" not in c or "source_commit" not in c:
        err("contract.json 必须包含 generated_at 与 source_commit")
    return c


def validate_history(data, where: str) -> None:
    if not isinstance(data, dict) or not isinstance(data.get("entries"), list):
        err(f"{where}: 必须为含 entries 数组的对象")
        return
    if not data["entries"]:
        err(f"{where}.entries 必须为非空数组")
    for i, e in enumerate(data["entries"]):
        w = f"{where}.entries[{i}]"
        require_str(e, "date", w)
        if not DATE.match(str(e.get("date", ""))):
            err(f"{w}.date 必须为 YYYY-MM-DD")
        pts = e.get("platforms")
        if not isinstance(pts, dict) or not pts:
            err(f"{w}.platforms 必须为非空对象")


def check_freshness() -> None:
    """防懒政保鲜门禁：任一条目核验日期距今天超过 FRESHNESS_MAX_DAYS 天 → 明确警告。

    静态 JSON 本身没有问题，问题在于“静态之后没有巡检”。本检查只报警不阻断（CI 仍绿），
    但每次构建都会把最旧条目的具体日期与天数打到控制台，督促站长复核刷新。
    """
    today = date.today()
    worst: tuple[int, str] | None = None  # (天数, "文件 条目")
    for name, fields, label in FRESHNESS_TARGETS:
        path = SRC / name
        if not path.exists():
            continue  # 文件缺失由对应 validate_* 报错，这里不重复
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            data = data.get("reports") or data.get("entries") or data.get("profiles") or []
        if not isinstance(data, list):
            continue
        stale: list[tuple[int, str]] = []
        unparsable = 0
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                continue
            raw = next((str(item.get(f)) for f in fields if item.get(f)), None)
            if not raw:
                continue
            try:
                day = date.fromisoformat(raw[:10])
            except ValueError:
                unparsable += 1
                continue
            age = (today - day).days
            if age > FRESHNESS_MAX_DAYS:
                stale.append((age, f"条目[{i}]{item.get('slug') or item.get('id') or ''} {raw[:10]}"))
            if worst is None or age > worst[0]:
                worst = (age, f"{name} {item.get('slug') or item.get('id') or ''}".strip())
        if stale:
            stale.sort(reverse=True)
            oldest = stale[0]
            warn(
                f"数据保鲜（{label}·{name}）：{len(stale)}/{len(data)} 条超过 {FRESHNESS_MAX_DAYS} 天未复核"
                f"（最旧 {oldest[1].split(' ')[1]}，距今 {oldest[0]} 天）→ 请复核并刷新核验日期"
            )
        if unparsable:
            warn(f"数据保鲜（{label}·{name}）：{unparsable} 条日期无法解析（应为 YYYY-MM-DD）")
    if worst is not None and worst[0] <= FRESHNESS_MAX_DAYS:
        return f"🕒 保鲜检查：全部核验日期均在 {FRESHNESS_MAX_DAYS} 天内（最旧：{worst[1]}，{max(worst[0], 0)} 天前）"
    return None


def check_probe_sidecar() -> str | None:
    """探针副证只读消费：sidecar 存在才读，缺失静默跳过；过期仅黄灯，绝不阻断构建。"""
    path = SRC / "probe_live.json"
    if not path.exists():
        return None  # 探针尚未跑过：完全静默，不干扰构建
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        warn(f"探针 sidecar 解析失败（不阻断）：{e}")
        return None
    generated = str(data.get("generated_at", ""))[:19]
    try:
        age_days = (datetime.now() - datetime.fromisoformat(generated)).days
    except ValueError:
        warn("探针 sidecar.generated_at 无法解析（不阻断）")
        return None
    s = data.get("summary") or {}
    if age_days > PROBE_STALE_WARN_DAYS:
        warn(
            f"探针副证已 {age_days} 天未测活（阈值 {PROBE_STALE_WARN_DAYS}）"
            f"→ 请跑 npm run probe:live 刷新（不阻断构建）"
        )
        return None
    return (
        f"🛰️ 探针副证：{age_days} 天前测活（{generated[:10]}）"
        f"—— alive {s.get('alive', '?')} / dead {s.get('dead', '?')} / skipped {s.get('skipped', '?')} / blocked {s.get('blocked', '?')}"
    )


def main() -> int:
    platforms = load(SRC / "platforms.json", "src/data/platforms.json")
    if platforms is not None:
        validate_platforms(platforms, "src/data/platforms.json")
    perks = load(SRC / "perks.json", "src/data/perks.json")
    if perks is not None:
        validate_perks(perks, "src/data/perks.json")
    auth = load(SRC / "authenticity.json", "src/data/authenticity.json")
    if auth is not None:
        platform_ids = {x.get("id") for x in platforms} if platforms else set()
        validate_authenticity(platform_ids, auth, "src/data/authenticity.json")
    validate_history(load(SRC / "history.json", "src/data/history.json"), "src/data/history.json")

    # 构建产物快照（存在 contract.json 即校验）
    if (PUB / "contract.json").exists():
        platform_ids = {x.get("id") for x in platforms} if platforms else set()
        validate_trends(load(PUB / "trends.json", "public/data/trends.json"), "public/data/trends.json", platform_ids)
        for name in ("platforms.json", "perks.json", "authenticity.json"):
            src_v = load(SRC / name, f"src/data/{name}")
            pub_v = load(PUB / name, f"public/data/{name}")
            if src_v is not None and pub_v is not None and json.dumps(src_v, sort_keys=True) != json.dumps(pub_v, sort_keys=True):
                err(f"public/data/{name} 与 src/data/{name} 不一致（构建快照过期？）")
        validate_contract()

    # 防懒政保鲜门禁（批F第3阶段）：核验日期超 30 天 → 控制台警告（不阻断，同 CI 口径）
    freshness_ok = check_freshness()
    # 探针副证只读消费（批B A线）：旁路旁证，缺失静默、过期黄灯、永不阻断
    probe_note = check_probe_sidecar()

    for w in warnings:
        print(f"⚠️  {w}")
    if freshness_ok:
        print(freshness_ok)
    if probe_note:
        print(probe_note)
    if errors:
        print(f"❌ Contract v1 校验失败（{len(errors)} 项）:")
        for e in errors:
            print(f"   - {e}")
        return 1
    print("✅ Contract v1 校验通过（src 数据源 + public 快照均符合 schema_version 1.0）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
