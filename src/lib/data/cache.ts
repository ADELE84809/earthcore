/**
 * In-memory TTL cache with request de-duplication.
 *
 * Serverless instances are short-lived, so this is a *latency* cache on top of
 * the Next.js data cache — repeated selections in one session (or a warm
 * function) do not re-hit providers. Entries retain the provider's own validity
 * timestamp; caching never changes what a value means.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const MAX_ENTRIES = 400;

function prune(): void {
  if (store.size <= MAX_ENTRIES) return;
  const entries = [...store.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt);
  for (const [key] of entries.slice(0, entries.length - MAX_ENTRIES)) {
    store.delete(key);
  }
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = store.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value as T;
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expiresAt: Date.now() + ttlMs, storedAt: Date.now() });
      prune();
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function cacheStats(): { entries: number; inflight: number } {
  return { entries: store.size, inflight: inflight.size };
}

export function clearCache(): void {
  store.clear();
  inflight.clear();
}
