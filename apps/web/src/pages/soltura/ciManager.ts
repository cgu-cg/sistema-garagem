import { BloqueioCarro } from "@/data/solturaData";
import { api } from "@/lib/api";

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

export function getHojeIso(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function getInitialCIBloqueios(): BloqueioCarro[] {
  try {
    const savedV2 = localStorage.getItem(STORAGE_KEY);
    if (savedV2 !== null) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed)) {
        // Filtra quaisquer sementes antigas de teste que começavam com ci-doc-
        const userCreated = parsed.filter((item: BloqueioCarro) => !item.id?.startsWith("ci-doc-"));
        if (userCreated.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreated));
        }
        return userCreated;
      }
    }
  } catch (e) {
    console.error("Erro ao ler CIs do localStorage:", e);
  }
  return [];
}

export function saveCIBloqueiosToStorage(list: BloqueioCarro[], syncFolhas = true): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Disparar evento customizado para sincronização entre componentes
    window.dispatchEvent(new CustomEvent("ci_bloqueios_updated", { detail: list }));

    if (!syncFolhas) return;

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
                }
                return m;
              });

              // Insere carros da CI não presentes na folha (APENAS BLOQUEADOS REAIS DE FROTA)
              list.forEach(ci => {
                // Preventiva, oficina e reforço não viram bloqueados na folha de manutenção
                const isRealBloqueado = ci.categoriaPlanilha === "BLOQUEADO" || (!ci.categoriaPlanilha && !ci.setorOficina && !ci.tipoPreventiva && !ci.horarioReforco);
                if (!isRealBloqueado || ci.status === "LIBERADO") return;

                const clean = ci.prefixo.replace(/\D/g, "");
                if (!handledPrefixes.has(clean)) {
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

/**
 * Consulta a lista de Bloqueios da CI diretamente do banco de dados oficial (SQL Server)
 * e atualiza o cache local.
 */
export async function fetchCIBloqueiosFromApi(params?: { garagem?: string; status?: string }): Promise<BloqueioCarro[]> {
  try {
    const data = await api.listCiBloqueios(params);
    if (Array.isArray(data)) {
      // Filtra quaisquer sementes antigas com prefixo ci-doc-*
      const userCreated = data.filter((item: BloqueioCarro) => !item.id?.startsWith("ci-doc-"));
      saveCIBloqueiosToStorage(userCreated);
      return userCreated;
    }
  } catch (err) {
    console.warn("[CI Manager] Falha ao carregar bloqueios da API, usando cache local:", err);
  }

  return getInitialCIBloqueios();
}

/**
 * Persiste um bloqueio no banco de dados oficial em segundo plano.
 */
export async function persistCIBloqueio(item: BloqueioCarro): Promise<void> {
  try {
    await api.createOrUpdateCiBloqueio({
      id: item.id,
      prefixo: item.prefixo,
      garagem: item.garagem,
      consorciada: item.consorciada,
      categoriaPlanilha: item.categoriaPlanilha || "OFICINA",
      setorOficina: item.setorOficina,
      tipoPreventiva: item.tipoPreventiva,
      horarioReforco: item.horarioReforco,
      motivo: item.motivo,
      data: item.data,
      hora: item.hora,
      gravidade: item.gravidade || "ALTA",
      responsavel: item.responsavel,
      observacoes: item.os,
      status: item.status || "BLOQUEADO",
    });
  } catch (err) {
    console.error("[CI Manager] Erro ao persistir bloqueio no banco:", err);
  }
}

/**
 * Registra a liberação (baixa) de um carro bloqueado no banco de dados.
 */
export async function releaseCIBloqueioApi(data: {
  id?: string;
  prefixo?: string;
  motivoLiberacao?: string;
  responsavelLiberacao?: string;
}): Promise<void> {
  try {
    await api.releaseCiBloqueio(data);
  } catch (err) {
    console.error("[CI Manager] Erro ao liberar carro no banco:", err);
  }
}

/**
 * Remove um bloqueio no banco de dados.
 */
export async function deleteCIBloqueioApi(id: string): Promise<void> {
  try {
    await api.deleteCiBloqueio(id);
  } catch (err) {
    console.error("[CI Manager] Erro ao remover bloqueio no banco:", err);
  }
}

