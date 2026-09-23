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

/**
 * Retorna a Garagem Física de operação do veículo.
 * No Consórcio Guaicurus:
 * - Garagem 1 (VCM): abriga carros da VCM (1xxx) e carros cedidos/alocados de outras empresas (ex: 2002 da VSF).
 * - Garagem 2 (VCG): abriga a frota que opera na VCG.
 */
export function getGaragemFisicaByCarro(carro: string): "VCM" | "VCG" {
  const clean = carro.replace(/\D/g, "");
  if (clean === "2002") return "VCM";
  if (clean.startsWith("1")) return "VCM";
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

    // Sincronizar com as folhas de manutenção salvas
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("manutencao_carros_v2_") || key.startsWith("manutencao_carros_v1_"))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const mItems = JSON.parse(raw);
            if (Array.isArray(mItems)) {
              let hasChange = false;
              const handledPrefixes = new Set<string>();

              const updatedMItems = mItems.map((m: any) => {
                const clean = String(m.prefixo || "").replace(/\D/g, "");
                handledPrefixes.add(clean);
                const ciMatch = list.find(c => c.prefixo.replace(/\D/g, "") === clean);

                if (ciMatch) {
                  if (ciMatch.status === "LIBERADO" && (!m.liberado || m.bloqueado || m.emExecucao)) {
                    hasChange = true;
                    return { ...m, liberado: true, bloqueado: false, emExecucao: false, observacao: ciMatch.motivoLiberacao || m.observacao };
                  }
                  if (ciMatch.status === "EM_MANUTENCAO" && (!m.emExecucao || !m.bloqueado || m.liberado)) {
                    hasChange = true;
                    return { ...m, emExecucao: true, bloqueado: true, liberado: false, observacao: ciMatch.motivo || m.observacao };
                  }
                  if (ciMatch.status !== "LIBERADO" && ciMatch.status !== "EM_MANUTENCAO") {
                    if (!m.bloqueado || m.liberado || m.emExecucao || (ciMatch.motivo && m.observacao !== ciMatch.motivo)) {
                      hasChange = true;
                      return { ...m, bloqueado: true, emExecucao: false, liberado: false, observacao: ciMatch.motivo || m.observacao };
                    }
                  }
                } else {
                  if (m.bloqueado || m.emExecucao) {
                    hasChange = true;
                    return { ...m, bloqueado: false, emExecucao: false, liberado: true };
                  }
                }
                return m;
              });

              // Insere carros da CI não presentes na folha
              list.forEach(ci => {
                const clean = ci.prefixo.replace(/\D/g, "");
                if (!handledPrefixes.has(clean) && ci.status !== "LIBERADO") {
                  hasChange = true;
                  updatedMItems.push({
                    id: `manut-ci-${clean}`,
                    prefixo: clean,
                    consorciada: ci.consorciada || getConsorciadaByCarro(clean),
                    observacao: ci.motivo || "",
                    bloqueado: true,
                    emExecucao: ci.status === "EM_MANUTENCAO",
                    liberado: false,
                    data: key.includes("manutencao_carros_v2_") ? key.replace("manutencao_carros_v2_", "") : key.replace("manutencao_carros_v1_", "")
                  });
                  handledPrefixes.add(clean);
                }
              });

              if (hasChange) {
                localStorage.setItem(key, JSON.stringify(updatedMItems));
                const datePart = key.includes("manutencao_carros_v2_") 
                  ? key.replace("manutencao_carros_v2_", "") 
                  : key.replace("manutencao_carros_v1_", "");
                window.dispatchEvent(new CustomEvent("manutencao_updated", {
                  detail: { data: datePart, items: updatedMItems }
                }));
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar CI com Manutenção:", e);
    }
  } catch (e) {
    console.error("Erro ao salvar CIs no localStorage:", e);
  }
}

export function checkCarroBloqueado(prefixo: string, list: BloqueioCarro[], data?: string): BloqueioCarro | null {
  if (!prefixo) return null;
  const clean = prefixo.replace(/\D/g, "");

  // 1. Checa a folha de manutenção salva
  try {
    const today = new Date().toISOString().split("T")[0];
    const keysToCheck = [
      ...(data ? [`manutencao_carros_v2_${data}`, `manutencao_carros_v1_${data}`] : []),
      `manutencao_carros_v2_${today}`,
      "manutencao_carros_v2_2026-09-09",
      `manutencao_carros_v1_${today}`,
      "manutencao_carros_v1_2026-09-09"
    ];
    for (const k of keysToCheck) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const mItems = JSON.parse(raw);
        if (Array.isArray(mItems)) {
          const m = mItems.find((it: any) => String(it.prefixo || "").replace(/\D/g, "") === clean);
          if (m) {
            // Se foi explicitamente marcado como liberado na manutenção:
            if (m.liberado) return null;
            // Se está bloqueado ou em execução na manutenção:
            if (m.bloqueado || m.emExecucao) {
              return {
                id: `manut-lock-${clean}`,
                prefixo: clean,
                garagem: getGaragemFisicaByCarro(clean),
                tipo: m.bloqueado && !m.emExecucao ? "BLOQUEADO_CORRETIVA" : "EM_MANUTENCAO",
                motivo: m.observacao || (m.emExecucao ? "Em Manutenção na Oficina" : "Bloqueado na Manutenção"),
                data: m.data || data || today,
                status: m.emExecucao ? "EM_MANUTENCAO" : "BLOQUEADO",
                responsavel: "Oficina Manutenção"
              };
            }
          }
        }
      }
    }
  } catch {}

  // 2. Consulta a lista de CIs fornecida
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
