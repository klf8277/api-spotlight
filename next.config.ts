import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态导出：构建产物输出到 out/，适配 Vercel 与 Cloudflare Pages
  output: "export",
  // 静态导出模式不支持默认图片优化，统一走非优化路径
  images: { unoptimized: true },
};

export default nextConfig;
