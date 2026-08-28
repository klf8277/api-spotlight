# 📦 APISpotlight · 交接与当前状态（2026-08-27）

> 本文件是仓库侧的项目现状 + 运维手册。Obsidian 侧同步见 `项目/Api探照灯/03_交接与当前状态.md`。

## 一句话定位

完全中立 · 无利益相关 · Zero Affiliate 的第三方开源评测导航：28 家官方原厂 API 平台 —— 实测延迟/成功率 + 🇨🇳 境内可用性 + 官方赠额 + 真实性抽查框架。纯静态、JSON 驱动、零数据库、CI 全自动。

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

## 已知问题（2026-08-27 定论）

- **Push 触发为「延迟排队」而非失效**（实测约 20 分钟量级，配置正常）。已用双保险兜底：
  ① 部署闸门「仅部署最新 main」（迟到旧提交自动跳过，杜绝回滚）；
  ② watchman（cron 自愈，45s 复检后再补发，避免与迟到 push 重复）。
- 人工应急（仅当线上滞后 >6h 且 watchman 未动作时使用）：
  ```bash
  CRED=$(printf "protocol=https\nhost=github.com\n\n" | GIT_TERMINAL_PROMPT=0 git credential fill)
  TOKEN=$(echo "$CRED" | grep "^password=" | cut -d= -f2-)
  curl -X POST -H "Authorization: Bearer $TOKEN" -d '{"ref":"main"}' \
    "https://api.github.com/repos/klf8277/api-spotlight/actions/workflows/deploy_pages.yml/dispatches"
  ```

## 模型清单口径（2026-08）

官方文档/公开模型列表取证更新（OpenAI / Anthropic / DeepSeek / xAI 官网 + OpenRouter / Novita / DeepInfra 公开列表），聚合平台展示其在列最新模型；一切以官网为准。

## 待办

1. ✅ 历史趋势（已上线：cron 每日追加 history.json，30 天封顶，前端 SVG 迷你曲线）
2. ✅ Actions 触发异常（已定论：延迟排队约 20 分钟；闸门 + watchman 双保险）
3. ⏳ 渐进式抽查（官方 Key：DeepSeek/智谱/硅基流动最易）——定位「档位验证 + 基线积累」
4. 🚫 明确不做：第三方中转打假 / 建群 / 月度报告 / 国内付费节点 / i18n

## 2026-08-28 · Content Foundation v0.1（本地完成，未部署）

- 新增 10 个平台页、13 个 Free Tier 页、35 个 AI/API 开发者资源页及分类页；首页导航和 sitemap 已接入。
- 新增数据层：`src/data/platform-content.json`、`src/data/free-tiers.json`、`src/data/resources.json`；原有平台、福利、Benchmark 和 Contract 未修改。
- `npm run lint` 与 `npm run build` 均通过，静态导出生成 80 页；内容引用无重复/孤立；110 个官方 URL 审计中 106 个 2xx、4 个官方 403，无 404。
- 审计文档：`D:\Obsidian\klf8277\项目\Api探照灯\18_Content_Foundation_Audit_v0.1.md`。
- 边界：本轮仅本地内容基础改进，Deployment/Git Commit/Git Push = NONE；AI Weekly、泛 AI Tools Directory、Phase 6 仍 NOT STARTED。
- 快照：`D:\Obsidian\klf8277\项目\Api探照灯\快照_2026-08-28_ContentFoundation`，含数据/源码/审计/交接副本与 `SHA256SUMS.txt`；不含构建缓存、凭据或 API Key。

## 2026-08-28 · Content Foundation Quality Audit v0.2（只读审计）

- 审计文档：`D:\Obsidian\klf8277\项目\Api探照灯\19_Content_Foundation_Quality_Audit_v0.2.md`。
- 审计未修改 Code/Data/Production/Contract/Benchmark；未部署、未 commit、未 push。
- 75 个 canonical 页面通过库存/sitemap 对齐；Resource 与 Internal Links PASS；Free Tier FAIL/CONDITIONAL；SEO FAIL；Thin Risk MEDIUM。
- 问题计数：P0=0、P1=2、P2=5、P3=2。当前 Overall = NOT READY，等待人工决定是否处理 P1。

## 2026-08-28 · Pre-Deployment P1 Fix v0.1（本地完成，未部署）

