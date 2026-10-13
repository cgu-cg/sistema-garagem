// Conservar o array original: os tokens C4 pertencem a sua identidade (WeakMap).
export function createEditBaselines<T>() {
  const drafts = new Map<string, { context: string; baseline: T[] }>();
  return {
    begin(key: string, context: string, baseline: T[], replace = false) {
      if (replace) drafts.delete(key);
      if (!drafts.has(key)) drafts.set(key, { context, baseline });
    },
    has(key: string) { return drafts.has(key); },
    keys() { return [...drafts.keys()]; },
    read(key: string, fallback: T[]) { return drafts.get(key)?.baseline ?? fallback; },
    oldest(keys: string[], fallback: T[]) { return [...drafts].find(([key]) => keys.includes(key))?.[1].baseline ?? fallback; },
    assertContext(key: string, context: string) {
      if (drafts.has(key) && drafts.get(key)!.context !== context) throw new Error('A edicao pertence a outra data ou garagem. Volte ao contexto original ou descarte o rascunho.');
    },
    end(key: string) { drafts.delete(key); },
    clear() { drafts.clear(); },
  };
}
