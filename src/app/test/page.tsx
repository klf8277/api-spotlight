import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "在线测试区 · APISpotlight",
  description:
    "在线测试区说明：浏览器直连测试受 CORS 限制，请使用本地 scripts/ping_test.py。",
};

export default function TestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">🧪 在线测试区</h1>
      <p className="mt-3 text-sm leading-7 text-foreground/70">
        浏览器直连中转站 API 会受「跨域 (CORS)」限制，且把测试 Key 暴露给访客并不安全。
        因此本站实测在本地执行：scripts/ping_test.py 读取 src/data/platforms.json，
        对每站配置的 test_endpoint 采样，计算延迟中位数与成功率，结果可写回数据文件。
      </p>
      <pre className="mt-6 overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 text-xs leading-6">
        {`# 仅实测并打印结果（默认，不写回）
python scripts/ping_test.py

# 实测并写回 src/data/platforms.json（原子替换 + .bak 备份）
python scripts/ping_test.py --apply

# 调整采样参数：3 次采样、10s 超时、8 并发
python scripts/ping_test.py --samples 3 --timeout 10 --concurrency 8

# 测试 Key 通过环境变量提供（不写入任何代码 / JSON）
set SPOTLIGHT_TEST_KEY=sk-xxx && python scripts/ping_test.py`}
      </pre>
      <p className="mt-4 text-xs text-foreground/50">
        ⚠️ Key 只允许存在于环境变量；写回后需重新构建：npm run build。
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg border border-foreground/10 px-4 py-2 text-sm hover:bg-foreground/5"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
