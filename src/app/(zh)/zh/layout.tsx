import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "../../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { getDictionary, htmlLang } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";

const dictionary = getDictionary("zh");

export const metadata: Metadata = siteMetadata("zh", dictionary.seo.homeTitle, dictionary.seo.homeDescription);

// 首屏前置主题脚本：读 localStorage（回退系统偏好），避免暗色模式闪白（FOUC）
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

// Cloudflare Web Analytics 官方 beacon；仅提供匿名站点级统计，不建立用户级追踪。
const webAnalyticsBeacon = "{\"token\":\"ab3899cad42840348bdc60b166c0a4af\"}";

export default function ZhRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={htmlLang("zh")} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={webAnalyticsBeacon}
        />
        <Header locale="zh" />
        <main className="flex-1">{children}</main>
        <Footer locale="zh" />
        <BackToTop />
      </body>
    </html>
  );
}
