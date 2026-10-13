export type C4Invalidation = { garagem: 'VCG' | 'VCM'; dataOperacional: string; dataFolha: string };
export type RealtimeListener = (event: C4Invalidation | null) => void;
export interface RealtimeSocket {
  on(event: string, listener: (...args: any[]) => void): unknown;
  off(event: string, listener: (...args: any[]) => void): unknown;
  connect(): unknown; disconnect(): unknown;
}
export function validInvalidation(value: unknown): value is C4Invalidation {
  const e = value as C4Invalidation | null;
  if (!e || !['VCG', 'VCM'].includes(e.garagem) || !/^\d{4}-\d{2}-\d{2}$/.test(e.dataOperacional) || !/^\d{4}-\d{2}-\d{2}$/.test(e.dataFolha)) return false;
  const date = new Date(`${e.dataOperacional}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== e.dataOperacional) return false;
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10) === e.dataFolha;
}
export function matchesInvalidation(e: C4Invalidation, garage: string, date: string, kind: 'ci' | 'manutencao') {
  return e.garagem === garage && (kind === 'ci' ? e.dataFolha : e.dataOperacional) === date;
}
export function createRealtimeSession(factory: (token: string) => RealtimeSocket) {
  const listeners = new Set<RealtimeListener>();
  let current: { token: string; socket: RealtimeSocket; connected: boolean; refs: number; detach: () => void } | undefined;
  const close = () => { if (current) { current.detach(); current.socket.disconnect(); current = undefined; } };
  return {
    retain(token: string) {
      if (current?.token !== token) {
        close(); const socket = factory(token);
        const entry = { token, socket, refs: 0, connected: false, detach: () => {} };
        const connected = () => { entry.connected = true; listeners.forEach(fn => fn(null)); };
        const disconnected = () => { entry.connected = false; };
        const updated = (e: unknown) => { if (validInvalidation(e)) listeners.forEach(fn => fn(e)); };
        socket.on('connect', connected); socket.on('disconnect', disconnected); socket.on('c4:updated', updated);
        entry.detach = () => { socket.off('connect', connected); socket.off('disconnect', disconnected); socket.off('c4:updated', updated); };
        current = entry; socket.connect();
      }
      const entry = current!; entry.refs++;
      return () => {
        entry.refs--;
        // StrictMode limpa e reinstala efeitos no mesmo turno: conservar a conexao.
        queueMicrotask(() => { if (current === entry && entry.refs === 0) close(); });
      };
    },
    logout: close,
    subscribe(fn: RealtimeListener) {
      listeners.add(fn); if (current?.connected) queueMicrotask(() => { if (listeners.has(fn)) fn(null); });
      return () => { listeners.delete(fn); };
    },
  };
}
