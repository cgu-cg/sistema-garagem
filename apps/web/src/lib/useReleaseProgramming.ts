import { useEffect, useRef, useState } from 'react';
import { loadReleaseProgramming, type ReleaseProgramming } from './releaseProgramming';
import type { DailyEscala } from './sharedEscala';
import { c4Realtime } from './c4RealtimeClient';
import { createRefreshScheduler } from './refreshScheduler';

export function useReleaseProgramming(context: DailyEscala['contexto'], enabled: boolean) {
  const [state, setState] = useState<ReleaseProgramming | null>(null), [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0), key = JSON.stringify(context);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let active = true; setState(null); setError(''); setLoading(false);
    if (!enabled) return;
    const scheduler = createRefreshScheduler(async () => {
      const request = ++sequence.current; setLoading(true);
      try {
        const data = await loadReleaseProgramming(context);
        if (active && request === sequence.current) { setState(data); setError(''); }
      } catch (err) {
        if (active && request === sequence.current) { setState(null); setError(err instanceof Error ? err.message : 'Programacao indisponivel.'); }
      } finally { if (active && request === sequence.current) setLoading(false); }
    });
    refreshRef.current = scheduler.refresh;
    void scheduler.refresh(); window.addEventListener('focus', scheduler.schedule);
    const stop = c4Realtime.subscribe(event => { if (!event || (event.garagem === context.garagem && event.dataFolha <= context.dataOperacao)) scheduler.schedule(); });
    return () => { active = false; scheduler.dispose(); refreshRef.current = async () => {}; stop(); window.removeEventListener('focus', scheduler.schedule); };
  }, [key, enabled]);
  return { data: state && JSON.stringify(state.contexto) === key ? state : null, error, loading, reload: () => refreshRef.current() };
}
