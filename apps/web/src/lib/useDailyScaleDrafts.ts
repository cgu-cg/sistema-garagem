import { useCallback, useRef, useState } from 'react';

export function useDailyScaleDrafts() {
  const fields = useRef(new Set<string>());
  const [dirty, setDirty] = useState(false);
  const setEditing = useCallback((key: string, editing: boolean) => {
    if (editing) fields.current.add(key);
    else fields.current.delete(key);
    // O ref protege callbacks assíncronos; o estado atualiza os controles visuais.
    setDirty(fields.current.size > 0);
  }, []);
  const clear = useCallback(() => { fields.current.clear(); setDirty(false); }, []);
  return { fields, dirty, setEditing, clear };
}
