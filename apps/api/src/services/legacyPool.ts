type Pool = { connected: boolean; connect(): Promise<unknown>; close(): Promise<unknown> };

// Uma tentativa compartilhada; falhas liberam nova tentativa apos intervalo.
export function createLegacyPool<T extends Pool>(create: () => T, now = Date.now, cooldownMs = 5000) {
  let pool: T | null = null, connecting: Promise<T | null> | null = null, retryAt = 0;
  return {
    async get(): Promise<T | null> {
      if (pool?.connected) return pool;
      if (connecting) return connecting;
      if (now() < retryAt) return null;
      const attempt = (async () => {
        let candidate: T | null = null;
        try {
          const previous = pool; pool = null;
          if (previous) await previous.close().catch(() => undefined);
          candidate = create();
          await candidate.connect();
          pool = candidate; retryAt = 0;
          return pool;
        } catch {
          retryAt = now() + cooldownMs;
          if (candidate) await candidate.close().catch(() => undefined);
          return null;
        }
      })();
      connecting = attempt;
      try { return await attempt; } finally { if (connecting === attempt) connecting = null; }
    },
  };
}
