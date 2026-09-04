import { BloqueioCarro } from "@/data/solturaData";

const STORAGE_KEY = "soltura_ci_bloqueios_v2";

export function getConsorciadaByCarro(carro: string): "VSF" | "VCG" | "JTU" | "VCM" {
  const clean = carro.replace(/\D/g, "");
  if (clean.startsWith("1")) return "VCM";
  if (clean.startsWith("2")) return "VSF";
  if (clean.startsWith("3")) return "JTU";
  if (clean.startsWith("4")) return "VCG";
  return "VCG";
}

// Sementes extraídas da folha física oficial: CI - Solicitação de veículos (CGU.REG.MT0005)
export const SEED_CI_PLANILHA: BloqueioCarro[] = [
  // Preventivas
  { id: "ci-doc-4182", prefixo: "4182", consorciada: "VCG", garagem: "VCG", tipo: "REFORCO_REVISAO", categoriaPlanilha: "PREVENTIVA", tipoPreventiva: "REVISAO_GERAL", motivo: "Revisão Geral Preventiva", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Oficina Preventiva" },
  { id: "ci-doc-4183", prefixo: "4183", consorciada: "VCG", garagem: "VCG", tipo: "REFORCO_REVISAO", categoriaPlanilha: "PREVENTIVA", tipoPreventiva: "REVISAO_GERAL", motivo: "Revisão Geral Preventiva", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Oficina Preventiva" },

  // Setor Mecânica
  { id: "ci-doc-2715", prefixo: "2715", consorciada: "VSF", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "OFICINA", setorOficina: "MECANICA", motivo: "Suspensão", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Mecânica Geral" },
  { id: "ci-doc-4228", prefixo: "4228", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "OFICINA", setorOficina: "MECANICA", motivo: "Suspensão", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Mecânica Geral" },
  { id: "ci-doc-4239", prefixo: "4239", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "OFICINA", setorOficina: "MECANICA", motivo: "Suspensão", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Mecânica Geral" },
  { id: "ci-doc-4246", prefixo: "4246", consorciada: "VCG", garagem: "VCG", tipo: "EM_MANUTENCAO", categoriaPlanilha: "OFICINA", setorOficina: "MECANICA", motivo: "Mecânica Geral", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Mecânica Geral" },
  { id: "ci-doc-4232", prefixo: "4232", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "OFICINA", setorOficina: "MECANICA", motivo: "Suspensão", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Mecânica Geral" },

  // Setor Elevador
  { id: "ci-doc-3263", prefixo: "3263", consorciada: "JTU", garagem: "VCG", tipo: "EM_MANUTENCAO", categoriaPlanilha: "OFICINA", setorOficina: "ELEVADOR", motivo: "Elevador Acessibilidade", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Acessibilidade / Elevador" },
  { id: "ci-doc-2613", prefixo: "2613", consorciada: "VSF", garagem: "VCG", tipo: "EM_MANUTENCAO", categoriaPlanilha: "OFICINA", setorOficina: "ELEVADOR", motivo: "Elevador Acessibilidade", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Acessibilidade / Elevador" },
  { id: "ci-doc-4211", prefixo: "4211", consorciada: "VCG", garagem: "VCG", tipo: "EM_MANUTENCAO", categoriaPlanilha: "OFICINA", setorOficina: "ELEVADOR", motivo: "Elevador Acessibilidade", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Acessibilidade / Elevador" },

  // Setor Elétrica
  { id: "ci-doc-3004", prefixo: "3004", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "OFICINA", setorOficina: "ELETRICA", motivo: "Módulo Eletrônico", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Auto Elétrica" },
  { id: "ci-doc-4259", prefixo: "4259", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "OFICINA", setorOficina: "ELETRICA", motivo: "Chicote ARLA 32", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Auto Elétrica" },
  { id: "ci-doc-4257", prefixo: "4257", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "OFICINA", setorOficina: "ELETRICA", motivo: "Chicote ARLA 32", data: "2026-07-19", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Auto Elétrica" },
  { id: "ci-doc-3035", prefixo: "3035", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "OFICINA", setorOficina: "ELETRICA", motivo: "Sensor de Nível", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Auto Elétrica" },
  { id: "ci-doc-4253", prefixo: "4253", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "OFICINA", setorOficina: "ELETRICA", motivo: "Tensor da Correia", data: "2026-07-19", gravidade: "MEDIA", status: "BLOQUEADO", responsavel: "Auto Elétrica" },

  // Bloqueados VSF
  { id: "ci-doc-2800", prefixo: "2800", consorciada: "VSF", garagem: "VCG", tipo: "BLOQUEADO_SINISTRO", categoriaPlanilha: "BLOQUEADO", motivo: "Sinistro / Avaria", data: "2026-01-03", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Funilaria VSF" },
  { id: "ci-doc-2600", prefixo: "2600", consorciada: "VSF", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "BLOQUEADO", motivo: "Elétrica Geral", data: "2026-01-06", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Elétrica VSF" },
  { id: "ci-doc-2705", prefixo: "2705", consorciada: "VSF", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "BLOQUEADO", motivo: "Elétrica (Módulo MR)", data: "2026-07-03", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Elétrica VSF" },
  { id: "ci-doc-2424", prefixo: "2424", consorciada: "VSF", garagem: "VCG", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2026-07-03", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Oficina Diesel VSF" },

  // Bloqueados VCG
  { id: "ci-doc-4199", prefixo: "4199", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2024-05-03", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Oficina Diesel VCG" },
  { id: "ci-doc-4200", prefixo: "4200", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_CAMBIO", categoriaPlanilha: "BLOQUEADO", motivo: "Transmissão", data: "2025-10-20", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Transmissão VCG" },
  { id: "ci-doc-4269", prefixo: "4269", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2026-06-04", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Oficina Diesel VCG" },
  { id: "ci-doc-4220", prefixo: "4220", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "BLOQUEADO", motivo: "Módulo Eletrônico", data: "2026-04-30", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Auto Elétrica VCG" },
  { id: "ci-doc-4201", prefixo: "4201", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_FREIO", categoriaPlanilha: "BLOQUEADO", motivo: "Mecânica (Pastilhas e Disco de Freio)", data: "2026-06-28", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Freios VCG" },
  { id: "ci-doc-4247", prefixo: "4247", consorciada: "VCG", garagem: "VCG", tipo: "EM_MANUTENCAO", categoriaPlanilha: "BLOQUEADO", motivo: "Falta de Peça Para-brisa", data: "2026-07-08", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Almoxarifado VCG" },
  { id: "ci-doc-4256", prefixo: "4256", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "BLOQUEADO", motivo: "Posto de Molas", data: "2026-07-15", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Molas VCG" },
  { id: "ci-doc-4203", prefixo: "4203", consorciada: "VCG", garagem: "VCG", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "BLOQUEADO", motivo: "Módulo", data: "2026-07-15", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Auto Elétrica VCG" },

  // Bloqueados JTU
  { id: "ci-doc-3005", prefixo: "3005", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "BLOQUEADO", motivo: "Suspensão", data: "2025-10-20", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Suspensão JTU" },
  { id: "ci-doc-3006", prefixo: "3006", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2024-06-30", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Diesel JTU" },
  { id: "ci-doc-3106", prefixo: "3106", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2026-06-24", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Diesel JTU" },
  { id: "ci-doc-3220", prefixo: "3220", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_CAMBIO", categoriaPlanilha: "BLOQUEADO", motivo: "Câmbio", data: "2026-07-13", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Câmbio JTU" },
  { id: "ci-doc-3950", prefixo: "3950", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_MOLA", categoriaPlanilha: "BLOQUEADO", motivo: "Posto de Mola", data: "2026-07-17", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Molas JTU" },
  { id: "ci-doc-3209", prefixo: "3209", consorciada: "JTU", garagem: "VCG", tipo: "BLOQUEADO_FREIO", categoriaPlanilha: "BLOQUEADO", motivo: "Freio", data: "2026-07-17", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Freios JTU" },

  // Bloqueados VCM
  { id: "ci-doc-1119", prefixo: "1119", consorciada: "VCM", garagem: "VCM", tipo: "BLOQUEADO_MOTOR", categoriaPlanilha: "BLOQUEADO", motivo: "Motor", data: "2020-12-18", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Diesel VCM" },
  { id: "ci-doc-1323", prefixo: "1323", consorciada: "VCM", garagem: "VCM", tipo: "BLOQUEADO_SINISTRO", categoriaPlanilha: "BLOQUEADO", motivo: "Sinistro", data: "2024-12-07", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Funilaria VCM" },
  { id: "ci-doc-1322", prefixo: "1322", consorciada: "VCM", garagem: "VCM", tipo: "BLOQUEADO_MODULO", categoriaPlanilha: "BLOQUEADO", motivo: "Elétrica Geral", data: "2024-12-07", gravidade: "ALTA", status: "BLOQUEADO", responsavel: "Elétrica VCM" },
];

export function getInitialCIBloqueios(): BloqueioCarro[] {
  try {
    const savedV2 = localStorage.getItem(STORAGE_KEY);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler CIs do localStorage:", e);
  }

  // Se estiver vazio, popula inicialmente com a folha oficial
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CI_PLANILHA));
  } catch {}
  return SEED_CI_PLANILHA;
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
