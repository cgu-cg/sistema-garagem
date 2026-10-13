import { useEffect, useRef } from 'react';
import { useAuth } from '@/stores/auth';
import { c4Realtime } from './c4RealtimeClient';
import { matchesInvalidation } from './realtimeSession';
import { createRealtimeRefresh } from './realtimeRefresh';
import { getMutationState, readTicket, subscribeMutationState } from './mvpTemporal';
import type { createReadCoordinator } from './readCoordination';

export function useC4RealtimeSession() {
  const { token, user, loading } = useAuth();
  useEffect(() => {
    if (!token || !user || loading) { c4Realtime.logout(); return; }
    return c4Realtime.retain(token);
  }, [token, user?.id, loading]);
}

export function useC4RealtimeReload<T>(garage: string, date: string, kind: 'ci' | 'manutencao',
  coordinator: ReturnType<typeof createReadCoordinator>, load: () => Promise<T>, apply: (value: T) => void, failure: (error: unknown) => void) {
  const latest = useRef({ load, apply, failure }); latest.current = { load, apply, failure };
  useEffect(() => {
    let active = true;
    const refresh = createRealtimeRefresh(async () => {
      const ticket = readTicket();
      await coordinator.run(
        () => latest.current.load(), value => { if (active) latest.current.apply(value); },
        error => { if (active) latest.current.failure(error); },
      );
      // Uma mutacao iniciada durante o GET invalida a resposta, mas nao a notificacao.
      if (active && ticket !== readTicket()) refresh.request();
    }, () => coordinator.pending || getMutationState().pending);
    let pending = getMutationState().pending;
    const stopMutation = subscribeMutationState(() => {
      const state = getMutationState();
      if (pending && !state.pending && state.refreshRequired) refresh.request();
      pending = state.pending;
    });
    const unsubscribe = c4Realtime.subscribe(event => {
      if (!event || matchesInvalidation(event, garage, date, kind)) refresh.request();
    });
    return () => { active = false; unsubscribe(); stopMutation(); refresh.dispose(); };
  }, [garage, date, kind, coordinator]);
}
