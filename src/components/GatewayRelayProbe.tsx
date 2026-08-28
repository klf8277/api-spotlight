"use client";

import { useMemo, useState } from "react";
import {
  assessResponseConsistency,
  createTestId,
  deriveConfidence,
  deriveResultStatus,
  discoverModels,
  errorToReport,
  GATEWAY_PROBE_VERSION,
  normalizeEndpoint,
  ProbeRequestError,
  runChat,
  runStreamingChat,
  type DiscoveredModel,
  type ProbeError,
  type ProbeReport,
  type ProbeResultStatus,
  type TestConfidence,
} from "@/lib/gateway-probe";

function formatMs(value: number | null): string {
  return value === null ? "Not measurable" : `${(value / 1000).toFixed(2)} s`;
}

const resultCopy: Record<ProbeResultStatus, { label: string; title: string; detail: string }> = {
  VERIFIED_BY_TEST: {
    label: "VERIFIED BY TEST",
    title: "本次测试已验证",
    detail: "指定请求在本次测试窗口内完成，并返回了可解析的响应。",
  },
  INCONCLUSIVE: {
    label: "INCONCLUSIVE",
    title: "结论不确定",
    detail: "部分证据已获得，但存在差异或数据不足，暂不支持更强结论。",
  },
  NOT_VERIFIED: {
    label: "NOT VERIFIED",
    title: "本次未验证",
    detail: "本次请求没有成功完成，因此不能据此断言模型不存在或永久不可用。",
  },
};

const confidenceCopy: Record<TestConfidence, { detail: string }> = {
  HIGH: { detail: "请求、流式响应、延迟和返回模型标识均完整且一致。" },
  MEDIUM: { detail: "核心请求成功，但模型标识或某项测量存在不一致/缺失。" },
  LOW: { detail: "请求超时、失败或证据不完整，当前结果不适合支持更强结论。" },
};

function errorExplanation(error: ProbeError): string {
  if (error.status === 401) {
    return "接口没有接受本次凭据。请确认已在此页面重新输入有效 Key；Key 不会从 Provider 控制台自动同步。";
  }
  if (error.status === 403) {
    return "接口拒绝了本次请求，可能与账户、套餐、模型权限或充值门槛有关；这不等于模型不存在。";
  }
  if (error.category === "Network" && /timed out|timeout/i.test(error.message)) {
    return "本次请求没有在测试时间窗口内完成。网络状况、Provider 负载、路由或临时错误都可能造成这种结果。";
  }
  if (error.category === "Network") {
    return "浏览器没有完成请求，可能与 CORS、网络连接或 Provider 临时状态有关。";
  }
  if (error.category === "Quota") {
    return "Provider 返回了限流结果；这次没有验证模型的正常可用性。";
  }
  if (error.category === "Endpoint") {
    return "请求路径未被 Endpoint 提供；请确认这是兼容 /models 与 /chat/completions 的 Base URL。";
  }
  return "该错误需要结合 HTTP 状态和 Provider 文档继续判断。";
}

function reportMarkdown(report: ProbeReport): string {
  const errors = report.errors.length
    ? report.errors.map((error) => `- ${error.category}: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`).join("\n")
    : "- None";
  const observedModels = report.responseConsistency.observedModels.length
    ? report.responseConsistency.observedModels.join(", ")
    : "Unavailable";
  return `# APISpotlight Gateway Probe Report

## Test Result

- Status: ${resultCopy[report.resultStatus].label}
- Confidence: ${report.confidence}
- Status meaning: ${resultCopy[report.resultStatus].detail}
- Confidence meaning: ${confidenceCopy[report.confidence].detail}
- Attempt: ${report.attemptNumber}
- Tested at: ${report.testedAt}
- Test ID: ${report.testId}
- Test version: ${report.testVersion}
- Probe version: ${report.probeVersion}
- Probe family: ${report.probeFamily}
- Endpoint: ${report.endpoint}
- Model: ${report.model}
- Request count: ${report.requestCount}
- Success count: ${report.successCount}
- TTFT: ${formatMs(report.ttftMs)}
- Total latency: ${formatMs(report.totalLatencyMs)}
- Streaming: ${report.streaming.toUpperCase()}

## Response consistency

- Status: ${report.responseConsistency.status}
- Requested model: ${report.responseConsistency.requestedModel}
- Observed model declarations: ${observedModels}
- Interpretation: ${report.responseConsistency.reason ?? "Unavailable"}

## Observed response

${report.observedResponse ?? "Unavailable"}

## What this test verifies

- ${report.successCount > 0 ? "At least one primary request returned a valid response." : "No primary request returned a valid response."}
- ${report.successCount === report.requestCount && report.requestCount > 0 ? "All primary requests succeeded in this test window." : "Not all primary requests succeeded in this test window."}
- ${report.streaming === "pass" ? "Streaming response completed." : "Streaming response was not verified."}
- ${report.ttftMs !== null ? "TTFT was measured." : "TTFT was not measurable from the available stream data."}

## What this test does not prove

- Permanent availability or future routing behavior
- Provider honesty or absolute model identity
- That a timeout means the model does not exist

## Errors

${errors}

> This report records what the endpoint returned during this test. Results may change as routing, providers, models, and network conditions change. Anomalous signals require repeated tests and additional evidence; this report does not certify a provider or model.
`;
}

