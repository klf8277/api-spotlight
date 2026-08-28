export const GATEWAY_PROBE_VERSION = "0.1.0";
export const DEFAULT_PROBE_PROMPT = "Reply with exactly: APISpotlight probe OK";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_CHARS = 2_000;

export type ProbeErrorCategory =
  | "Network"
  | "Authentication"
  | "Endpoint"
  | "Quota"
  | "Provider"
  | "Protocol"
  | "User Input";

export type StreamingStatus = "pass" | "fail" | "unavailable";

export interface DiscoveredModel {
  id: string;
  ownedBy?: string;
}

export interface ProbeError {
  category: ProbeErrorCategory;
  message: string;
  status?: number;
}

export interface ProbeReport {
  testId: string;
  testedAt: string;
  endpoint: string;
  model: string;
  testVersion: string;
  requestCount: number;
  successCount: number;
  ttftMs: number | null;
  totalLatencyMs: number | null;
  streaming: StreamingStatus;
  observedResponse: string | null;
  observedResponseModel: string | null;
  usageAvailable: boolean;
  protocolSignal: "Consistent" | "Inconclusive" | "Anomaly Detected";
  errors: ProbeError[];
}

export class ProbeRequestError extends Error {
  category: ProbeErrorCategory;
  status?: number;

  constructor(category: ProbeErrorCategory, message: string, status?: number) {
    super(message);
    this.name = "ProbeRequestError";
    this.category = category;
    this.status = status;
  }
}

