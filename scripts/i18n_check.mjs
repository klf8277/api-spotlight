// 英文覆盖层体检：src/data/i18n/en.json 是否覆盖全部基线条目、数组是否对齐、有无中英混排。
// 用法：npm run i18n:check
// 只读校验，不写回；采集器新增平台后跑一次即可发现漏译（缺项会回退中文基线，不会报错）。
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("src/data");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const hasCjk = (v) => /[\u4e00-\u9fff]/.test(JSON.stringify(v) ?? "");

const overlay = readJson(resolve(SRC, "i18n/en.json"));
const base = {
  platforms: readJson(resolve(SRC, "platforms.json")),
  platformContent: readJson(resolve(SRC, "platform-content.json")),
  freeTiers: readJson(resolve(SRC, "free-tiers.json")),
  resources: readJson(resolve(SRC, "resources.json")),
  perks: readJson(resolve(SRC, "perks.json")),
};
const reports = readJson(resolve(SRC, "authenticity.json")).reports;

const keyOf = { platforms: "id", platformContent: "slug", freeTiers: "slug", resources: "slug", perks: "id" };
const allowed = {
  platforms: ["name", "tags", "payment_methods"],
  platformContent: ["short_description", "capabilities", "free_tier_summary", "free_limits", "credit_card", "signup", "restrictions", "recommended_use_cases"],
  freeTiers: ["provider", "api_service", "free_amount", "unit", "reset_period", "rate_limits", "credit_card", "signup", "expiration", "restrictions", "source_type"],
  resources: ["name", "category", "description", "free_summary"],
  perks: ["name", "provider", "content", "requirement", "expires_at", "tag"],
};

const problems = [];
const summary = [];

for (const [section, items] of Object.entries(base)) {
  const keys = new Set(items.map((item) => item[keyOf[section]]));
  const patch = overlay[section] ?? {};
  const missing = [...keys].filter((k) => !(k in patch));
  const extra = Object.keys(patch).filter((k) => !keys.has(k));
  const fieldMissing = [];
  for (const item of items) {
    const entry = patch[item[keyOf[section]]];
    if (!entry) continue;
    for (const field of Object.keys(entry)) {
      if (!allowed[section].includes(field)) problems.push(`${section}.${item[keyOf[section]]}: 越界字段 ${field}`);
      if (Array.isArray(entry[field]) && Array.isArray(item[field]) && entry[field].length !== item[field].length) {
        problems.push(`${section}.${item[keyOf[section]]}.${field}: 数组长度 ${entry[field].length} ≠ 基线 ${item[field].length}`);
      }
      if (hasCjk(entry[field])) problems.push(`${section}.${item[keyOf[section]]}.${field}: 译文仍含中文字符`);
    }
  }
  if (missing.length) fieldMissing.push(...missing.map((k) => `${section}.${k} 未翻译（页面会回退中文）`));
  if (extra.length) problems.push(`${section}: 出现基线不存在的键 ${extra.join(", ")}`);
  summary.push(`${section}: ${keys.size - missing.length}/${keys.size} 已翻译`);
  problems.push(...fieldMissing);
}

const reportIds = new Set(reports.map((r) => r.platform_id));
for (const id of Object.keys(overlay.authenticity ?? {})) {
  if (!reportIds.has(id)) problems.push(`authenticity: 基线不存在 platform_id ${id}`);
  const note = overlay.authenticity[id]?.note;
  if (note && hasCjk(note)) problems.push(`authenticity.${id}.note: 译文仍含中文字符`);
}
summary.push(`authenticity: ${reportIds.size - [...reportIds].filter((id) => !(id in (overlay.authenticity ?? {}))).length}/${reportIds.size} 已翻译`);

console.log("i18n 覆盖层体检：" + summary.join(" · "));
if (problems.length) {
  console.log(`\n发现 ${problems.length} 处需要处理的项：`);
  for (const p of problems) console.log("  - " + p);
  process.exit(0);
}
console.log("✓ 覆盖完整、字段合规、无中英混排。");
