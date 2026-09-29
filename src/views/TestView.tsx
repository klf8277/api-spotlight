import GatewayRelayProbe from "@/components/GatewayRelayProbe";
import { getDictionary, type Locale } from "@/lib/i18n";

/**
 * 第三方真实性检测工具：本站只做介绍与外链，不集成、不镜像、不运行其代码或其基准数据。
 * 该项目的许可证为 PolyForm Noncommercial 1.0.0（仅限非商业用途），
 * 故页面上必须同时给出许可证与版权声明（见 THIRD_PARTY_NOTICES 的 Required Notice 格式）。
 */
const MEOW_REPO = "https://github.com/chen-006/meow-llm-detector";

export default function TestView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const tool = dictionary.thirdPartyTools;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <h1 className="text-3xl font-bold">{dictionary.test.title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">{dictionary.test.lead}</p>
      <GatewayRelayProbe locale={locale} />

      <section className="mt-10 rounded-2xl border border-foreground/10 p-5 sm:p-6" aria-labelledby="third-party-title">
        <p className="font-mono text-xs uppercase tracking-widest text-foreground/45">{tool.kicker}</p>
        <h2 id="third-party-title" className="mt-2 text-xl font-bold">{tool.title}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/70">{tool.lead}</p>
        <div className="mt-4 rounded-xl border border-foreground/10 p-4">
          <p className="font-semibold">{tool.toolName}</p>
          <p className="mt-2 text-sm leading-6 text-foreground/70">{tool.toolBody}</p>
          <dl className="mt-3 space-y-1 text-xs leading-5 text-foreground/55">
            <div>
              <dt className="inline font-medium text-foreground/70">{tool.licenseLabel} </dt>
              <dd className="inline">{tool.license}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground/70">{tool.creditLabel} </dt>
              <dd className="inline">{tool.credit}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-foreground/50">{tool.independence}</p>
          <a
            className="mt-4 inline-flex rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5"
            href={MEOW_REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tool.link}
          </a>
        </div>
      </section>
    </div>
  );
}
