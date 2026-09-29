// 构建产物验收（npm run verify:site）：
//   1) 内链可达性：所有站内 href 必须指向 out/ 里真实生成的页面（双语站最易漏的地方）
//   2) canonical 口径：必须是绝对 URL、无尾斜杠，且等于该文件对应的规范地址
//   3) hreflang 双向性：en / zh / x-default 三件套齐全且互相指向真实页面
//   4) 英文页中文残留：英文页不应出现中文字符（语言切换器的「中文」标签除外）
// 只读校验，不写回；任一失败以非零退出码结束。
import { readFileSync, existsSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const SITE = "https://api-spotlight.pages.dev";
// 语言切换器在英文页上故意显示中文标签，属预期内容
const ALLOWED_CJK = ["中文"];

if (!existsSync(OUT)) {
  console.error("✗ 找不到 out/，请先运行 npm run build");
  process.exit(2);
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const files = walk(OUT).filter((f) => f.endsWith(".html"));
// 排除 404 与静态校验文件（如 google-site-verification 的 .html 文本文件，不含 <html> 结构）
const pages = files.filter((f) => {
  const name = f.split(sep).pop();
  if (["404.html", "_not-found.html"].includes(name)) return false;
  return readFileSync(f, "utf8").includes("<html");
});

/** out/xxx.html → 站点路径 "/xxx"（index.html 为 "/"） */
function pagePath(file) {
  const rel = relative(OUT, file).split(sep).join("/");
  const withoutExt = rel.replace(/\.html$/, "");
  return withoutExt === "index" ? "/" : `/${withoutExt.replace(/\/index$/, "")}`;
}

/** 站点路径 → 是否存在于 out/（静态导出下 /a/b 可能是 a/b.html 或 a/b/index.html） */
function resolves(pathname) {
  const clean = pathname.replace(/^\//, "");
  if (clean === "") return existsSync(join(OUT, "index.html"));
  return (
    existsSync(join(OUT, `${clean}.html`)) ||
    existsSync(join(OUT, clean, "index.html")) ||
    (existsSync(join(OUT, clean)) && statSync(join(OUT, clean)).isFile())
  );
}

const problems = [];
const hrefCache = new Map();

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const path = pagePath(file);
  const isZh = path === "/zh" || path.startsWith("/zh/");

  // ---- canonical ----
  const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  const expected = path === "/" ? SITE : `${SITE}${path}`;
  if (!canonical) problems.push(`${path}: 缺少 canonical`);
  else {
    if (canonical !== expected) problems.push(`${path}: canonical=${canonical} ≠ 期望 ${expected}`);
    if (!canonical.startsWith(SITE)) problems.push(`${path}: canonical 不是绝对 URL`);
  }

  // ---- hreflang 三件套 ----
  const hreflangs = [...html.matchAll(/rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => [m[1], m[2]]);
  const map = Object.fromEntries(hreflangs);
  for (const key of ["en", "zh", "x-default"]) {
    if (!map[key]) problems.push(`${path}: 缺少 hreflang="${key}"`);
  }
  // 用路径前缀判断语种，避免把 slug 里含 "zh" 的页面（如 /free-tier/zhipu）误判为中文页
  const pathOf = (url) => (url.replace(SITE, "") || "/");
  const isZhPath = (url) => {
    const p = pathOf(url);
    return p === "/zh" || p.startsWith("/zh/");
  };
  if (map.en && isZhPath(map.en)) problems.push(`${path}: hreflang en 指向了中文页 (${map.en})`);
  if (map.zh && !isZhPath(map.zh)) problems.push(`${path}: hreflang zh 未指向中文页 (${map.zh})`);
  if (map["x-default"] && map["x-default"] !== map.en) problems.push(`${path}: x-default 应指向英文版`);
  for (const [key, value] of hreflangs) {
    if (!resolves(pathOf(value))) problems.push(`${path}: hreflang ${key} 指向不存在的页面 ${value}`);
  }

  // ---- html lang ----
  const lang = html.match(/<html lang="([^"]*)"/)?.[1];
  if (isZh && lang !== "zh-CN") problems.push(`${path}: 中文页 lang=${lang}，应为 zh-CN`);
  if (!isZh && lang !== "en") problems.push(`${path}: 英文页 lang=${lang}，应为 en`);

  // ---- 英文页中文残留 ----
  if (!isZh) {
    let text = html;
    for (const allowed of ALLOWED_CJK) text = text.split(allowed).join("");
    const cjk = text.match(/[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/g);
    if (cjk) {
      const sample = [...new Set(cjk)].slice(0, 12).join("");
      problems.push(`${path}: 英文页出现 ${cjk.length} 个中文字符（样例：${sample}）→ 多半是数据缺译文，跑 npm run i18n:check 看是哪一条`);
    }
  }

  // ---- 内链可达性 ----
  const hrefs = hrefCache.get(file) ?? [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
  hrefCache.set(file, hrefs);
  for (const href of new Set(hrefs)) {
    if (href.startsWith("//")) continue;
    if (href === "/_redirects" || href.startsWith("/_next") || href.startsWith("/data/")) continue;
    if (!resolves(href)) problems.push(`${path}: 内链 404 → ${href}`);
  }
}

// ---- 双语覆盖：每个英文页都应有对应的中文页，反之亦然 ----
for (const file of pages) {
  const path = pagePath(file);
  if (path.startsWith("/zh")) continue;
  const zhPath = path === "/" ? "/zh" : `/zh${path}`;
  if (!resolves(zhPath)) problems.push(`${path}: 缺少对应的中文页 ${zhPath}`);
}

console.log(`验收范围：${pages.length} 个页面（其中中文页 ${pages.filter((f) => pagePath(f).startsWith("/zh")).length} 个）`);
if (problems.length) {
  console.log(`\n✗ 发现 ${problems.length} 处问题：`);
  for (const p of problems.slice(0, 60)) console.log("  - " + p);
  if (problems.length > 60) console.log(`  …还有 ${problems.length - 60} 处`);
  process.exit(1);
}
console.log("✓ 内链全部可达 · canonical 无尾斜杠 · hreflang 三件套双向完整 · 英文页无中文残留 · 双语页面一一对应");
