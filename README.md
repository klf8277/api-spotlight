# 🔦 Api探照灯

> 全网 AI 接口公正评测与福利导航 · **定期实测 · 数据透明** · 纯静态零数据库

## 技术栈

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**
- `output: 'export'` 纯静态导出（构建产物 `out/`），适配 **Vercel** 与 **Cloudflare Pages**
- 内容全部由本地 JSON 驱动：`src/data/platforms.json`（榜单）、`src/data/perks.json`（羊毛福利）
- 暗黑 / 亮色自适应：内联主题脚本 + Tailwind class 策略，零额外依赖

## 快速开始

```bash
npm install
npm run dev          # 本地开发 http://localhost:3000

npm run build        # 静态导出 → out/
npm run preview      # python -m http.server 4173 --directory out
```

## 数据更新链路

```bash
python scripts/ping_test.py          # 实测，仅打印（默认，安全）
python scripts/ping_test.py --apply  # 实测并写回 src/data/platforms.json（原子替换 + .bak 备份）
python scripts/authenticity_test.py            # 真实性抽查（Phase 3，干跑）
python scripts/authenticity_test.py --apply    # 写回 src/data/authenticity.json（原子替换 + .bak 备份）
python scripts/history_update.py --apply       # 追加当日延迟历史基线（30 天封顶，cron 自动执行）
npm run build                                  # 写回后必须重新构建才能生效
```

- 测试 Key 仅从环境变量读取（`platforms.json` 的 `api_key_env` 字段指定变量名），禁止写入代码 / JSON。
- `.env.example` 提供变量样例；无 Key 的站点会跳过授权头仅测连通性。
- 延迟 = 每站 3 次采样中位数；成功率 = 正常响应占比（状态码 < 500 且非 404；404 说明 endpoint 配置有误，401/403 视为可达但缺 Key）。

## GitHub Actions 自动实测（Phase 2）

`.github/workflows/cron_test.yml` 每 6 小时（UTC）自动执行：

```bash
python scripts/ping_test.py --apply   # 实测并写回 platforms.json
git commit && git push                # 指标有变化时自动提交回仓库
```

仓库一次性配置（2 步）：

1. **授权写权限**：Settings → Actions → General → Workflow permissions 选择 **Read and write permissions**（否则 bot token 无法 push）。
2. **加密测试 Key**：Settings → Secrets and variables → Actions → New secret，名称 `SPOTLIGHT_TEST_KEY`（可留空——留空时脚本自动跳过鉴权头，仅测连通性）。

数据提交后，若仓库已接入 Vercel / Cloudflare Pages，会自动触发重新构建部署。需要手动触发：Actions 页 → 该工作流 → Run workflow。

**Watchman 自愈**：cron 工作流每次运行的最后一步会对比 `main` HEAD 与 `deploy_pages.yml` 最近一次运行对应的提交——若部署落后于 main（push 触发失效等情况），自动用 `GITHUB_TOKEN` 触发一次部署，最大限度保证"数据/代码 → 线上"不自断。

## 真实性抽查（Phase 3）

`scripts/authenticity_test.py`（独立方法学实现，不依赖任何第三方仓库代码）：

1. **Temperature 采样**：固定探针提示词，多温度（默认 0.3 / 0.7 / 1.3）下重复采样；
2. **特征提取**：模型自报内部标识（自 ID）、token 长度中位数、温度间漂移、重复率；
3. **指纹比对**：与 `scripts/fingerprints.json` 参考值比对 → `authentic / suspect / unknown / skipped`。

**判定铁律：参考值未校准（`calibrated: false`）一律返回 `unknown`，绝不臆断。**

- **校准方法（一条命令自动回写）**：先到**官方直连正版渠道**取 Key，运行：

  ```bash
  # Windows（官方直连 Key，示例：OpenAI 正版渠道）
  set SPOTLIGHT_TEST_KEY=sk-official-xxx
  python scripts/authenticity_test.py --provider provider-openai --samples-per-temp 4 --max-tokens 600 --calibrate
  ```

  - `--calibrate` 以本次采样为基线，**自动回写** `scripts/fingerprints.json`（`median_tokens / token_tolerance_pct / max_repeat / self_id_patterns` 并置 `calibrated: true`；原子替换 + `.bak` 备份）；
  - 建议 `--samples-per-temp 4`（2 温度 × 4 次 = 8 次采样）；成功采样不足 8 次会**拒绝回写**并提示；
  - ⚠️ **基线必须来自官方直连正版渠道**——用中转站的 Key 校准，等于把参照物架在嫌疑犯身上；
  - 校准完成后，该模型在普通抽查（不带 `--calibrate`）即可输出 `authentic / suspect / ⏳ 未校准` 判定。
- **档案位置**：`src/data/authenticity.json`（可增长；`platform_id` 关联 `platforms.json`）。
- **安全**：复用 `api_key_env` 环境变量链，Key 不落盘；响应仅存 120 字符摘要。
- **成本**：每次抽查消耗调用方 Key token（默认 2 温度 × 2 采样 × 600 token），可调低。

