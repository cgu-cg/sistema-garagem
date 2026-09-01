import { BloqueioCarro } from "@/data/solturaData";

const STORAGE_KEY = "soltura_ci_bloqueios_v2";

export function getInitialCIBloqueios(): BloqueioCarro[] {
  try {
    // Também verificar v2 e v1 anterior caso o usuário tenha adicionado algum carro real
    const savedV2 = localStorage.getItem(STORAGE_KEY);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => !item.id?.startsWith("ci-seed-"));
      }
    }

    const savedV1 = localStorage.getItem("soltura_ci_bloqueios_v1");
    if (savedV1) {
      const parsed = JSON.parse(savedV1);
      if (Array.isArray(parsed)) {
        const userAddedOnly = parsed.filter(item => !item.id?.startsWith("ci-seed-"));
        if (userAddedOnly.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userAddedOnly));
          return userAddedOnly;
        }
      }
    }
  } catch (e) {
    console.error("Erro ao ler CIs do localStorage:", e);
  }

  // Lista inicial limpa: sem carros fictícios, apenas os que forem cadastrados
  return [];
}

export function saveCIBloqueiosToStorage(list: BloqueioCarro[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Disparar evento customizado para sincronização entre componentes
    window.dispatchEvent(new CustomEvent("ci_bloqueios_updated", { detail: list }));
  } catch (e) {
    console.error("Erro ao salvar CIs no localStorage:", e);
  }
}

export function checkCarroBloqueado(prefixo: string, list: BloqueioCarro[]): BloqueioCarro | null {
  if (!prefixo) return null;
  const clean = prefixo.replace(/\D/g, "");
  return list.find(b => 
    (b.status === "BLOQUEADO" || b.status === "EM_MANUTENCAO" || b.status === "AGUARDANDO_PECA" || !b.status) &&
    (b.prefixo === clean || b.prefixo === prefixo)
  ) || null;
}

export function subscribeCIUpdates(callback: (list: BloqueioCarro[]) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BloqueioCarro[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("ci_bloqueios_updated", handler);
  return () => {
    window.removeEventListener("ci_bloqueios_updated", handler);
  };
}
