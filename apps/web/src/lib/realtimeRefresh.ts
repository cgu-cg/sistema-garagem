// Agrupa invalidacoes; consultas oficiais continuam nos managers/readCoordination.
export function createRealtimeRefresh(load: () => Promise<void>, busy: () => boolean, delay = 50) {
  let dirty = false, running = false, disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (disposed || timer || running || !dirty) return;
    timer = setTimeout(() => { timer = undefined; void flush(); }, delay);
  };
  const flush = async () => {
    if (disposed || running || !dirty) return;
    if (busy()) { schedule(); return; }
    running = true; dirty = false;
    try { await load(); } finally { running = false; schedule(); }
  };
  return {
    request() { if (!disposed) { dirty = true; schedule(); } },
    dispose() { disposed = true; dirty = false; if (timer) clearTimeout(timer); },
  };
}