- 交付文档：`D:\Obsidian\klf8277\项目\Api探照灯\20_Pre_Deployment_P1_Fix_Audit_v0.1.md`。
- 仅处理 v0.2 的两个 P1：Free Tier 来源/状态复核，以及 `free-api-credits` 实体页与分类页 Title 冲突。
- 结果：P0=0、P1=0、P2=6、P3=2；lint/build/contract/sitemap/canonical/SEO/内链均通过。
- Free Tier 保留 Unknown；未修改核心数据模型、Benchmark 或 Contract。生产未部署，Git 未 commit/push，Phase 6 未启动。

## 新窗口提示词（复制即用）

```
【任务】请先阅读 HANDOFF.md 完成项目骨架加载（Obsidian 侧同步见 03_交接与当前状态.md）。
现状：28 家官方原厂 API 平台评测导航 · 零返利/零造假 · 2026-08-27 审计 B+。
已闭环：lint 门禁 / 部署闸门 / watchman 复检 / push 即部署（延迟排队属正常）/ 公开 JSON API / 历史趋势。
待办：①配官方 Key 跑 --calibrate；②观察 2-3 个 cron 周期确认无重复部署；③运营建议仅记录不贸然开工。
红线：Key 只进环境变量；指标只由脚本产生；不导流 MPT 业务；不碰中转站打假。
交付自检：npm run lint（0 错误）+ npm run build + 数据一致性核对。
```

## 2026-08-28 · Deployment Authorization Preparation v0.1

- 交付基线：`D:\Obsidian\klf8277\项目\Api探照灯\21_Pre_Production_Baseline_v0.1.md`。
- 只读核对通过：10 platform、13 Free Tier、35 resources、12 categories；75 内容路由与 Sitemap 75/75 对齐。
- Build 80 与 Sitemap 75 的差异已确认是 5 条预期错误页/工具路由：`/_not-found`、`/404`、`/favicon.ico`、`/robots.txt`、`/sitemap.xml`。
- 当前状态：P0=0、P1=0、P2=6、P3=2；Build/Lint/Contract/Sitemap/Canonical/Internal Links = PASS；SEO = CONDITIONAL。
- Observation 基线：Analytics/Search Console = `ACCESS BLOCKED`；Indexed Pages = `UNKNOWN`；External Discovery = `Not Observed`；未猜测不可访问数据。
- Deployment Authorization = READY；Production = NOT YET DEPLOYED；Observation = NOT YET ACTIVE；Phase 6 = NOT STARTED；本任务无部署、无 Git Commit、无 Git Push。

## 2026-08-28 · Content Foundation v0.1 Production Deployment

- 已按人工授权将 `main` 提交 `e27f1ec6faf34df038ec015dd655decd194bbc34` 发布到 Cloudflare Pages。
- GitHub Actions `Deploy to Cloudflare Pages` run `33179144085` = `success`。
- 生产冒烟通过：首页、Method、Free Tier 详情、资源实体页、资源分类页、Sitemap、公开 JSON 均 HTTP 200；Sitemap 全量 75/75 最终 HTTP 200。
- `/test/` 返回 308 并规范化到 `/test`，最终 HTTP 200；属既有尾斜杠规范化。
- 线上 Title 已确认区分：`Free API Credits · APISpotlight` 与 `Free API Credits 资源分类 · APISpotlight`。
- 当前状态：Production = DEPLOYED；Observation = ACTIVE；Analytics/Search Console 仍待人工读取；Phase 6 = NOT STARTED。未扩展内容范围。

## 2026-08-28 · Model Test Implementation + Security Proposal v0.1

- 交付方案：`D:\Obsidian\klf8277\项目\Api探照灯\23_Model_Test_Implementation_Security_Proposal_v0.1.md`。
- 仅完成架构/UX/安全设计：Native Browser Direct、Verified Official Redirect、Hybrid、Key 生命周期、telemetry/隐私、成本滥用、Threat Model 与 Build-vs-Redirect 决策；未改代码、数据或生产。
- 推荐：少量已验证 Provider 的 Native Test + 官方跳转 fallback；Universal API Proxy 明确 `REJECTED FOR V0.1`；ephemeral/OAuth 不作假设，留待 v0.3 研究。
- 当前状态：Model Test = AUDITED / PROPOSAL READY；Security Gate = DEFINED；Implementation = NOT STARTED；Production = DEPLOYED；Observation = ACTIVE；Phase 6 = NOT STARTED；本轮无部署、无 Git Commit、无 Git Push。

