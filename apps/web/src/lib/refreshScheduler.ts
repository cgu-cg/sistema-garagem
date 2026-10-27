// Agrupa eventos e serializa leituras. Invalidacao durante uma leitura exige
// uma nova consulta ao final, para nao perder alteracoes de outro posto.
export function createRefreshScheduler(load: () => Promise<void>, delayMs = 100) {
  let pending: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false, disposed = false;
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const refresh = (): Promise<void> => {
    if (disposed) return Promise.resolve();
    clearTimer(); dirty = true;
    if (!pending) pending = Promise.resolve().then(async () => {
      try { do { dirty = false; if (!disposed) await load(); } while (dirty && !disposed); }
      finally { pending = null; }
    });
    return pending;
  };
  return {
    refresh,
    schedule() {
      if (disposed) return;
      if (pending) { dirty = true; return; }
      if (timer === null) timer = setTimeout(() => { timer = null; void refresh().catch(() => {}); }, delayMs);
    },
    dispose() { disposed = true; dirty = false; clearTimer(); },
  };
}
