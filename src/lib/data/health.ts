/**
 * In-memory provider health ledger.
 *
 * Records the outcome of every outbound call so /status can report *observed*
 * connectivity rather than an aspirational green board. Process-local, so on
 * serverless it describes the warm instance that served the most recent calls.
 */

export interface ProviderHealth {
  id: string;
  calls: number;
  successes: number;
  failures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  lastStatus: number | null;
  averageLatencyMs: number | null;
}

interface Ledger extends ProviderHealth {
  totalLatencyMs: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __earthcoreHealth: Map<string, Ledger> | undefined;
}

function ledger(): Map<string, Ledger> {
  if (!globalThis.__earthcoreHealth) {
    globalThis.__earthcoreHealth = new Map();
  }
  return globalThis.__earthcoreHealth;
}

export function recordProviderCall(
  providerId: string,
  ok: boolean,
  latencyMs: number,
  error: string | null,
  status: number | null = null,
): void {
  const map = ledger();
  let entry = map.get(providerId);
  if (!entry) {
    entry = {
      id: providerId,
      calls: 0,
      successes: 0,
      failures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      lastLatencyMs: null,
      lastStatus: null,
      averageLatencyMs: null,
      totalLatencyMs: 0,
    };
    map.set(providerId, entry);
  }
  entry.calls += 1;
  entry.totalLatencyMs += latencyMs;
  entry.lastLatencyMs = Math.round(latencyMs);
  entry.averageLatencyMs = Math.round(entry.totalLatencyMs / entry.calls);
  if (status !== null) entry.lastStatus = status;
  if (ok) {
    entry.successes += 1;
    entry.lastSuccessAt = new Date().toISOString();
  } else {
    entry.failures += 1;
    entry.lastFailureAt = new Date().toISOString();
    if (error) entry.lastError = error.slice(0, 240);
  }
}

export function getProviderHealth(): ProviderHealth[] {
  return [...ledger().values()].map(({ totalLatencyMs: _total, ...rest }) => rest);
}

export function getProviderHealthFor(providerId: string): ProviderHealth | null {
  const entry = ledger().get(providerId);
  if (!entry) return null;
  const { totalLatencyMs: _total, ...rest } = entry;
  return rest;
}
