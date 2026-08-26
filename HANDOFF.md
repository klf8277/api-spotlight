# 📦 APISpotlight · 交接与当前状态（2026-08-27）

> 本文件是仓库侧的项目现状 + 运维手册。Obsidian 侧同步见 `项目/Api探照灯/03_交接与当前状态.md`。

## 一句话定位

完全中立 · 无利益相关 · Zero Affiliate 的第三方开源评测导航：27 家官方原厂 API 平台 —— 实测延迟/成功率 + 🇨🇳 境内可用性 + 官方赠额 + 真实性抽查框架。纯静态、JSON 驱动、零数据库、CI 全自动。

## 资产地图

| 资产 | 位置 |
|---|---|
| 线上站点 | `https://api-spotlight.pages.dev` |
| 本仓库 | 代码 + 数据 + 脚本 + workflows（MIT） |
| 本地工程 | `D:\api-spotlight` |

## 关键约定（改动前必读）

1. **数据即代码**：内容全部在 `src/data/*.json`；改数据 → `npm run build` → 推送；
2. **Key 铁律**：任何 API Key 只允许环境变量/GitHub Secret，禁止进源码与 JSON；
3. **零返利/零造假**：指标只能由脚本实测写回（`ping_test.py --apply`），禁止手填；
4. **MPT 边界**：本项目不得为自有业务引流（与仓库无关但不越界）。

## 运维命令

```bash
npm run build                                  # 构建（含 /data/*.json 公开快照）
python scripts/ping_test.py --apply            # 连通性实测写回
python scripts/authenticity_test.py --calibrate  # 指纹校准（需官方直连 Key，样本≥8）
git push origin main                           # Push 即部署
```

## ⚠️ 已知问题（2026-08-26 起）

- **GitHub Actions 事件触发失效**：连续 3 次 push 未自动触发 deploy_pages.yml（无失败记录）。
  对策：① watchman（cron 自愈，≤6h 自动补触发）；② 人工应急（本机）：
  ```bash
  CRED=$(printf "protocol=https\nhost=github.com\n\n" | GIT_TERMINAL_PROMPT=0 git credential fill)
  TOKEN=$(echo "$CRED" | grep "^password=" | cut -d= -f2-)
  curl -X POST -H "Authorization: Bearer $TOKEN" -d '{"ref":"main"}' \
    "https://api.github.com/repos/klf8277/api-spotlight/actions/workflows/deploy_pages.yml/dispatches"
  ```
  根因待查：repo Settings → Actions → General 的「允许 Actions 运行」开关。

## 模型清单口径（2026-08）

官方文档/公开模型列表取证更新（OpenAI / Anthropic / DeepSeek / xAI 官网 + OpenRouter / Novita / DeepInfra 公开列表），聚合平台展示其在列最新模型；一切以官网为准。

## 待办

1. 历史趋势（cron 每日追加 history.json，30 天封顶）
2. 渐进式抽查（官方 Key：DeepSeek/智谱/硅基流动最易）——定位「档位验证 + 基线积累」
3. 排查 Actions 触发异常
4. 明确不做：第三方中转打假 / 建群 / 月度报告 / 国内付费节点 / i18n
