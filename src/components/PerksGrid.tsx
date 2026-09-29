import type { Perk } from "@/types";
import { getDictionary, template, type Locale } from "@/lib/i18n";

export default function PerksGrid({ locale, perks }: { locale: Locale; perks: Perk[] }) {
  const dictionary = getDictionary(locale);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {perks.map((p) => (
        <article
          key={p.id}
          className="relative flex flex-col rounded-xl border border-foreground/10 p-3.5 sm:p-4"
        >
          {p.is_hot && (
            <span className="absolute right-3 top-3 rounded-full bg-orange-500/90 px-2 py-0.5 text-xs font-semibold text-white">
              {dictionary.perks.hot}
            </span>
          )}
          <h3 className="pr-14 font-semibold">{p.name}</h3>
          <p className="mt-1 text-xs text-foreground/50">{p.provider}</p>
          <p className="mt-3 flex-1 text-sm leading-6 text-foreground/80">
            {p.content}
          </p>
          {p.requirement && (
            <p className="mt-3 text-xs text-foreground/50">{template(dictionary.perks.condition, { value: p.requirement })}</p>
          )}
          {p.expires_at && (
            <p className="mt-1 text-xs text-foreground/50">{template(dictionary.perks.validUntil, { value: p.expires_at })}</p>
          )}
          {p.verified_at && (
            <p className="mt-1 text-xs text-foreground/50">{template(dictionary.perks.lastVerified, { value: p.verified_at })}</p>
          )}
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 inline-flex justify-center rounded-md border border-foreground/10 py-1.5 text-sm font-medium hover:bg-foreground/5"
          >
            {dictionary.perks.claim}
          </a>
        </article>
      ))}
    </div>
  );
}
