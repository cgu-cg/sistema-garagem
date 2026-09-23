import { SolturaItem, escalaOficialPdfVCG, vcgSegundaSextaVespertino } from "@/data/solturaData";
import { saveCache } from "@/lib/offline-db";

export const STORAGE_KEY_CUSTOM_SCHEDULES = "soltura_custom_schedules_v1";
export const SYNC_VERSION_KEY_PDF_2026 = "sistema_garagem_escala_pdf_2026_v5";

/**
 * Normaliza linha e tabela para garantir uso exclusivo de '/' como separador,
 * eliminando underlines ('_') e hífens ('-').
 */
export function normalizeLinhaETabela(str?: string | null): string {
  if (!str) return "";
  return str.replace(/[_-]/g, "/").replace(/\s*\/\s*/g, "/").trim();
}

/**
 * Carrega a grade customizada salva pelo usuário no localStorage.
 * Garante que a escala oficial do PDF 2026 seja aplicada na primeira carga ou sincronização
 * e que todos os registros usem obrigatoriamente a barra '/' como separador.
 */
export function getInitialCustomSchedules(): Record<string, SolturaItem[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SCHEDULES);
    let currentMap: Record<string, SolturaItem[]> = {};

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        currentMap = parsed;
      }
    }

    // Normaliza todos os itens de todas as escalas existentes no cache local
    let hasModified = false;
    for (const key of Object.keys(currentMap)) {
      if (Array.isArray(currentMap[key])) {
        currentMap[key] = currentMap[key].map(item => {
          const novaLinha = normalizeLinhaETabela(item.linha);
          const novaTabela = normalizeLinhaETabela(item.tabela);
          if (novaLinha !== item.linha || novaTabela !== item.tabela) {
            hasModified = true;
            return {
              ...item,
              linha: novaLinha,
              tabela: novaTabela
            };
          }
          return item;
        });
      }
    }

    // Verifica se já migrou para a nova escala oficial do PDF 2026 (v5 - com barras obrigatórias)
    const hasSyncedPdf = localStorage.getItem(SYNC_VERSION_KEY_PDF_2026);
    if (!hasSyncedPdf || hasModified) {
      if (!hasSyncedPdf) {
        currentMap["VCG_SEG_SEX_MATUTINO"] = escalaOficialPdfVCG;
        currentMap["VCG_SEG_SEX_VESPERTINO"] = vcgSegundaSextaVespertino;
        localStorage.setItem(SYNC_VERSION_KEY_PDF_2026, "true");
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_SCHEDULES, JSON.stringify(currentMap));
      saveCache("custom_schedules_v1", currentMap).catch(() => {});

      // Limpa qualquer cache residual de despachos locais de teste no navegador
      try {
        const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith("soltura_dispatches_"));
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }

    return currentMap;
  } catch (e) {
    console.error("Erro ao ler folha customizada do localStorage:", e);
    return {
      VCG_SEG_SEX_MATUTINO: escalaOficialPdfVCG,
      VCG_SEG_SEX_VESPERTINO: vcgSegundaSextaVespertino
    };
  }
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
