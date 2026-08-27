# APISpotlight Public Data Contract v1

> 版本：`schema_version = "1.0"` · 生效日期：2026-08-27
> 本文件是 **Official 公开数据契约的权威规范**。任何下游（含未来 Private Commercial Hub）只能消费
> `https://api-spotlight.pages.dev/data/*.json` 公开快照 —— **不得依赖 Official 内部源码、内部文件结构或运行时接口**。
> 本规范不含任何商业信息；官方数据禁止出现商业字段（见 §5）。

## 1. 公开文件清单与信封

| 文件 | 内容 | 说明 |
|---|---|---|
| `contract.json` | 契约信封 | `schema_version` / `generated_at` / `source_commit` / 各文件 `count`（版本化入口） |
| `platforms.json` | 平台基准数据（数组） | 唯一数据源：模型列表也在其中（**不提供 models.json**，防双源漂移） |
| `perks.json` | 官方公开福利（数组） | 官方赠额/"最后验证"时间线 |
| `authenticity.json` | 真实性抽查档案与报告 | profiles + reports |
| `trends.json` | 历史趋势（公开视图） | 由 `src/data/history.json` 构建时最小转换：`entries[{date, platforms{id:{latency_ms, success_rate}}}]`，**30 天封顶**，含 `period_days` |

契约信封示例：

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-08-27T10:35:50Z",
  "source_commit": "f7b8930…",
  "files": {
    "platforms.json":    { "schema_version": "1.0", "count": 28 },
    "perks.json":        { "schema_version": "1.0", "count": 11 },
    "authenticity.json": { "schema_version": "1.0", "profiles": 6, "reports": 6 },
    "trends.json":       { "schema_version": "1.0", "entries": 2, "period_days": 30 }
  }
}
```

## 2. platforms.json（required / optional）

| 字段 | 类型 | 级别 | 备注 |
|---|---|---|---|
| `id` | string | **required** | 格式 `provider-*`，全局唯一 |
| `name` | string | **required** | 展示名 |
| `type` | `"official"` \| `"relay"` | **required** | 官方原厂 / 第三方中转 |
| `url` | string | **required** | 官网直链 |
| `api_base` | string? | optional | 探测用 API 基础地址；缺省回退 `url` |
| `affiliate_url` | null | **required 恒为 null** | Zero Affiliate 红线（字段保留兼容旧数据，值禁止非 null） |
| `status` | `online`\|`degraded`\|`offline` | **required** | 仅可来自测试脚本 |
| `latency_ms` | number\|null | **required** | 实测延迟中位数；null=无数据；仅脚本产出 |
| `success_rate` | number(0-100) | **required** | 仅脚本产出 |
| `supported_models` | string[] | **required** | 官方公开模型列表（唯一模型数据源） |
| `is_featured` | boolean? | optional | 是否推荐位 |
| `tags` | string[]? | optional | 家族/特性标签 |
| `payment_methods` | string[]? | optional | 以官网为准 |
| `cn_access` | `direct`\|`unstable`\|`blocked`? | optional | 境内视角可用性 |
| `test_endpoint` | string | **required** | 探测端点路径，默认 `/v1/models` |
| `api_key_env` | string? | optional | **环境变量名**，不是 Key 本体 |
| `last_checked` | string ISO8601 | **required** | 最近实测时间 |

## 3. perks.json（required / optional）

`id` / `name` / `provider` / `content` / `link` 为 **required**；`requirement` / `expires_at` / `tag` / `is_hot` / `verified_at`（`YYYY-MM-DD`）为 optional。`id` 唯一、`provider` 非空。

## 4. authenticity.json（required / optional）

- `profiles[]`：`platform_id` / `model` 为 **required**，`platform_id` 必须存在于 platforms.json；`chat_endpoint` / `temps` / `max_tokens` optional
- `reports[]`：`platform_id` / `model` / `verdict` / `checked_at`（ISO8601）为 **required**；`verdict ∈ {authentic, suspect, unknown, skipped, no-response}`；`samples` / `token_median` / `token_stdev_pct` / `repeat_ratio` / `self_id_seen` / `summary` / `note` optional

## 5. 隔离与红线（机器强制）

1. **禁止商业字段**：任何 `partner_*` / `sponsor_*` / `ad_*` / `promo_*` / `commercial_*` / `tracking_*` / `utm_*` / `referral_*` / `affiliate_link` 键名（前缀命中即校验失败）
2. **`affiliate_url` 恒为 null**：值非 null 即校验失败
3. **指标只由脚本产生**：校验脚本只读，永不写回；status/latency/success_rate 的值域与类型由校验兜底
4. **快照同步一致性**：`public/data/*.json` 必须与 `src/data/*.json` 逐字节一致（构建期同步）

## 6. 兼容规则（Contract Policy）

- **新增字段 = 向后兼容**：Consumer 必须容忍未知字段，`null` 字段必须按"无数据"处理（宽容读取）
- **禁止破坏性修改**：重命名/删除/改类型 = `schema_version` 升 major；新增 optional 字段 = 保持当前版本
- **schema_version 语义**：`1.0 → 1.1`（小版本，纯增量）→ 消费者无需迁移；`1.0 → 2.0`（大版本）→ 双端公告 + 至少一个发布周期过渡
- **消费方式**：只允许构建期/运行时读取上述 5 个公开 JSON；任何内部文件（`src/**`、`scripts/**`、`types.ts`）不构成契约
- **自动校验**：CI 部署闸门执行 `npm run contract:check`（`scripts/contract_validation.py`），违反即阻止部署

## 7. 生成与维护

- `trends.json` 与 `contract.json` 由 `scripts/sync_public_data.mjs` 在每次构建时重新生成（`source_commit` 记录数据对应的提交）
- `history.json`（内部 30 天封顶，含全部平台历史点）消费方如需更长历史，请以官网/自身存档为准
