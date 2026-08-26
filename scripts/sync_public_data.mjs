// 构建前把 src/data/*.json 快照到 public/data/，对外提供 /data/*.json 只读 JSON API。
// 注：public/data/ 已 gitignore，内容以构建为准（跑 --apply 后 build 即同步）。
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("src/data");
const DST = resolve("public/data");
const FILES = ["platforms.json", "perks.json", "authenticity.json"];

mkdirSync(DST, { recursive: true });
for (const f of FILES) {
  const s = resolve(SRC, f);
  if (existsSync(s)) cpSync(s, resolve(DST, f));
}
console.log("✓ public JSON data snapshot synced:", FILES.join(", "));
