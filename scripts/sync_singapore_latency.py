# D:\api-spotlight\scripts\sync_singapore_latency.py
# 从新加坡前哨节点获取官方 API 实时时延，同步写回 platforms.json（src 与 public 双份）
import json, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_JSON = ROOT / "src" / "data" / "platforms.json"
PUB_JSON = ROOT / "public" / "data" / "platforms.json"
SSH_KEY = Path(os.environ["USERPROFILE"]) / ".ssh" / "apiops_gray_ed25519"
ID_PREFIX = "provider-"  # 本地 id = provider-<远程 id>

cmd = [
    "ssh", "-p", "2222", "-i", str(SSH_KEY),
    "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=8",
    "root@111.91.22.52", "cat /opt/sentinel/out/official_latency.json",
]

res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
if res.returncode != 0:
    print(f"SSH 获取失败: {res.stderr}")
    sys.exit(1)

remote_data = json.loads(res.stdout)
remote_results = {item["id"]: item for item in remote_data.get("results", [])}
generated_at = remote_data.get("generated_at")

for target_file in [SRC_JSON, PUB_JSON]:
    if not target_file.exists():
        continue
    with open(target_file, "r", encoding="utf-8") as f:
        local_data = json.load(f)

    platforms = local_data if isinstance(local_data, list) else local_data.get("platforms", [])

    shutil.copy2(target_file, str(target_file) + ".bak")

    updated_count = 0
    for platform in platforms:
        pid = platform.get("id", "")
        rid = pid[len(ID_PREFIX):] if pid.startswith(ID_PREFIX) else pid
        r = remote_results.get(rid)
        if r is None:
            continue
        platform["latency_ms"] = r["latency_ms"]
        platform["status"] = r["status"]
        platform["last_checked"] = generated_at or platform.get("last_checked")
        platform["measured_via"] = "singapore_outpost"
        updated_count += 1
        print(f"已同步 {pid}: {r['latency_ms']} ms ({r['status']})")

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(local_data, f, ensure_ascii=False, indent=2)
    print(f"写入成功: {target_file} (共 {updated_count} 项)")
