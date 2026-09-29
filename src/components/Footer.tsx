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
        <p className="font-mono">{dictionary.footer.copyright}</p>
      </div>
    </footer>
  );
}
