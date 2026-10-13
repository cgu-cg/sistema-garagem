import { useEffect, useRef } from 'react';

export type ReadInterruptionReason = 'SUPERSEDED' | 'MUTATION' | 'CONTEXT_CHANGED' | 'UNMOUNTED';
export class ReadInterrupted extends Error {
  constructor(public reason: ReadInterruptionReason, message: string) { super(message); }
}
export const isReadInterrupted = (error: unknown): error is ReadInterrupted => error instanceof ReadInterrupted;

// Guarda somente o ciclo de leitura da tela; nao altera revisoes nem repete escritas.
export function createReadCoordinator(epoch: () => number) {
  let context = '', generation = 0, mounted = true, pending = false;
  return {
    get pending() { return pending; },
    setContext(next: string) { if (context !== next) { context = next; generation++; pending = false; } },
    activate() { mounted = true; },
    dispose() { mounted = false; generation++; pending = false; },
    isActive(key: string) { return mounted && key === context; },
    async run<T>(load: () => Promise<T>, success: (value: T) => void, failure: (error: unknown) => void) {
      const key = context, number = ++generation, ticket = epoch();
      pending = true;
      const current = () => mounted && key === context && number === generation && ticket === epoch();
      try {
        const value = await load();
        if (current()) success(value);
      } catch (error) {
        if (current() && !isReadInterrupted(error)) failure(error);
      } finally { if (number === generation) pending = false; }
    },
  };
}

export function useReadCoordinator(context: string, epoch: () => number) {
  const ref = useRef<ReturnType<typeof createReadCoordinator> | null>(null);
  if (!ref.current) ref.current = createReadCoordinator(epoch);
  const coordinator = ref.current;
  coordinator.setContext(context);
  useEffect(() => { coordinator.activate(); return () => coordinator.dispose(); }, [coordinator, context]);
  return coordinator;
}
