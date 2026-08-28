// Commercial Hub 独立部署，仅导航互连；本站不读取其数据
const COMMERCIAL_HUB = "https://api-spotlight-commercial.pages.dev/";

export default function Footer() {
  return (
    <footer className="border-t border-foreground/10">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-6 text-foreground/60">
        <p>
          本站为中立评测导航，不直接提供任何支付结算与 API 服务；榜单涉及平台仅供参考，
          一切以各平台官方信息为准。
        </p>
        <p>
          本站为 100% 独立第三方开源监控，不含任何商业返利链接。所有品牌商标归原公司所有，
          所列福利均为各平台官方公开信息。收录与排序不受任何商业合作影响，指标均来自公开可测数据。
        </p>
        <p>
          需要第三方 API 服务与商业方案？可访问独立运营的{" "}
          <a
            href={COMMERCIAL_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
          >
            APISpotlight Commercial Hub ↗
          </a>
          （商业内容与本站评测数据相互独立）。
        </p>
        <p>
          <span className="font-medium text-foreground/70">Business &amp; Partnerships：</span>{" "}
          <a
            href="mailto:OPS1985OS@protonmail.com"
            className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
          >
            OPS1985OS@protonmail.com
          </a>{" "}
          <span>（仅用于商业合作、数据合作及商务联系，不提供终端用户技术支持。）</span>
        </p>
        <p className="font-mono">
          © 2026 APISpotlight (API 探照灯) · 纯静态部署 · 无用户数据收集 · 社区：Telegram · QQ
        </p>
      </div>
    </footer>
  );
}
