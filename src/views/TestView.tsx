import GatewayRelayProbe from "@/components/GatewayRelayProbe";
import { getDictionary, type Locale } from "@/lib/i18n";

export default function TestView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <h1 className="text-3xl font-bold">{dictionary.test.title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">{dictionary.test.lead}</p>
      <GatewayRelayProbe locale={locale} />
    </div>
  );
}