## 2026-08-28 · Gateway / Relay Probe MVP Research v0.1

- 交付研究：`D:\Obsidian\klf8277\项目\Api探照灯\25_Gateway_Relay_Probe_MVP_Research_v0.1.md`。
- 结论：`GO` 仅针对 Authorized Endpoint、Browser Direct、低影响 Quick Test、可追溯 JSON/Markdown 报告；不批准 Universal Proxy、公共中转打假或 100% 模型身份判断。
- 已调查 9 个代表性开源项目，并覆盖 Connectivity、Discovery、Functional、Performance、Reliability、Integrity、Report、Web UX、History、Monitoring 维度；许可证/维护风险和复用边界已记录。
- 安全闸门：Key 只在浏览器内存；不进 APISpotlight、URL、持久化存储、日志或 Analytics；不做服务端抓取；拒绝 loopback/private/metadata 目标；CORS 失败不得自动转代理。
- 本轮仅完成研究与决策文档；Code/Data/Contract/Benchmark/Production = UNCHANGED；Deployment/Git Commit/Git Push = NONE；Phase 6 = NOT STARTED；等待单独人工实施授权。

## 2026-08-28 · Gateway / Relay Probe MVP v0.1 Implementation

- 交付审计：`D:\Obsidian\klf8277\项目\Api探照灯\26_Gateway_Relay_Probe_Implementation_Audit_v0.1.md`。
- `/test` 已升级为 Browser Direct Quick Tester：HTTPS Base URL、可选 Key、`/models` Discovery、单模型 Chat/Streaming、TTFT/Latency、错误分类和 JSON/Markdown 报告。
- 未新增 Server Route/Proxy、数据库/KV、测试 Analytics、长期历史、Share URL、并发压测或身份 classifier；现有核心数据 Contract 未改。
- 本地验证：lint、TypeScript、build、Contract（UTF-8 环境）通过；浏览器 UI/HTTPS/private target/Clear 冒烟通过。
- 真实直连验收：B.AI 官方示例确认 `https://api.b.ai/v1`；`/models` = 200、44 个模型；premium `gpt-5.2` 因充值门槛返回 403；免费 `deepseek-v4-flash` 非流式/流式均 200，声明模型 `deepseek-v4-flash-0731`，流式 `[DONE]` 正常，TTFT 约 4.1s。
- Key 只在本地进程内使用，未写入源码、仓库、报告、日志或 URL；使用后已清除本地变量。Browser CORS 尚未在 `/test` 页面输入真实 Key 做端到端验收。
- 当前状态：Quick Test = PASS（直连协议）；Evidence Report = PASS；Security Gate = CONDITIONAL（Browser CORS 未验收）；Production = READY TO DEPLOY；Deployment/Git Commit/Git Push = PENDING；Phase 6 = NOT STARTED。

## 2026-08-29 · Gateway / Relay Probe MVP v0.1 Production Deployment

- 用户已明确授权直接部署上线；部署范围仅包含本次 `/test` Browser Direct Probe 实现与对应交接记录，不改核心数据 Contract、Benchmark、Phase 6 或 MPT。
- 部署前 `npm run lint`、`npx tsc --noEmit`、`npm run contract:check`、`npm run build` 均 PASS；提交 `a5a8999db9b907bb7f43e1d7f2e106471c587f4a` 已推送 `main`。
- GitHub Actions `Deploy to Cloudflare Pages` run `33188398595` = `success`。
- 线上回归：`/`、`/method`、`/test`、`/sitemap.xml`、`/data/platforms.json` 均 HTTP 200；B.AI 对 `https://api-spotlight.pages.dev` 返回 CORS `Access-Control-Allow-Origin: *`，Authorization 预检 OPTIONS = 204。
- 当前状态：Gateway / Relay Probe = DEPLOYED；Quick Test = PASS（直连协议）；Evidence Report = PASS；Security Gate = PASS（静态检查 + CORS 预检；未在浏览器 UI 输入真实 Key）；Production = DEPLOYED；Deployment = SUCCESS；Git Commit/Push = COMPLETE；Phase 6 = NOT STARTED。
- Key 后续动作：请立即在 B.AI 控制台删除本次临时 Key；APISpotlight 未保存该 Key。