## 双视角可用性（🇨🇳 境内视角）

榜单在云端视角（CI/cron 实测，全球部署视角）之外，提供国内开发者最关心的维度：

- **`cn_access`**：境内直连可用性观察（🟢 境内直连 / 🟡 境内受限 / 🔴 境内不可）——基于本站本机实测记录，跨境网络存在时点差异，**非官方保证**；
- **`payment_methods`**：支付方式（支付宝 / 微信支付 / 国际信用卡 / 对公转账），公开信息整理，以官网为准；
- 悬停「🇨🇳」徽标可查看支付方式详情；后期待接入"内地 Runner 双端并测"后可实现双视角自动对比。
- **📉 历史趋势**：延迟列下的迷你曲线（纯 SVG，零依赖）由 `src/data/history.json` 驱动（`history_update.py` 每日追加，30 天封顶，原子替换 + .bak）。

## 数据结构（schema 见 src/types.ts）

`platforms.json`：`id / name / type(official=官方原厂 | relay=第三方中转) / url / api_base / affiliate_url(已废弃,恒 null) / status / latency_ms / success_rate / supported_models / is_featured / tags / payment_methods / cn_access / test_endpoint / api_key_env / last_checked`（`api_base` 用于官网 ≠ API 域的探测，不填则回退 `url`）

`perks.json`：`id / name / provider / content / requirement / link / expires_at / tag / is_hot`

✅ 当前为 **27 家公开 API 服务商 / 大厂平台**（海外原生：OpenAI、Anthropic、Google Gemini、xAI、Cohere、Groq、Mistral；国内主流：DeepSeek、SiliconFlow、Moonshot、智谱、阿里百炼、百度千帆、火山方舟、腾讯混元、MiniMax、阶跃星辰；聚合/生态：OpenRouter、Together AI、Fireworks AI、Novita AI、Perplexity、NVIDIA NIM、Hugging Face、Cerebras、DeepInfra、SambaNova），全部纯净官网直链、零返利参数；`status` / `latency_ms` / `success_rate` / `last_checked` 由 `ping_test.py` 实测写回。

📌 **模型清单口径（2026-08）**：基于官方文档/公开模型列表更新（OpenAI、Anthropic、DeepSeek、xAI 官网文档 + OpenRouter / Novita / DeepInfra 公开模型列表交叉取证），聚合平台展示其在列最新模型；一切以官网为准。

## 部署

| 平台 | 设置 |
|---|---|
| Vercel | 仓库根已附 `vercel.json`（framework=nextjs，output=out），导入仓库零配置即可；Vercel 也会自动识别 `output: 'export'` 静态化 |
| Cloudflare Pages | Build command `npm run build` · Output directory `out/` · Node 22+ |

**Cloudflare Pages 详细步骤（5 步）：**
1. 仓库推送 GitHub 后，CF 控制台 → Workers & Pages → Create → Pages → Connect to Git；
2. 选择仓库，框架预设选 **Next.js**（或 Blank）；
3. Build command 填 `npm run build`，Build output directory 填 `out`；
4. 环境变量按需添加 `SPOTLIGHT_TEST_KEY`（仅用于 CRON 实测，非页面构建必需），Node.js version 选 22；
5. 保存并部署，之后每次 push 自动触发；cron 提交的 `chore: update platform metrics` 也会自动触发新构建。

## 目录结构

```text
/
├── src/
│   ├── app/              # page.tsx（首页）/ test/page.tsx（在线测试区）
│   ├── components/       # Header Hero RankingTable PerksGrid Footer ThemeToggle
│   ├── data/             # platforms.json perks.json authenticity.json
│   └── types.ts          # 数据模型
├── public/               # 静态资源
├── scripts/ping_test.py  # 接口实测脚本（Phase 1 连通性）
├── scripts/authenticity_test.py  # 真实性抽查脚本（Phase 3）
├── scripts/fingerprints.json     # 指纹参考值库（校准点位）
├── scripts/sync_public_data.mjs  # 构建期数据快照 → /data/*.json 公开 API
├── src/app/method/       # 测试方法论页
├── LICENSE               # MIT
└── CONTRIBUTING.md       # 贡献指南
├── next.config.ts        # output: 'export'
└── vercel.json           # Vercel 部署配置（CF Pages 按 README 填参数）
```

## 开源与数据 API

- **公开 JSON API**（构建时快照，只读）：`/data/platforms.json`、`/data/perks.json`、`/data/authenticity.json`
- **许可证**：MIT（见 `LICENSE`）；贡献指南见 `CONTRIBUTING.md`（零返利 / 零造假 / Key 安全红线）
- 测试节点、采样口径、判定规则见页面「方法学」或仓库 `README` 对应章节

## 免责声明

本站为中立评测导航，不直接提供任何支付结算与 API 服务。本站为 100% 独立第三方开源监控，不含任何商业返利链接。所有品牌商标归原公司所有，所列福利均为各平台官方公开信息。收录与排序不受任何商业合作影响，指标均来自公开可测数据。
