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

# 双语结构（i18n）

- 语种与路由：**英文是默认语种、直接占根路径**（`/`、`/method`…），中文在 `/zh/**`。实现为两个路由组各自的根布局：`src/app/(en)/**` 与 `src/app/(zh)/zh/**`。
  **不要改成 `app/[locale]/`**：静态导出下根路径 `/` 不会生成，站点根会 404（实测；`[[...locale]]` 也会被框架拒绝）。详见 `docs/i18n.md`。
- 页面主体在 `src/views/*.tsx`（接收 `locale` prop），`src/app/**` 下的路由文件只负责 `generateStaticParams` + `generateMetadata` + 传 locale。
- UI 文案：`src/locales/{en,zh}.json`，用 `getDictionary(locale)` 取用。两个文件的键结构必须一致（TS 会检查 `Record<Locale, Dictionary>`）。
- 数据译文：`src/data/i18n/en.json`（覆盖层，按 id/slug 索引，缺项自动回退中文基线）。
  **禁止把译文写进 `src/data/*.json`**：那是 Contract v1 冻结文件，且 platforms / perks / authenticity 会被探测脚本整体重写，译文会被覆盖。
- 站内链接一律走 `localePath(locale, path)`（`src/lib/i18n.ts`）；数据里出现的站内路径用 `localizeHref`；canonical / hreflang 统一由 `src/lib/seo.ts` 的 `pageMetadata` 生成（绝对 URL、无尾斜杠）。
- 新增或改了数据后：跑 `npm run i18n:check` 看漏译，跑 `npm run verify:site` 检查内链/canonical/hreflang 与英文页中文残留。
