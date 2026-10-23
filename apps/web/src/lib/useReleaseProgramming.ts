import { useEffect, useRef, useState } from 'react';
import { loadReleaseProgramming, type ReleaseProgramming } from './releaseProgramming';
import type { DailyEscala } from './sharedEscala';
import { c4Realtime } from './c4RealtimeClient';

export function useReleaseProgramming(context: DailyEscala['contexto'], enabled: boolean) {
  const [state, setState] = useState<ReleaseProgramming | null>(null), [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0), key = JSON.stringify(context);
  useEffect(() => {
    let active = true; setState(null); setError('');
    if (!enabled) return;
    const refresh = async () => {
      const request = ++sequence.current; setLoading(true);
      try {
        const data = await loadReleaseProgramming(context);
        if (active && request === sequence.current) { setState(data); setError(''); }
      } catch (err) {
        if (active && request === sequence.current) { setState(null); setError(err instanceof Error ? err.message : 'Programacao indisponivel.'); }
      } finally { if (active && request === sequence.current) setLoading(false); }
    };
    void refresh(); window.addEventListener('focus', refresh);
    const stop = c4Realtime.subscribe(event => { if (!event || (event.garagem === context.garagem && event.dataFolha <= context.dataOperacao)) void refresh(); });
    return () => { active = false; stop(); window.removeEventListener('focus', refresh); };
  }, [key, enabled]);
  return { data: state && JSON.stringify(state.contexto) === key ? state : null, error, loading };
}
