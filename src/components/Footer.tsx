import { commercialHubHref, getDictionary, type Locale } from "@/lib/i18n";

// Commercial Hub 独立部署，仅导航互连；本站不读取其数据（链接按语种指向对应版本）

export default function Footer({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <footer className="border-t border-foreground/10">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-6 text-foreground/60">
        <p>{dictionary.footer.line1}</p>
        <p>{dictionary.footer.line2}</p>
        <p>
          {dictionary.footer.line3Prefix}{" "}
          <a
            href={commercialHubHref(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
          >
            APISpotlight Commercial Hub ↗
          </a>{" "}
          {dictionary.footer.line3Suffix}
        </p>
        <p className="text-foreground/50">
          {dictionary.footer.disclosure}
        </p>
        <p>
          <span className="font-medium text-foreground/70">{dictionary.footer.businessLabel}</span>{" "}
          <a
            href="mailto:OPS1985OS@protonmail.com"
            className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
          >
            OPS1985OS@protonmail.com
          </a>{" "}
          <span>{dictionary.footer.businessNote}</span>
        </p>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-xs leading-5 text-foreground/80">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {locale === "zh" ? "🛡️ 数据质量与透明度自查公告：" : "🛡️ Data Quality & Transparency Self-Audit: "}
          </span>
          <span>{dictionary.footer.transparencyNotice}</span>{" "}
          <a
            href="/data/official_sources.json"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-600 underline decoration-emerald-500/30 underline-offset-2 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {dictionary.footer.transparencyLink}
          </a>
        </div>
        <p className="font-mono">{dictionary.footer.copyright}</p>
      </div>
    </footer>
  );
}
