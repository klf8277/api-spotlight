import Link from "next/link";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";

export default function MethodView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{dictionary.method.title}</h1>
      <p className="mt-3 text-sm leading-7 text-foreground/70">{dictionary.method.lead}</p>
      <div className="mt-8 space-y-8">
        {dictionary.method.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-semibold">{section.title}</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-foreground/70">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Link
        href={localePath(locale, "/")}
        className="mt-10 inline-block rounded-lg border border-foreground/10 px-4 py-2 text-sm hover:bg-foreground/5"
      >
        {dictionary.common.backToHome}
      </Link>
    </div>
  );
}