function downloadText(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ErrorList({ errors }: { errors: ProbeError[] }) {
  if (!errors.length) return null;
  return (
    <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <h3 className="font-semibold text-red-700 dark:text-red-300">需要关注</h3>
      <ul className="mt-3 space-y-3 text-foreground/75">
        {errors.map((error, index) => (
          <li key={`${error.category}-${index}`}>
            <div>
              <span className="font-medium">{error.category}：</span>
              {error.message}
              {error.status ? `（HTTP ${error.status}）` : ""}
            </div>
            <p className="mt-1 text-xs leading-5 text-foreground/60">{errorExplanation(error)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/10 p-4">
      <p className="text-xs text-foreground/55">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}

function ReportView({ report, onRunAgain }: { report: ProbeReport; onRunAgain: () => void }) {
  const json = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdown = useMemo(() => reportMarkdown(report), [report]);
  const result = resultCopy[report.resultStatus];
  const resultTone = report.resultStatus === "VERIFIED_BY_TEST"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : report.resultStatus === "INCONCLUSIVE"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
  const observedModels = report.responseConsistency.observedModels.length
    ? report.responseConsistency.observedModels.join(" / ")
    : "Unavailable";
  const verifiedItems = [
    report.successCount > 0 ? "至少一个主请求返回了可解析响应" : "没有主请求成功返回可解析响应",
    report.successCount === report.requestCount && report.requestCount > 0 ? `${report.requestCount}/${report.requestCount} 个主请求成功` : `${report.successCount}/${report.requestCount} 个主请求成功`,
    report.streaming === "pass" ? "流式响应完成" : "流式响应未验证",
    report.ttftMs !== null ? "TTFT 已测量" : "TTFT 未能可靠测量",
  ];
  return (
    <section className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Test Result</p>
          <h2 className="mt-1 text-xl font-bold">本次观测结果</h2>
          <p className="mt-1 text-sm text-foreground/60">Observed at {new Date(report.testedAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 font-semibold ${resultTone}`}>{result.label}</span>
          <span className="rounded-full border border-foreground/10 px-3 py-1 text-foreground/60">Confidence {report.confidence}</span>
          <span className="rounded-full border border-foreground/10 px-3 py-1 text-foreground/60">Attempt {report.attemptNumber}</span>
        </div>
      </div>

      <div className={`mt-5 rounded-xl border p-4 ${resultTone}`}>
        <p className="font-semibold">{result.title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/70">{result.detail}</p>
        <p className="mt-2 text-xs leading-5 text-foreground/55">Confidence 描述的是本次测试数据的完整程度和一致性，不是模型真伪概率，也不是 Provider 信用评分。</p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Endpoint", report.errors.some((error) => error.category === "Network") ? "需复核" : report.successCount > 0 ? "已响应" : "未验证"],
          ["Authentication", report.errors.some((error) => error.category === "Authentication") ? "未通过" : report.successCount > 0 ? "已观察到" : "未验证"],
          ["Model response", report.successCount === report.requestCount && report.requestCount > 0 ? "已验证" : "未完成"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-foreground/10 p-4">
            <dt className="text-xs text-foreground/55">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Model" value={report.model} />
        <Metric label="TTFT" value={formatMs(report.ttftMs)} />
        <Metric label="Total latency" value={formatMs(report.totalLatencyMs)} />
        <Metric label="Primary calls" value={`${report.successCount}/${report.requestCount}`} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Metric label="Streaming" value={report.streaming === "pass" ? "SUCCESS" : "NOT VERIFIED"} />
        <Metric label="Probe version" value={`${report.probeVersion} · ${report.probeFamily}`} />
      </div>

      <div className={`mt-6 rounded-xl border p-4 ${report.responseConsistency.status === "INCONCLUSIVE" ? "border-amber-500/35 bg-amber-500/5" : "border-foreground/10"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">Response Consistency</p>
        <p className="mt-2 font-semibold">{report.responseConsistency.status === "CONSISTENT" ? "CONSISTENT" : "INCONCLUSIVE"}</p>
        <p className="mt-2 text-sm leading-6 text-foreground/75">{report.responseConsistency.reason ?? "没有足够的响应模型声明可供比较。"}</p>
        <p className="mt-3 text-xs leading-5 text-foreground/55">Requested: {report.responseConsistency.requestedModel} · Observed: {observedModels}</p>
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">Observed response</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{report.observedResponse ?? "Unavailable"}</p>
        <p className="mt-3 text-xs text-foreground/50">Response model declaration: {report.observedResponseModel ?? "Unavailable"}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-foreground/10 p-4">
          <h3 className="font-semibold">What this test verifies</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/70">
            {verifiedItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-foreground/10 p-4">
          <h3 className="font-semibold">What this test does not prove</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/70">
            <li>永久可用或未来路由行为</li>
            <li>Provider 是否诚实，或模型的绝对身份</li>
            <li>单次超时就等于模型不存在</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 bg-background/40 p-4">
        <h3 className="font-semibold">About this result</h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">本报告记录的是该 Endpoint 在本次测试中实际返回的结果。中转路由、上游模型、服务状态和网络条件可能变化，因此结果代表测试时刻的实际表现。</p>
        <p className="mt-2 text-sm leading-6 text-foreground/70">异常信号需要结合复测和其他证据判断；APISpotlight 不会把单次测试包装成无法证明的“永久认证”。</p>
        <p className="mt-3 text-xs text-foreground/50">Confidence: {confidenceCopy[report.confidence].detail}</p>
      </div>

      <ErrorList errors={report.errors} />

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => void navigator.clipboard.writeText(markdown)} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">复制报告</button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.json", json, "application/json")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">导出 JSON</button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.md", markdown, "text/markdown")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">导出 Markdown</button>
        <button type="button" onClick={onRunAgain} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">重新测试</button>
      </div>
      <p className="mt-4 text-xs leading-5 text-foreground/50">重新测试会发起新的低影响真实请求；需要 Key 的 Endpoint 在每次测试后都要重新输入 Key。每次结果都有独立的 Test ID 和时间戳。</p>
    </section>
  );
}

export default function GatewayRelayProbe() {
  const [endpointInput, setEndpointInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<DiscoveredModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProbeError[]>([]);
  const [report, setReport] = useState<ProbeReport | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [busy, setBusy] = useState<"discover" | "test" | null>(null);

  const clearSensitiveState = () => {
    setApiKey("");
  };

  const discover = async () => {
    setBusy("discover");
    setStatus(null);
    setErrors([]);
    setReport(null);
    setModels([]);
    setSelectedModel("");
    setAttemptNumber(0);
    try {
      const endpoint = normalizeEndpoint(endpointInput);
      const discovered = await discoverModels(endpoint, apiKey);
      setModels(discovered);
      setSelectedModel(discovered[0]?.id ?? "");
      setStatus(discovered.length ? `已发现 ${discovered.length} 个模型。请选择一个模型开始 Quick Test。` : "Endpoint 没有返回模型。");
      if (!discovered.length) {
        setErrors([{ category: "Protocol", message: "Model discovery returned an empty model list." }]);
      }
    } catch (error) {
      const mapped = errorToReport(error);
      setErrors([mapped]);
      setStatus(mapped.message);
    } finally {
      setBusy(null);
    }
  };

  const quickTest = async () => {
    setBusy("test");
    setStatus(null);
    setErrors([]);
    setReport(null);
    const testedAt = new Date().toISOString();
    const currentAttempt = attemptNumber + 1;
    setAttemptNumber(currentAttempt);
    let endpoint = "";
    let requestCount = 0;
    let successCount = 0;
    const collectedErrors: ProbeError[] = [];
    let nonStreamingResponse: Awaited<ReturnType<typeof runChat>> | null = null;
    let streamingResponse: Awaited<ReturnType<typeof runStreamingChat>> | null = null;

    try {
      endpoint = normalizeEndpoint(endpointInput);
      if (!selectedModel) {
        throw new ProbeRequestError("User Input", "请选择一个模型后再开始 Quick Test。");
      }

      requestCount += 1;
      try {
        nonStreamingResponse = await runChat(endpoint, apiKey, selectedModel);
        successCount += 1;
      } catch (error) {
        collectedErrors.push(errorToReport(error));
      }

      requestCount += 1;
      try {
        streamingResponse = await runStreamingChat(endpoint, apiKey, selectedModel);
        successCount += 1;
      } catch (error) {
        collectedErrors.push(errorToReport(error));
      }

      const responseConsistency = assessResponseConsistency(selectedModel, [nonStreamingResponse?.observedResponseModel ?? null, streamingResponse?.observedResponseModel ?? null]);
      const resultStatus = deriveResultStatus(requestCount, successCount);
      const streaming = streamingResponse ? "pass" : "fail";
      const totalLatencyMs = streamingResponse?.totalLatencyMs ?? nonStreamingResponse?.totalLatencyMs ?? null;
      const ttftMs = streamingResponse?.ttftMs ?? null;
      const confidence = deriveConfidence(resultStatus, streaming, ttftMs, totalLatencyMs, responseConsistency);
      const nextReport: ProbeReport = {
        testId: createTestId(),
        attemptNumber: currentAttempt,
        testedAt,
        endpoint,
        model: selectedModel,
        testVersion: GATEWAY_PROBE_VERSION,
        probeVersion: `Gateway Probe v${GATEWAY_PROBE_VERSION}`,
        probeFamily: "basic-connectivity",
        requestCount,
        successCount,
        ttftMs,
        totalLatencyMs,
        streaming,
        observedResponse: streamingResponse?.observedResponse ?? nonStreamingResponse?.observedResponse ?? null,
        observedResponseModel: streamingResponse?.observedResponseModel ?? nonStreamingResponse?.observedResponseModel ?? null,
        usageAvailable: nonStreamingResponse?.usageAvailable ?? false,
        resultStatus,
        confidence,
        responseConsistency,
        errors: collectedErrors,
      };
      setReport(nextReport);
      setStatus(resultCopy[resultStatus].title);
    } catch (error) {
      const mapped = errorToReport(error);
      collectedErrors.push(mapped);
      setErrors(collectedErrors);
      setStatus(mapped.message);
    } finally {
      clearSensitiveState();
      setBusy(null);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-foreground/10 p-5 sm:p-7">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6">
        <strong>Authorized Endpoint Testing only.</strong> 只测试你有权使用的 Endpoint 和 API Key。请求从当前浏览器直接发送到 Endpoint；APISpotlight 不接收、不保存你的 Key，也不会建设万能 Proxy。
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-endpoint">
          Base URL
          <input id="gateway-endpoint" value={endpointInput} onChange={(event) => setEndpointInput(event.target.value)} placeholder="https://example.com/v1" autoComplete="off" spellCheck={false} className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">仅支持 HTTPS；loopback、私有网络、metadata 和 internal hostname 会被阻止。</span>
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-api-key">
          API Key <span className="font-normal text-foreground/50">（公开 Endpoint 可选；BAI 等私有 Endpoint 通常必填）</span>
          <input id="gateway-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="粘贴一个专用的低权限测试 Key" autoComplete="off" className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">Your API key is used only from this browser to make the test request. APISpotlight does not intentionally store it；测试结束后会清除。</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void discover()} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
          {busy === "discover" ? "正在发现…" : "发现模型"}
        </button>
        <button type="button" onClick={() => { setModels([]); setSelectedModel(""); setStatus(null); setErrors([]); setReport(null); setAttemptNumber(0); clearSensitiveState(); }} disabled={busy !== null} className="rounded-lg border border-foreground/15 px-4 py-3 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50">清除</button>
      </div>

      {status && <p className="mt-4 text-sm text-foreground/70" aria-live="polite">{status}</p>}
      <ErrorList errors={errors} />

      {models.length > 0 && (
        <div className="mt-6 rounded-xl border border-foreground/10 p-4">
          <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-model">
            Model
            <select id="gateway-model" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="rounded-lg border border-foreground/15 bg-background px-3 py-3 font-normal outline-none focus:border-emerald-500">
              {models.map((model) => <option key={model.id} value={model.id}>{model.id}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void quickTest()} disabled={busy !== null || !selectedModel} className="mt-4 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "test" ? "正在测试…" : "快速测试"}
          </button>
        </div>
      )}

      {report && <ReportView report={report} onRunAgain={() => void quickTest()} />}

      <p className="mt-6 text-xs leading-5 text-foreground/50">默认 Probe 请求量小、无并发、无自动重试。CORS 或 Provider 策略可能阻止浏览器直连；本版本不会回退到 APISpotlight Proxy，也不会自动扫描第三方 Endpoint。</p>
    </section>
  );
}
