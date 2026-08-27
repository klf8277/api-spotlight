// 构建前把 src/data/*.json 快照到 public/data/，对外提供 /data/*.json 只读 JSON API。
// 注：public/data/ 已 gitignore，内容以构建为准（跑 --apply 后 build 即同步）。
// Contract v1：除 3 个数据快照外，额外生成 trends.json（公开历史趋势视图）与
// contract.json（信封：schema_version / generated_at / source_commit / 各文件计数）。
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const SRC = resolve("src/data");
const DST = resolve("public/data");
const FILES = ["platforms.json", "perks.json", "authenticity.json"];
const SCHEMA_VERSION = "1.0";
const TREND_DAYS = 30; // 与 scripts/history_update.py 的历史封顶保持一致

mkdirSync(DST, { recursive: true });
for (const f of FILES) {
  const s = resolve(SRC, f);
  if (existsSync(s)) cpSync(s, resolve(DST, f));
}

const read = (name) => JSON.parse(readFileSync(resolve(SRC, name), "utf8"));
const now = new Date().toISOString();
const sourceCommit = (() => {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
})();

// trends.json：从 history.json 最小转换（结构 1:1，仅加公开契约信封头）
const history = read("history.json");
const trends = {
  schema_version: SCHEMA_VERSION,
  source: "src/data/history.json",
  period_days: TREND_DAYS,
  generated_at: now,
  entries: history.entries,
};
writeFileSync(resolve(DST, "trends.json"), JSON.stringify(trends, null, 2) + "\n");

// contract.json：公开数据契约信封（权威 schema_version 声明）
const platforms = read("platforms.json");
const perks = read("perks.json");
const auth = read("authenticity.json");
const contract = {
  schema_version: SCHEMA_VERSION,
  generated_at: now,
  source_commit: sourceCommit,
  files: {
    "platforms.json": { schema_version: SCHEMA_VERSION, count: platforms.length },
    "perks.json": { schema_version: SCHEMA_VERSION, count: perks.length },
    "authenticity.json": {
      schema_version: SCHEMA_VERSION,
      profiles: auth.profiles.length,
      reports: (auth.reports || []).length,
    },
    "trends.json": {
      schema_version: SCHEMA_VERSION,
      entries: trends.entries.length,
      period_days: TREND_DAYS,
    },
  },
};
writeFileSync(resolve(DST, "contract.json"), JSON.stringify(contract, null, 2) + "\n");

console.log(
  "✓ public JSON data snapshot synced:",
  [...FILES, "trends.json", "contract.json"].join(", ")
);
