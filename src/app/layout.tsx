import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://api-spotlight.pages.dev"),
  title: "APISpotlight · API 探照灯",
  description:
    "APISpotlight (API 探照灯) · 全网 AI 接口公正评测与福利导航 · 定期实测、数据透明 · 纯静态零数据库",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://api-spotlight.pages.dev/",
    title: "APISpotlight · API 探照灯",
    description: "公开、可复现的 AI API 延迟、可用性与真实性数据。",
    siteName: "APISpotlight",
    locale: "zh_CN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 首屏前置主题脚本：读 localStorage（回退系统偏好），避免暗色模式闪白（FOUC）
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