function trimResponse(value: string): string {
  return value.length > MAX_RESPONSE_CHARS
    ? `${value.slice(0, MAX_RESPONSE_CHARS)}…`
    : value;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "metadata.google.internal" ||
    normalized === "169.254.169.254" ||
    isPrivateIpv4(normalized) ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

export function normalizeEndpoint(rawEndpoint: string): string {
  const value = rawEndpoint.trim();
  if (!value) {
    throw new ProbeRequestError("User Input", "Enter a Base URL before continuing.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProbeRequestError("User Input", "Enter a complete HTTPS Base URL.");
  }

  if (url.protocol !== "https:") {
    throw new ProbeRequestError("User Input", "Only HTTPS endpoints are supported in the public tester.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ProbeRequestError("User Input", "Base URL must not contain credentials, query parameters, or a hash.");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new ProbeRequestError(
      "User Input",
      "Loopback, private-network, metadata, and internal hostnames are blocked.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

function endpointPath(endpoint: string, path: string): string {
  return `${endpoint.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function errorForStatus(status: number, action: string): ProbeRequestError {
  if (status === 401 || status === 403) {
    return new ProbeRequestError("Authentication", `${action} was rejected by the endpoint.`, status);
  }
  if (status === 404) {
    return new ProbeRequestError("Endpoint", `${action} endpoint was not found.`, status);
  }
  if (status === 408 || status === 504) {
    return new ProbeRequestError("Network", `${action} timed out.`, status);
  }
  if (status === 429) {
    return new ProbeRequestError("Quota", `${action} was rate limited.`, status);
  }
  if (status >= 500) {
    return new ProbeRequestError("Provider", `${action} failed at the provider.`, status);
  }
  return new ProbeRequestError("Protocol", `${action} returned HTTP ${status}.`, status);
}

function safeFetchError(error: unknown, action: string): ProbeRequestError {
  if (error instanceof ProbeRequestError) {
    return error;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ProbeRequestError("Network", `${action} timed out.`);
  }
  return new ProbeRequestError("Network", `${action} was blocked by browser CORS or a network error.`);
}

async function fetchWithTimeout(url: string, init: RequestInit, action: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw errorForStatus(response.status, action);
    }
    return response;
  } catch (error) {
    throw safeFetchError(error, action);
  } finally {
    window.clearTimeout(timeout);
  }
}

function authHeaders(apiKey: string): HeadersInit {
  const key = apiKey.trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export async function discoverModels(endpoint: string, apiKey: string): Promise<DiscoveredModel[]> {
  const response = await fetchWithTimeout(
    endpointPath(endpoint, "/models"),
    { headers: authHeaders(apiKey) },
    "Model discovery",
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProbeRequestError("Protocol", "Model discovery returned malformed JSON.");
  }

  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) {
    throw new ProbeRequestError("Protocol", "Model discovery returned an unexpected response shape.");
  }

  const models = (payload as { data: unknown[] }).data
    .filter((item): item is { id: string; owned_by?: string } => {
      return Boolean(item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string");
    })
    .map((item) => ({ id: item.id, ownedBy: item.owned_by }));

  return models;
}

interface ChatResult {
  totalLatencyMs: number;
  observedResponse: string | null;
  observedResponseModel: string | null;
  usageAvailable: boolean;
}

function getMessageText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choice = (payload as { choices?: unknown[] }).choices?.[0];
  if (!choice || typeof choice !== "object") return null;
  const content = (choice as { message?: { content?: unknown }; text?: unknown }).message?.content ??
    (choice as { text?: unknown }).text;
  if (typeof content === "string") return trimResponse(content);
  if (Array.isArray(content)) {
    const text = content
      .filter((part): part is { text: string } => Boolean(part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"))
      .map((part) => part.text)
      .join("");
    return text ? trimResponse(text) : null;
  }
  return null;
}

export async function runChat(endpoint: string, apiKey: string, model: string): Promise<ChatResult> {
  const started = performance.now();
  const response = await fetchWithTimeout(
    endpointPath(endpoint, "/chat/completions"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(apiKey) },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: DEFAULT_PROBE_PROMPT }],
        max_tokens: 32,
        stream: false,
      }),
    },
    "Chat test",
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProbeRequestError("Protocol", "Chat returned malformed JSON.");
  }

  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { choices?: unknown }).choices)) {
    throw new ProbeRequestError("Protocol", "Chat returned an unexpected response shape.");
  }

  return {
    totalLatencyMs: Math.round(performance.now() - started),
    observedResponse: getMessageText(payload),
    observedResponseModel: typeof (payload as { model?: unknown }).model === "string" ? (payload as { model: string }).model : null,
    usageAvailable: Boolean((payload as { usage?: unknown }).usage && typeof (payload as { usage?: unknown }).usage === "object"),
  };
}

interface StreamResult {
  ttftMs: number | null;
  totalLatencyMs: number;
  observedResponse: string | null;
  observedResponseModel: string | null;
}

export async function runStreamingChat(endpoint: string, apiKey: string, model: string): Promise<StreamResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpointPath(endpoint, "/chat/completions"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeaders(apiKey) },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: DEFAULT_PROBE_PROMPT }],
        max_tokens: 32,
        stream: true,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw errorForStatus(response.status, "Streaming test");
    if (!response.body) {
      throw new ProbeRequestError("Protocol", "Streaming response did not include a readable body.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let ttftMs: number | null = null;
    let observedResponseModel: string | null = null;
    let sawEvent = false;

    const consumeLines = (lines: string[]) => {
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        sawEvent = true;
        let payload: unknown;
        try {
          payload = JSON.parse(data);
        } catch {
          throw new ProbeRequestError("Protocol", "Streaming response contained malformed JSON.");
        }
        if (payload && typeof payload === "object" && typeof (payload as { model?: unknown }).model === "string") {
          observedResponseModel = (payload as { model: string }).model;
        }
        const choice = payload && typeof payload === "object" ? (payload as { choices?: unknown[] }).choices?.[0] : null;
        const delta = choice && typeof choice === "object" ? (choice as { delta?: { content?: unknown } }).delta?.content : null;
        if (typeof delta === "string" && delta) {
          if (ttftMs === null) ttftMs = Math.round(performance.now() - started);
          content += delta;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      consumeLines(lines);
      if (done) break;
    }
    if (buffer.trim()) consumeLines([buffer]);
    reader.releaseLock();

    if (!sawEvent) {
      throw new ProbeRequestError("Protocol", "Streaming response did not contain SSE data events.");
    }

    return {
      ttftMs,
      totalLatencyMs: Math.round(performance.now() - started),
      observedResponse: content ? trimResponse(content) : null,
      observedResponseModel,
    };
  } finally {
    window.clearTimeout(timeout);
  }
  
}

export function classifyProtocolSignal(requestedModel: string, observedModels: Array<string | null>): ProbeReport["protocolSignal"] {
  const present = observedModels.filter((model): model is string => Boolean(model));
  if (!present.length) return "Inconclusive";
  return present.every((model) => model === requestedModel) ? "Consistent" : "Anomaly Detected";
}

export function createTestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `probe-${Date.now()}`;
}

export function errorToReport(error: unknown): ProbeError {
  if (error instanceof ProbeRequestError) {
    return { category: error.category, message: error.message, status: error.status };
  }
  return { category: "Network", message: "The browser could not complete the request." };
}
