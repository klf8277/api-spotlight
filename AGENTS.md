<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project context

- 全静态站点：`next.config.ts` 已配置 `output: 'export'`，产物在 `out/`；禁止引入服务端能力 / 数据库（无 Prisma / PostgreSQL / MongoDB）。
- 内容数据全部来自 `src/data/*.json`（platforms.json / perks.json）；改内容只改 JSON，改后需重新 `npm run build`。
- 任何 API Key 只允许存在于环境变量或 `.env.local`（数据文件中仅存变量名字符串），禁止写入源码 / JSON / 静态产物。
- `scripts/ping_test.py` 是唯一数据刷新入口，写回需显式 `--apply`（默认只读，防误写）。
