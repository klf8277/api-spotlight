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

`platforms.json`：`id / name / url / affiliate_url / status / latency_ms / success_rate / supported_models / is_featured / tags / test_endpoint / api_key_env / last_checked`

`perks.json`：`id / name / provider / content / requirement / link / expires_at / tag / is_hot`

⚠️ 当前全部为**示例占位数据**（域名指向 example.com），正式运营前请替换为真实站点并逐个校准 `test_endpoint`。

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

本站为中立评测导航，不直接提供任何支付结算与 API 服务；榜单中「推广」链接（affiliate）仅作为利益披露标注，收录与排序不受推广合作影响。
