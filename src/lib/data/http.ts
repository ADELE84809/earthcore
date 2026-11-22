/**
 * Controlled outbound HTTP for provider adapters.
 *
 * Every external call goes through here so that timeouts, retries, provider
 * health accounting and Next.js data caching are applied consistently.
 */

import { recordProviderCall } from "./health";

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  /** Next.js data-cache TTL in seconds. */
  revalidate?: number;
  headers?: Record<string, string>;
  providerId?: string;
}

export interface FetchResult<T> {
  data: T;
  status: number;
  retrievedAt: string;
  latencyMs: number;
}

export class ProviderError extends Error {
  readonly providerId: string;
  readonly statusCode: number | null;
  readonly retryable: boolean;

  constructor(
    providerId: string,
    message: string,
    options: { statusCode?: number | null; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "ProviderError";
    this.providerId = providerId;
    this.statusCode = options.statusCode ?? null;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

const USER_AGENT = "EarthCore/1.0 (+https://earthcore.vercel.app; environmental data integration)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<FetchResult<T>> {
  const {
    timeoutMs = 9_000,
    retries = 2,
    revalidate = 300,
    headers,
    providerId = "unknown",
  } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = Date.now();
    try {
      const init: RequestInit & { next?: { revalidate?: number } } = {
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": USER_AGENT,
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      };
      if (revalidate > 0) init.next = { revalidate };

      const response = await fetch(url, init);
      const latencyMs = Date.now() - started;

      if (!response.ok) {
        recordProviderCall(providerId, false, latencyMs, `HTTP ${response.status}`);
        const retryable = response.status === 429 || response.status >= 500;
        lastError = new ProviderError(providerId, `Upstream responded HTTP ${response.status}`, {
          statusCode: response.status,
          retryable,
        });
        if (retryable && attempt < retries) {
          await sleep(250 * 2 ** attempt);
          continue;
        }
        throw lastError;
      }

      const text = await response.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch (error) {
        recordProviderCall(providerId, false, latencyMs, "Invalid JSON");
        throw new ProviderError(providerId, "Upstream returned a non-JSON response", {
          statusCode: response.status,
          cause: error,
        });
      }

      recordProviderCall(providerId, true, latencyMs, null);
      return { data, status: response.status, retrievedAt: new Date().toISOString(), latencyMs };
    } catch (error) {
      if (error instanceof ProviderError && (error as ProviderError).statusCode) {
        throw error;
      }
      const latencyMs = Date.now() - started;
      const message = error instanceof Error ? error.message : "Unknown fetch error";
      recordProviderCall(providerId, false, latencyMs, message);
      lastError = error;
      if (attempt < retries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Provider request failed";
  throw new ProviderError(providerId, message, { cause: lastError });
}

export async function fetchText(
  url: string,
  options: FetchJsonOptions = {},
): Promise<FetchResult<string>> {
  const {
    timeoutMs = 9_000,
    retries = 1,
    revalidate = 3600,
    headers,
    providerId = "unknown",
  } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = Date.now();
    try {
      const init: RequestInit & { next?: { revalidate?: number } } = {
        headers: { "User-Agent": USER_AGENT, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      };
      if (revalidate > 0) init.next = { revalidate };
      const response = await fetch(url, init);
      const latencyMs = Date.now() - started;
      if (!response.ok) {
        recordProviderCall(providerId, false, latencyMs, `HTTP ${response.status}`);
        throw new ProviderError(providerId, `Upstream responded HTTP ${response.status}`, {
          statusCode: response.status,
        });
      }
      const text = await response.text();
      recordProviderCall(providerId, true, latencyMs, null);
      return { data: text, status: response.status, retrievedAt: new Date().toISOString(), latencyMs };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }
    }
  }

  throw new ProviderError(providerId, lastError instanceof Error ? lastError.message : "Fetch failed", {
    cause: lastError,
  });
}
