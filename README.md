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
npm run build                        # 写回后必须重新构建才能生效
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

## 数据结构（schema 见 src/types.ts）

`platforms.json`：`id / name / url / api_base / affiliate_url(已废弃,恒 null) / status / latency_ms / success_rate / supported_models / is_featured / tags / test_endpoint / api_key_env / last_checked`（`api_base` 用于官网 ≠ API 域的探测，不填则回退 `url`）

`perks.json`：`id / name / provider / content / requirement / link / expires_at / tag / is_hot`

✅ 当前为 **27 家公开 API 服务商 / 大厂平台**（海外原生：OpenAI、Anthropic、Google Gemini、xAI、Cohere、Groq、Mistral；国内主流：DeepSeek、SiliconFlow、Moonshot、智谱、阿里百炼、百度千帆、火山方舟、腾讯混元、MiniMax、阶跃星辰；聚合/生态：OpenRouter、Together AI、Fireworks AI、Novita AI、Perplexity、NVIDIA NIM、Hugging Face、Cerebras、DeepInfra、SambaNova），全部纯净官网直链、零返利参数；`status` / `latency_ms` / `success_rate` / `last_checked` 由 `ping_test.py` 实测写回。

## 部署

| 平台 | 设置 |
|---|---|
| Vercel | Framework = Next.js（识别 `output: 'export'` 自动静态化） |
| Cloudflare Pages | Build command `npm run build` · Output `out/` · Node 20+ |

## 目录结构

```text
/
├── src/
│   ├── app/              # page.tsx（首页）/ test/page.tsx（在线测试区）
│   ├── components/       # Header Hero RankingTable PerksGrid Footer ThemeToggle
│   ├── data/             # platforms.json perks.json
│   └── types.ts          # 数据模型
├── public/               # 静态资源
├── scripts/ping_test.py  # 接口实测脚本
└── next.config.ts        # output: 'export'
```

## 免责声明

本站为中立评测导航，不直接提供任何支付结算与 API 服务。本站为 100% 独立开源评测，不包含任何商业返利链接（Zero Affiliate Links），收录与排序不受任何商业合作影响，指标均来自公开可测数据。
