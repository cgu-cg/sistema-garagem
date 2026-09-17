import { SolturaItem } from "@/data/solturaData";
import { saveCache } from "@/lib/offline-db";

export const STORAGE_KEY_CUSTOM_SCHEDULES = "soltura_custom_schedules_v1";

/**
 * Carrega a grade customizada salva pelo usuário no localStorage.
 */
export function getInitialCustomSchedules(): Record<string, SolturaItem[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SCHEDULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler folha customizada do localStorage:", e);
  }
  return {};
}

/**
 * Salva a folha customizada no localStorage e IndexedDB, emitindo eventos de sincronização.
 */
export function saveCustomSchedulesToStorage(schedulesMap: Record<string, SolturaItem[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SCHEDULES, JSON.stringify(schedulesMap));
    // Notifica outros componentes na mesma janela
    window.dispatchEvent(
      new CustomEvent("soltura_custom_schedules_updated", { detail: schedulesMap })
    );
    // Salva em cache offline (IndexedDB)
    saveCache("custom_schedules_v1", schedulesMap).catch(() => {});
  } catch (e) {
    console.error("Erro ao salvar folha customizada no localStorage:", e);
  }
}

/**
 * Remove a customização de uma escala/turno específica, voltando para a grade padrão.
 */
export function resetCustomScheduleFromStorage(scheduleKey: string): Record<string, SolturaItem[]> {
  const current = getInitialCustomSchedules();
  delete current[scheduleKey];
  saveCustomSchedulesToStorage(current);
  return current;
}

/**
 * Escuta atualizações de outras abas ou componentes.
 */
export function subscribeCustomSchedulesUpdates(
  callback: (schedulesMap: Record<string, SolturaItem[]>) => void
): () => void {
  const handleCustomEvent = (event: Event) => {
    const ce = event as CustomEvent<Record<string, SolturaItem[]>>;
    if (ce.detail) {
      callback(ce.detail);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY_CUSTOM_SCHEDULES && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && typeof parsed === "object") {
          callback(parsed);
        }
      } catch {}
    }
  };

  window.addEventListener("soltura_custom_schedules_updated", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener("soltura_custom_schedules_updated", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
