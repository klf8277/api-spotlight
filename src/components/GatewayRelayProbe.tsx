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
import { getDictionary, template, type Dictionary, type Locale } from "@/lib/i18n";

function formatMs(value: number | null, notMeasurable: string): string {
  return value === null ? notMeasurable : `${(value / 1000).toFixed(2)} s`;
}

function resultCopyOf(dictionary: Dictionary): Record<ProbeResultStatus, { label: string; title: string; detail: string }> {
  return {
    VERIFIED_BY_TEST: {
      label: dictionary.probe.verifiedByTest,
      title: dictionary.probe.verifiedByTestTitle,
      detail: dictionary.probe.verifiedByTestDetail,
    },
    INCONCLUSIVE: {
      label: dictionary.probe.inconclusive,
      title: dictionary.probe.inconclusiveTitle,
      detail: dictionary.probe.inconclusiveDetail,
    },
    NOT_VERIFIED: {
      label: dictionary.probe.notVerified,
      title: dictionary.probe.notVerifiedTitle,
      detail: dictionary.probe.notVerifiedDetail,
    },
  };
}

function confidenceCopyOf(dictionary: Dictionary): Record<TestConfidence, { detail: string }> {
  return {
    HIGH: { detail: dictionary.probe.confidenceHigh },
    MEDIUM: { detail: dictionary.probe.confidenceMedium },
    LOW: { detail: dictionary.probe.confidenceLow },
  };
}

function errorExplanation(error: ProbeError, dictionary: Dictionary): string {
  if (error.status === 401) return dictionary.probe.err401;
  if (error.status === 403) return dictionary.probe.err403;
  if (error.category === "Network" && /timed out|timeout/i.test(error.message)) return dictionary.probe.errTimeout;
  if (error.category === "Network") return dictionary.probe.errNetwork;
  if (error.category === "Quota") return dictionary.probe.errQuota;
  if (error.category === "Endpoint") return dictionary.probe.errEndpoint;
  return dictionary.probe.errOther;
}

/**
 * 导出报告固定用英文：与 JSON 载荷（gateway-probe.ts 的英文 reason）保持一致，
 * 使复制的证据文件在任何语种下都是同一份可比对的产物。
 */
