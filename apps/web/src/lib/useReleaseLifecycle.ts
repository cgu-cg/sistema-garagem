import { useEffect, useRef, useState } from 'react';
import type { DailyEscala } from './sharedEscala';
import { loadReleaseLifecycle, changeReleaseLifecycle, type ReleaseLifecycle } from './releaseLifecycle';
import { c4Realtime } from './c4RealtimeClient';
import { createRefreshScheduler } from './refreshScheduler';

export function useReleaseLifecycle(context: DailyEscala['contexto'], enabled: boolean) {
  const key = JSON.stringify(context), liveKey = useRef(key); liveKey.current = key;
  const [state, setState] = useState<{ key: string; data: ReleaseLifecycle } | null>(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(false), [mutating, setMutating] = useState(false);
  const writing = useRef(false), sequence = useRef(0), refresh = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let active = true; setState(null); setError(''); setLoading(false);
    if (!enabled) return;
    const scheduler = createRefreshScheduler(async () => {
      if (writing.current) return;
      const ticket = ++sequence.current; setLoading(true);
      try { const data = await loadReleaseLifecycle(context);
        if (active && ticket === sequence.current) { setState({ key, data }); setError(''); }
      } catch (err) { if (active && ticket === sequence.current) { setState(null); setError(err instanceof Error ? err.message : 'Estado oficial indisponível.'); } }
      finally { if (active && ticket === sequence.current) setLoading(false); }
    });
    refresh.current = scheduler.refresh;
    void scheduler.refresh(); window.addEventListener('focus', scheduler.schedule);
    const stop = c4Realtime.subscribe(event => { if (!event || event.garagem === context.garagem) scheduler.schedule(); });
    return () => { active = false; scheduler.dispose(); refresh.current = async () => {}; stop(); window.removeEventListener('focus', scheduler.schedule); };
  }, [key, enabled]);
  // Consultas em segundo plano mantem as acoes estaveis; erro ainda invalida o estado.
  const data = state?.key === key ? state.data : null;
  return { data, error, pending: mutating || (loading && !data),
    reload: () => refresh.current(),
    change: async (operacao: 'iniciar' | 'finalizar' | 'reabrir') => {
      if (writing.current || state?.key !== key) return false;
      writing.current = true; setMutating(true); ++sequence.current;
      try { const data = await changeReleaseLifecycle(context, state.data.revisao, operacao);
        if (liveKey.current === key) { setState({ key, data }); setError(''); }
        return true;
      } finally { writing.current = false; setMutating(false); setLoading(false); void refresh.current(); }
    } };
}
