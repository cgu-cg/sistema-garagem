import { useEffect, useRef, useState } from 'react';
import { dailyScaleWindow } from './dailyScaleWindow';

export function useDailyScaleWindow(enabled: boolean, selectedDate: string, onDate: (date: string) => void, busy: () => boolean) {
  const [window, setWindow] = useState(() => dailyScaleWindow());
  const latest = useRef({ selectedDate, onDate, busy });
  latest.current = { selectedDate, onDate, busy };
  useEffect(() => {
    if (!enabled) return;
    let previous: string | null = null;
    const tick = () => {
      const next = dailyScaleWindow();
      setWindow(current => current.today === next.today && current.beforeCutoff === next.beforeCutoff ? current : next);
      const state = latest.current;
      // Não perder rascunho nem trocar consultas históricas selecionadas manualmente.
      if (state.busy()) return;
      if ((!previous || state.selectedDate === previous) && state.selectedDate !== next.preparationDate) state.onDate(next.preparationDate);
      previous = next.preparationDate;
    };
    tick();
    const timer = globalThis.setInterval(tick, 1000);
    globalThis.addEventListener('focus', tick);
    return () => { globalThis.clearInterval(timer); globalThis.removeEventListener('focus', tick); };
  }, [enabled]);
  return window;
}
