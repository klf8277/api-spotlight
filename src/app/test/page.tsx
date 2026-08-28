import type { Metadata } from "next";
import GatewayRelayProbe from "@/components/GatewayRelayProbe";

export const metadata: Metadata = {
  title: "在线测试区 · APISpotlight",
  description: "在浏览器中直接测试你有权使用的 OpenAI-compatible API Gateway 或 Relay。",
  alternates: {
    canonical: "/test/",
  },
  openGraph: {
    url: "https://api-spotlight.pages.dev/test/",
    title: "Gateway / Relay Quick Test · APISpotlight",
    description: "Authorized Endpoint 的浏览器直连 Quick Test 与证据报告。",
  },
};

export default function TestPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <h1 className="text-3xl font-bold">🧪 Test an API Endpoint</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
        用一次低影响 Quick Test 检查 Endpoint 是否可达、Key 是否被接受、模型是否可发现，以及选定模型能否完成 Chat 和 Streaming。结果只描述本次真实观测，不代表永久健康或模型身份证明。
      </p>
      <GatewayRelayProbe />
    </div>
  );
}
