"use client";

import { useMemo, useState } from "react";
import {
  classifyProtocolSignal,
  createTestId,
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
} from "@/lib/gateway-probe";

function formatMs(value: number | null): string {
  return value === null ? "Unavailable" : `${(value / 1000).toFixed(2)} s`;
}

function reportMarkdown(report: ProbeReport): string {
  const errors = report.errors.length
    ? report.errors.map((error) => `- ${error.category}: ${error.message}`).join("\n")
    : "- None";
  return `# APISpotlight Gateway Probe Report

- Tested at: ${report.testedAt}
- Test version: ${report.testVersion}
- Endpoint: ${report.endpoint}
- Model: ${report.model}
- Request count: ${report.requestCount}
- Success count: ${report.successCount}
- TTFT: ${formatMs(report.ttftMs)}
- Total latency: ${formatMs(report.totalLatencyMs)}
- Streaming: ${report.streaming.toUpperCase()}
- Protocol signal: ${report.protocolSignal}
- Observed response model: ${report.observedResponseModel ?? "Unavailable"}

## Observed response

${report.observedResponse ?? "Unavailable"}

## Errors

${errors}

> Observed at the timestamp above. This report does not prove model identity or permanent endpoint health.
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
    <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <h3 className="font-semibold text-red-700 dark:text-red-300">What needs attention</h3>
      <ul className="mt-2 space-y-1 text-foreground/75">
        {errors.map((error, index) => (
          <li key={`${error.category}-${index}`}>
            <span className="font-medium">{error.category}:</span> {error.message}
            {error.status ? ` (HTTP ${error.status})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportView({ report, onRunAgain }: { report: ProbeReport; onRunAgain: () => void }) {
  const json = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdown = useMemo(() => reportMarkdown(report), [report]);
  return (
    <section className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Evidence report</p>
          <h2 className="mt-1 text-xl font-bold">Observed at {new Date(report.testedAt).toLocaleString()}</h2>
        </div>
        <span className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/60">v{report.testVersion}</span>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Endpoint reachable", report.errors.some((error) => error.category === "Network") ? "Review" : "Pass"],
          ["Authentication", report.errors.some((error) => error.category === "Authentication") ? "Failed" : "Observed"],
          ["Model responded", report.successCount >= 2 ? "Pass" : "Review"],
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
        <Metric label="Streaming" value={report.streaming.toUpperCase()} />
        <Metric label="Protocol signal" value={report.protocolSignal} />
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">Observed response</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{report.observedResponse ?? "Unavailable"}</p>
        <p className="mt-3 text-xs text-foreground/50">Response model declaration: {report.observedResponseModel ?? "Unavailable"}</p>
      </div>

      <ErrorList errors={report.errors} />

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => void navigator.clipboard.writeText(markdown)} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">
          Copy Report
        </button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.json", json, "application/json")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">
          Export JSON
        </button>
        <button type="button" onClick={() => downloadText("api-spotlight-gateway-probe.md", markdown, "text/markdown")} className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5">
          Export Markdown
        </button>
        <button type="button" onClick={onRunAgain} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          Run Again
        </button>
      </div>
      <p className="mt-4 text-xs leading-5 text-foreground/50">This is a new low-impact test result. It does not prove model identity or permanent endpoint health.</p>
    </section>
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

export default function GatewayRelayProbe() {
  const [endpointInput, setEndpointInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<DiscoveredModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProbeError[]>([]);
  const [report, setReport] = useState<ProbeReport | null>(null);
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
    try {
      const endpoint = normalizeEndpoint(endpointInput);
      const discovered = await discoverModels(endpoint, apiKey);
      setModels(discovered);
      setSelectedModel(discovered[0]?.id ?? "");
      setStatus(discovered.length ? `${discovered.length} model${discovered.length === 1 ? "" : "s"} found` : "No models were returned.");
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
    let endpoint = "";
    let requestCount = 0;
    let successCount = 0;
    const collectedErrors: ProbeError[] = [];
    let nonStreamingResponse: Awaited<ReturnType<typeof runChat>> | null = null;
    let streamingResponse: Awaited<ReturnType<typeof runStreamingChat>> | null = null;

    try {
      endpoint = normalizeEndpoint(endpointInput);
      if (!selectedModel) {
        throw new ProbeRequestError("User Input", "Select a model before starting Quick Test.");
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

      const observedModels = [nonStreamingResponse?.observedResponseModel ?? null, streamingResponse?.observedResponseModel ?? null];
      const nextReport: ProbeReport = {
        testId: createTestId(),
        testedAt,
        endpoint,
        model: selectedModel,
        testVersion: GATEWAY_PROBE_VERSION,
        requestCount,
        successCount,
        ttftMs: streamingResponse?.ttftMs ?? null,
        totalLatencyMs: streamingResponse?.totalLatencyMs ?? nonStreamingResponse?.totalLatencyMs ?? null,
        streaming: streamingResponse ? "pass" : "fail",
        observedResponse: streamingResponse?.observedResponse ?? nonStreamingResponse?.observedResponse ?? null,
        observedResponseModel: streamingResponse?.observedResponseModel ?? nonStreamingResponse?.observedResponseModel ?? null,
        usageAvailable: nonStreamingResponse?.usageAvailable ?? false,
        protocolSignal: classifyProtocolSignal(selectedModel, observedModels),
        errors: collectedErrors,
      };
      setReport(nextReport);
      setStatus(successCount === 2 ? "Quick Test completed." : "Quick Test completed with errors.");
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
        <strong>Authorized Endpoint Testing only.</strong> Use an endpoint and API key you are authorized to test. Requests go directly from this browser to the endpoint; APISpotlight does not receive or store your key.
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-endpoint">
          Base URL
          <input id="gateway-endpoint" value={endpointInput} onChange={(event) => setEndpointInput(event.target.value)} placeholder="https://example.com/v1" autoComplete="off" spellCheck={false} className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">HTTPS only. Loopback, private-network, metadata, and internal hostnames are blocked.</span>
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="gateway-api-key">
          API Key <span className="font-normal text-foreground/50">(optional for public endpoints)</span>
          <input id="gateway-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste a dedicated low-privilege test key" autoComplete="off" className="rounded-lg border border-foreground/15 bg-transparent px-3 py-3 font-normal outline-none placeholder:text-foreground/35 focus:border-emerald-500" />
          <span className="text-xs font-normal text-foreground/50">Held in page memory only, sent only to the endpoint, then cleared after the request.</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void discover()} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
          {busy === "discover" ? "Discovering…" : "Discover Models"}
        </button>
        <button type="button" onClick={() => { setModels([]); setSelectedModel(""); setStatus(null); setErrors([]); setReport(null); clearSensitiveState(); }} disabled={busy !== null} className="rounded-lg border border-foreground/15 px-4 py-3 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50">
          Clear
        </button>
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
            {busy === "test" ? "Running Quick Test…" : "Quick Test"}
          </button>
        </div>
      )}

      {report && <ReportView report={report} onRunAgain={() => void quickTest()} />}

      <p className="mt-6 text-xs leading-5 text-foreground/50">The default probe is small and non-concurrent. CORS or provider policy can prevent browser-direct testing; this version does not fall back to an APISpotlight proxy. No verified official redirect is available for an arbitrary custom endpoint.</p>
    </section>
  );
}
