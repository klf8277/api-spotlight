# 参与贡献（CONTRIBUTING）

> APISpotlight 是**完全中立 · 无利益相关 · Zero Affiliate**的第三方开源评测导航。
> 欢迎通过 GitHub Issue / PR 参与（异步协作，无即时回复压力）。

## 项目铁律（所有 PR 必须遵守）

1. **零返利**：任何形式的 affiliate/返利/赞助位数据不得进入仓库；
2. **零造假**：指标只来自脚本实测（`ping_test.py` / `authenticity_test.py`），禁止手填/美化；
3. **不收录自有业务**：不与本站运营方存在利益关系的平台才会被收录（官方原厂优先）；
4. **Key 安全**：任何 API Key 只允许存在于环境变量；**PR 中出现 Key 会被直接拒绝**；
5. **未校准不判定**：真实性抽查参考值未校准前，一律显示「未校准」，绝不臆断。

## 可贡献的方向

| 方向 | 步骤 |
|---|---|
| 新增/修订平台 | 编辑 `src/data/platforms.json`（schema 见 `src/types.ts`）→ `python scripts/ping_test.py` 验证 > `npm run build` → 提交 |
| 新增官方福利 | 编辑 `src/data/perks.json`（字段含 `verified_at` = 你的核验日期） |
| 测试方法论改进 | `scripts/*.py` 的 PR，请附上 dry-run 输出 |
| 文档/翻译 | README / 方法论页 |

## 提交流程

1. fork → 分支 → 修改 → 本地验证（`npm run build` 通过、无 Key 泄露）；
2. PR 描述注明：改动目的、数据来源（官方页面链接）、验证方式；
3. 一个 PR 只做一件事；committite 采用 conventional commits（如 `data: ...` / `fix: ...`）。

## 数据口径（与页面「测试方法论」一致）

- 延迟 = 每站 3 次采样中位数；成功率 = 状态码 < 500 且非 404 的比例；401/403 视为可达（未配 Key）；
- 节点：中国内地本机 + GitHub Actions Runner（海外），均为观察值，非官方保证。