function reportMarkdown(report: ProbeReport): string {
  const dictionary = getDictionary("en");
  const results = resultCopyOf(dictionary);
  const confidences = confidenceCopyOf(dictionary);
  const notMeasurable = dictionary.probe.notMeasurable;
  const errors = report.errors.length
    ? report.errors.map((error) => `- ${error.category}: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`).join("\n")
    : "- None";
  const observedModels = report.responseConsistency.observedModels.length
    ? report.responseConsistency.observedModels.join(", ")
    : "Unavailable";
  return `# APISpotlight Gateway Probe Report

## Test Result

- Status: ${results[report.resultStatus].label}
- Confidence: ${report.confidence}
- Status meaning: ${results[report.resultStatus].detail}
- Confidence meaning: ${confidences[report.confidence].detail}
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
- TTFT: ${formatMs(report.ttftMs, notMeasurable)}
- Total latency: ${formatMs(report.totalLatencyMs, notMeasurable)}
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

function ErrorList({ errors, locale }: { errors: ProbeError[]; locale: Locale }) {
  const dictionary = getDictionary(locale);
  if (!errors.length) return null;
  return (
    <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <h3 className="font-semibold text-red-700 dark:text-red-300">{dictionary.probe.needAttention}</h3>
      <ul className="mt-3 space-y-3 text-foreground/75">
        {errors.map((error, index) => (
          <li key={`${error.category}-${index}`}>
            <div>
              <span className="font-medium">{error.category}{locale === "zh" ? "：" : ": "}</span>
              {error.message}
              {error.status ? ` (HTTP ${error.status})` : ""}
            </div>
            <p className="mt-1 text-xs leading-5 text-foreground/60">{errorExplanation(error, dictionary)}</p>
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

function ReportView({
  report,
  onRunAgain,
  locale,
}: {
  report: ProbeReport;
  onRunAgain: () => void;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);
  const probe = dictionary.probe;
  const json = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdown = useMemo(() => reportMarkdown(report), [report]);
  const result = resultCopyOf(dictionary)[report.resultStatus];
  const resultTone = report.resultStatus === "VERIFIED_BY_TEST"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : report.resultStatus === "INCONCLUSIVE"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
  const observedModels = report.responseConsistency.observedModels.length
    ? report.responseConsistency.observedModels.join(" / ")
    : probe.unavailable;
  const verifiedItems = [
    report.successCount > 0 ? probe.verifiedItemAtLeastOne : probe.verifiedItemNone,
    template(report.successCount === report.requestCount && report.requestCount > 0 ? probe.verifiedItemAllOk : probe.verifiedItemPartial, {
      success: report.successCount,
      total: report.requestCount,
    }),
    report.streaming === "pass" ? probe.verifiedItemStreamingPass : probe.verifiedItemStreamingFail,
    report.ttftMs !== null ? probe.verifiedItemTtftMeasured : probe.verifiedItemTtftMissing,
  ];
  return (
    <section className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{probe.resultEyebrow}</p>
          <h2 className="mt-1 text-xl font-bold">{probe.resultTitle}</h2>
          <p className="mt-1 text-sm text-foreground/60">{template(probe.observedAt, { time: new Date(report.testedAt).toLocaleString() })}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 font-semibold ${resultTone}`}>{result.label}</span>
          <span className="rounded-full border border-foreground/10 px-3 py-1 text-foreground/60">{template(probe.confidenceBadge, { value: report.confidence })}</span>
          <span className="rounded-full border border-foreground/10 px-3 py-1 text-foreground/60">{template(probe.attemptBadge, { value: report.attemptNumber })}</span>
        </div>
      </div>

      <div className={`mt-5 rounded-xl border p-4 ${resultTone}`}>
        <p className="font-semibold">{result.title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/70">{result.detail}</p>
        <p className="mt-2 text-xs leading-5 text-foreground/55">{probe.confidenceNote}</p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [probe.metricEndpoint, report.errors.some((error) => error.category === "Network") ? probe.stateNeedsReview : report.successCount > 0 ? probe.stateResponded : probe.stateNotVerified],
          [probe.metricAuthentication, report.errors.some((error) => error.category === "Authentication") ? probe.stateFailed : report.successCount > 0 ? probe.stateObserved : probe.stateNotVerified],
          [probe.metricModelResponse, report.successCount === report.requestCount && report.requestCount > 0 ? probe.stateVerified : probe.stateIncomplete],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-foreground/10 p-4">
            <dt className="text-xs text-foreground/55">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={probe.metricModel} value={report.model} />
        <Metric label={probe.metricTtft} value={formatMs(report.ttftMs, probe.notMeasurable)} />
        <Metric label={probe.metricTotalLatency} value={formatMs(report.totalLatencyMs, probe.notMeasurable)} />
        <Metric label={probe.metricPrimaryCalls} value={`${report.successCount}/${report.requestCount}`} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Metric label={probe.metricStreaming} value={report.streaming === "pass" ? probe.streamingSuccess : probe.streamingNotVerified} />
        <Metric label={probe.metricProbeVersion} value={`${report.probeVersion} · ${report.probeFamily}`} />
      </div>

      <div className={`mt-6 rounded-xl border p-4 ${report.responseConsistency.status === "INCONCLUSIVE" ? "border-amber-500/35 bg-amber-500/5" : "border-foreground/10"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">{probe.responseConsistency}</p>
        <p className="mt-2 font-semibold">{report.responseConsistency.status === "CONSISTENT" ? probe.consistent : probe.inconclusive}</p>
        <p className="mt-2 text-sm leading-6 text-foreground/75">{report.responseConsistency.reason ?? probe.noModelDeclarations}</p>
        <p className="mt-3 text-xs leading-5 text-foreground/55">{template(probe.requestedObserved, { requested: report.responseConsistency.requestedModel, observed: observedModels })}</p>
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">{probe.observedResponse}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{report.observedResponse ?? probe.unavailable}</p>
        <p className="mt-3 text-xs text-foreground/50">{template(probe.responseModelDeclaration, { value: report.observedResponseModel ?? probe.unavailable })}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-foreground/10 p-4">
          <h3 className="font-semibold">{probe.verifiedItemsTitle}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/70">
            {verifiedItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-foreground/10 p-4">
          <h3 className="font-semibold">{probe.notProvenTitle}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/70">
            <li>{probe.notProvenPermanent}</li>
            <li>{probe.notProvenHonesty}</li>
            <li>{probe.notProvenTimeout}</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 bg-background/40 p-4">
        <h3 className="font-semibold">{probe.aboutTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">{probe.aboutBody1}</p>
        <p className="mt-2 text-sm leading-6 text-foreground/70">{probe.aboutBody2}</p>
        <p className="mt-3 text-xs text-foreground/50">{template(probe.aboutConfidence, { value: confidenceCopyOf(dictionary)[report.confidence].detail })}</p>
      </div>

      <ErrorList errors={report.errors} locale={locale} />

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => void navigator.clipboard.writeText(markdown)} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">{probe.copyReport}</button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.json", json, "application/json")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">{probe.exportJson}</button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.md", markdown, "text/markdown")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">{probe.exportMarkdown}</button>
        <button type="button" onClick={onRunAgain} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">{probe.rerun}</button>
      </div>
      <p className="mt-4 text-xs leading-5 text-foreground/50">{probe.rerunNote}</p>
    </section>
  );
}

export default function GatewayRelayProbe({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const probe = dictionary.probe;
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
      setStatus(discovered.length ? template(probe.discovered, { count: discovered.length }) : probe.noModels);
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
        throw new ProbeRequestError("User Input", probe.selectModelFirst);
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
      setStatus(resultCopyOf(dictionary)[resultStatus].title);
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
        <strong>{probe.authorizedNoticeTitle}</strong> {probe.authorizedNoticeBody}
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-endpoint">
          {probe.baseUrlLabel}
          <input id="gateway-endpoint" value={endpointInput} onChange={(event) => setEndpointInput(event.target.value)} placeholder="https://example.com/v1" autoComplete="off" spellCheck={false} className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">{probe.baseUrlHelp}</span>
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-api-key">
          {probe.apiKeyLabel} <span className="font-normal text-foreground/50">{probe.apiKeyOptional}</span>
          <input id="gateway-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={probe.apiKeyPlaceholder} autoComplete="off" className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">{probe.apiKeyHelp}</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void discover()} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
          {busy === "discover" ? probe.discovering : probe.discover}
        </button>
        <button type="button" onClick={() => { setModels([]); setSelectedModel(""); setStatus(null); setErrors([]); setReport(null); setAttemptNumber(0); clearSensitiveState(); }} disabled={busy !== null} className="rounded-lg border border-foreground/15 px-4 py-3 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50">{probe.clear}</button>
      </div>

      {status && <p className="mt-4 text-sm text-foreground/70" aria-live="polite">{status}</p>}
      <ErrorList errors={errors} locale={locale} />

      {models.length > 0 && (
        <div className="mt-6 rounded-xl border border-foreground/10 p-4">
          <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-model">
            {probe.modelLabel}
            <select id="gateway-model" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="rounded-lg border border-foreground/15 bg-background px-3 py-3 font-normal outline-none focus:border-emerald-500">
              {models.map((model) => <option key={model.id} value={model.id}>{model.id}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void quickTest()} disabled={busy !== null || !selectedModel} className="mt-4 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "test" ? probe.quickTestRunning : probe.quickTest}
          </button>
        </div>
      )}

      {report && <ReportView report={report} onRunAgain={() => void quickTest()} locale={locale} />}

      <p className="mt-6 text-xs leading-5 text-foreground/50">{probe.footerNote}</p>
    </section>
  );
}
