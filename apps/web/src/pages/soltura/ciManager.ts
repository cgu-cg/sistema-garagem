import { BloqueioCarro, ciCarrosBloqueados } from "@/data/solturaData";

const STORAGE_KEY = "soltura_ci_bloqueios_v1";

export function getInitialCIBloqueios(): BloqueioCarro[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler CIs do localStorage:", e);
  }

  // Inicializar a partir dos dados preexistentes
  return ciCarrosBloqueados.map((item, index) => ({
    id: `ci-seed-${index + 1}-${item.prefixo}`,
    prefixo: item.prefixo,
    garagem: item.prefixo.startsWith("1") ? "VCM" : "VCG",
    tipo: item.tipo,
    motivo: item.motivo,
    data: item.data || "26/08/2026",
    hora: "06:30",
    gravidade: item.motivo.toLowerCase().includes("motor") || item.motivo.toLowerCase().includes("freio") || item.motivo.toLowerCase().includes("cambio") ? "ALTA" : "MEDIA",
    responsavel: "Oficina Central",
    status: "BLOQUEADO",
    os: `OS-${202600 + index}`
  }));
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
