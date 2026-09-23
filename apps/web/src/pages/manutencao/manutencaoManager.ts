import { BloqueioCarro } from "@/data/solturaData";
import { getInitialCIBloqueios, saveCIBloqueiosToStorage, getGaragemFisicaByCarro } from "@/pages/soltura/ciManager";

export interface ManutencaoCarroItem {
  id: string;
  prefixo: string;
  consorciada: "VSF" | "JTU" | "VCG" | "VCM";
  observacao: string;
  bloqueado: boolean;
  emExecucao: boolean;
  liberado: boolean;
  data: string; // YYYY-MM-DD
  updatedAt?: string;
}

export const STORAGE_KEY_MANUTENCAO_PREFIX = "manutencao_carros_v2_";
export const LEGACY_STORAGE_KEY_PREFIX = "manutencao_carros_v1_";
const DEFAULT_REF_DATE = "2026-09-09";

export function getConsorciadaByPrefix(prefixo: string): "VSF" | "JTU" | "VCG" | "VCM" {
  const clean = prefixo.replace(/\D/g, "");
  if (clean.startsWith("1")) return "VCM";
  if (clean.startsWith("2")) return "VSF";
  if (clean.startsWith("3")) return "JTU";
  if (clean.startsWith("4")) return "VCG";
  return "VCG";
}

/**
 * 91 Veículos Oficiais extraídos com precisão da planilha:
 * "CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO" (09/09/2026)
 * - 43 BLOQUEADOS (100% idênticos aos 43 veículos retidos na CI Manutenção)
 * - 19 EM EXECUÇÃO
 * - 48 LIBERADOS
 * Total = 91
 */
export const SEED_MANUTENCAO_OFICIAL: ManutencaoCarroItem[] = [
  // ==========================================
  // BLOCO 1: VSF (Viação São Francisco - 2xxx)
  // 6 Bloqueados (iguais à CI), 1 Em Execução, 17 Liberados = 23 Total
  // ==========================================
  { id: "manut-2424", prefixo: "2424", consorciada: "VSF", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2600", prefixo: "2600", consorciada: "VSF", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2611", prefixo: "2611", consorciada: "VSF", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2700", prefixo: "2700", consorciada: "VSF", observacao: "CÂMBIO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2712", prefixo: "2712", consorciada: "VSF", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2800", prefixo: "2800", consorciada: "VSF", observacao: "SINISTRO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2319", prefixo: "2319", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2323", prefixo: "2323", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2325", prefixo: "2325", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2355", prefixo: "2355", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2409", prefixo: "2409", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2411", prefixo: "2411", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2412", prefixo: "2412", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2420", prefixo: "2420", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2423", prefixo: "2423", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2425", prefixo: "2425", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2426", prefixo: "2426", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2514", prefixo: "2514", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2613", prefixo: "2613", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2615", prefixo: "2615", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2704", prefixo: "2704", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2713", prefixo: "2713", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2801", prefixo: "2801", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },

  // ==========================================
  // BLOCO 2: JTU (Jaguar Transporte - 3xxx)
  // 19 Bloqueados (iguais à CI), 10 Em Execução, 17 Liberados = 36 Total
  // ==========================================
  { id: "manut-3005", prefixo: "3005", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3006", prefixo: "3006", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3014", prefixo: "3014", consorciada: "JTU", observacao: "COXIM MOTOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3057", prefixo: "3057", consorciada: "JTU", observacao: "VIDRO DA JANELA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3078", prefixo: "3078", consorciada: "JTU", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3098", prefixo: "3098", consorciada: "JTU", observacao: "RADIADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3099", prefixo: "3099", consorciada: "JTU", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3100", prefixo: "3100", consorciada: "JTU", observacao: "FALHANDO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3106", prefixo: "3106", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3133", prefixo: "3133", consorciada: "JTU", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3217", prefixo: "3217", consorciada: "JTU", observacao: "ALTERNADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3220", prefixo: "3220", consorciada: "JTU", observacao: "ALINHAMENTO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3224", prefixo: "3224", consorciada: "JTU", observacao: "TACOGRAFO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3230", prefixo: "3230", consorciada: "JTU", observacao: "MANUTENÇÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3257", prefixo: "3257", consorciada: "JTU", observacao: "VIDRO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3903", prefixo: "3903", consorciada: "JTU", observacao: "ALINHAMENTO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3950", prefixo: "3950", consorciada: "JTU", observacao: "CAMBIO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3951", prefixo: "3951", consorciada: "JTU", observacao: "ELÉTRICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3953", prefixo: "3953", consorciada: "JTU", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },

  { id: "manut-3003", prefixo: "3003", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3021", prefixo: "3021", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3034", prefixo: "3034", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3103", prefixo: "3103", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3107", prefixo: "3107", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3132", prefixo: "3132", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3134", prefixo: "3134", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3136", prefixo: "3136", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3139", prefixo: "3139", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3140", prefixo: "3140", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3147", prefixo: "3147", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3148", prefixo: "3148", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3202", prefixo: "3202", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3226", prefixo: "3226", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3281", prefixo: "3281", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3902", prefixo: "3902", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3904", prefixo: "3904", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },

  // ==========================================
  // BLOCO 3: VCG (Viação Campo Grande - 4xxx)
  // 18 Bloqueados (iguais à CI), 8 Em Execução, 14 Liberados = 32 Total
  // ==========================================
  { id: "manut-4178", prefixo: "4178", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4185", prefixo: "4185", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4190", prefixo: "4190", consorciada: "VCG", observacao: "VIDRO BOLHA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4191", prefixo: "4191", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4195", prefixo: "4195", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4196", prefixo: "4196", consorciada: "VCG", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4198", prefixo: "4198", consorciada: "VCG", observacao: "ELÉTRICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4199", prefixo: "4199", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4200", prefixo: "4200", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4201", prefixo: "4201", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4205", prefixo: "4205", consorciada: "VCG", observacao: "SUSPENSÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4212", prefixo: "4212", consorciada: "VCG", observacao: "FREIO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4219", prefixo: "4219", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4221", prefixo: "4221", consorciada: "VCG", observacao: "MOTOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4233", prefixo: "4233", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4255", prefixo: "4255", consorciada: "VCG", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4259", prefixo: "4259", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4269", prefixo: "4269", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },

  { id: "manut-4016", prefixo: "4016", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4181", prefixo: "4181", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4182", prefixo: "4182", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4183", prefixo: "4183", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4188", prefixo: "4188", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4203", prefixo: "4203", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4204", prefixo: "4204", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4213", prefixo: "4213", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4214", prefixo: "4214", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4215", prefixo: "4215", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4238", prefixo: "4238", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4248", prefixo: "4248", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4256", prefixo: "4256", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4263", prefixo: "4263", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE }
];

/**
 * Reconcilia e sincroniza com rigor absoluto a lista de manutenção com os carros da CI:
 * 1. Todos os veículos ativos na CI (status !== "LIBERADO") recebem bloqueado: true e a observação da CI.
 * 2. Carros com status "EM_MANUTENCAO" na CI (ou que estão em reparo) recebem também emExecucao: true.
 * 3. Carros com status "LIBERADO" na CI recebem liberado: true, bloqueado: false, emExecucao: false.
 * 4. Carros que NÃO estão na CI NÃO PODEM estar com bloqueado: true.
 * 5. Carros novos da CI são inseridos imediatamente na lista de manutenção.
 */
export function syncItemsWithCI(
  items: ManutencaoCarroItem[], 
  ciList: BloqueioCarro[], 
  data: string
): ManutencaoCarroItem[] {
  const ciMap = new Map<string, BloqueioCarro>();
  ciList.forEach(ci => {
    if (ci.prefixo) {
      ciMap.set(ci.prefixo.replace(/\D/g, ""), ci);
    }
  });

  const processedPrefixes = new Set<string>();

  // 1. Atualizar carros já presentes na lista de manutenção
  const updatedItems: ManutencaoCarroItem[] = items.map(item => {
    const clean = item.prefixo.replace(/\D/g, "");
    processedPrefixes.add(clean);
    const ci = ciMap.get(clean);

    if (ci) {
      const isLiberadoCI = ci.status === "LIBERADO";
      // Qualquer carro retido na CI é considerado BLOQUEADO no Controle de Manutenção
      const isBloqueadoCI = !isLiberadoCI;
      const isEmExecucaoCI = !isLiberadoCI && (ci.status === "EM_MANUTENCAO" || item.emExecucao);

      return {
        ...item,
        observacao: ci.motivo || item.observacao,
        bloqueado: isBloqueadoCI,
        emExecucao: isEmExecucaoCI,
        liberado: isLiberadoCI,
        data: item.data || data
      };
    } else {
      // Se não consta na CI com bloqueio, não deve estar retido como bloqueado
      if (item.bloqueado) {
        return {
          ...item,
          bloqueado: false,
          liberado: true
        };
      }
      return item;
    }
  });

  // 2. Inserir carros da CI que ainda não faziam parte da lista de manutenção
  ciList.forEach(ci => {
    const clean = ci.prefixo.replace(/\D/g, "");
    if (!processedPrefixes.has(clean)) {
      const isLiberadoCI = ci.status === "LIBERADO";
      const isBloqueadoCI = !isLiberadoCI;
      const isEmExecucaoCI = !isLiberadoCI && ci.status === "EM_MANUTENCAO";

      updatedItems.push({
        id: `manut-ci-${clean}`,
        prefixo: clean,
        consorciada: ci.consorciada || getConsorciadaByPrefix(clean),
        observacao: ci.motivo || "",
        bloqueado: isBloqueadoCI,
        emExecucao: isEmExecucaoCI,
        liberado: isLiberadoCI,
        data: data
      });
      processedPrefixes.add(clean);
    }
  });

  return updatedItems;
}

/**
 * Lê os itens de manutenção da data selecionada, garantindo que os carros
 * bloqueados sejam EXATAMENTE os mesmos da CI Manutenção.
 */
export function getManutencaoData(data: string = DEFAULT_REF_DATE): ManutencaoCarroItem[] {
  const currentCI = getInitialCIBloqueios();
  let baseList: ManutencaoCarroItem[] = [];

  try {
    // Tenta ler da versão 2
    const keyV2 = `${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`;
    const savedV2 = localStorage.getItem(keyV2);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed;
      }
    }

    // Se não encontrou na v2, checa legado v1 para migrar
    if (baseList.length === 0) {
      const keyV1 = `${LEGACY_STORAGE_KEY_PREFIX}${data}`;
      const savedV1 = localStorage.getItem(keyV1);
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (Array.isArray(parsedV1) && parsedV1.length > 0) {
          baseList = parsedV1;
        }
      }
    }
  } catch (e) {
    console.error("Erro ao carregar dados de manutenção do localStorage:", e);
  }

  // Se não existir, utiliza a semente oficial
  if (baseList.length === 0) {
    baseList = SEED_MANUTENCAO_OFICIAL.map(item => ({
      ...item,
      data: data
    }));
  }

  // Sincroniza estritamente com os CIs ativos da oficina
  const synchronized = syncItemsWithCI(baseList, currentCI, data);

  // Persiste a versão reconciliada na chave atualizada
  try {
    localStorage.setItem(`${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`, JSON.stringify(synchronized));
  } catch {}

  return synchronized;
}

/**
 * Salva os itens de manutenção da data e sincroniza bidirecionalmente com a CI e Soltura.
 */
export function saveManutencaoData(data: string, items: ManutencaoCarroItem[]): void {
  try {
    const key = `${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`;
    localStorage.setItem(key, JSON.stringify(items));
    
    // Atualiza também a chave de contingência
    try {
      localStorage.setItem(`${LEGACY_STORAGE_KEY_PREFIX}${data}`, JSON.stringify(items));
    } catch {}

    // Dispara evento de atualização de manutenção
    window.dispatchEvent(new CustomEvent("manutencao_updated", { 
      detail: { data, items } 
    }));

    // Sincroniza bidirecionalmente com a base de CIs
    syncManutencaoToCI(items);
  } catch (e) {
    console.error("Erro ao salvar dados de manutenção:", e);
  }
}

/**
 * Propaga os status da manutenção para a base central de CI Bloqueios
 */
export function syncManutencaoToCI(manutencaoItems: ManutencaoCarroItem[]): void {
  try {
    const currentCI = getInitialCIBloqueios();
    const ciMap = new Map<string, BloqueioCarro>();

    currentCI.forEach(ci => {
      ciMap.set(ci.prefixo.replace(/\D/g, ""), ci);
    });

    let hasChanges = false;

    manutencaoItems.forEach(item => {
      const clean = item.prefixo.replace(/\D/g, "");
      const existing = ciMap.get(clean);

      // CASO 1: LIBERADO
      if (item.liberado || (!item.bloqueado && !item.emExecucao)) {
        if (existing && existing.status !== "LIBERADO") {
          hasChanges = true;
          existing.status = "LIBERADO";
          existing.dataLiberacao = item.data || new Date().toISOString().split("T")[0];
          existing.motivoLiberacao = "Liberado pelo Controle de Manutenção";
        }
      }
      // CASO 2: EM MANUTENÇÃO (REPARO ATIVO)
      else if (item.emExecucao) {
        if (!existing || existing.status !== "EM_MANUTENCAO" || (item.observacao && existing.motivo !== item.observacao)) {
          hasChanges = true;
          if (existing) {
            existing.status = "EM_MANUTENCAO";
            if (item.observacao) existing.motivo = item.observacao;
            existing.dataLiberacao = undefined;
            existing.motivoLiberacao = undefined;
          } else {
            ciMap.set(clean, {
              id: `ci-manut-${clean}`,
              prefixo: clean,
              consorciada: item.consorciada,
              garagem: getGaragemFisicaByCarro(clean),
              tipo: "EM_MANUTENCAO",
              motivo: item.observacao || "Em Execução na Oficina",
              data: item.data || new Date().toISOString().split("T")[0],
              gravidade: "MEDIA",
              status: "EM_MANUTENCAO",
              responsavel: "Oficina Manutenção"
            });
          }
        }
      }
      // CASO 3: BLOQUEADO (AGUARDANDO NA PISTA / OFICINA)
      else if (item.bloqueado) {
        if (!existing || existing.status !== "BLOQUEADO" || (item.observacao && existing.motivo !== item.observacao)) {
          hasChanges = true;
          if (existing) {
            existing.status = "BLOQUEADO";
            if (item.observacao) existing.motivo = item.observacao;
            existing.dataLiberacao = undefined;
            existing.motivoLiberacao = undefined;
          } else {
            ciMap.set(clean, {
              id: `ci-manut-${clean}`,
              prefixo: clean,
              consorciada: item.consorciada,
              garagem: getGaragemFisicaByCarro(clean),
              tipo: item.observacao?.toUpperCase().includes("MOTOR") ? "BLOQUEADO_MOTOR"
                : item.observacao?.toUpperCase().includes("CAMBIO") || item.observacao?.toUpperCase().includes("CÂMBIO") ? "BLOQUEADO_CAMBIO"
                : item.observacao?.toUpperCase().includes("MODULO") || item.observacao?.toUpperCase().includes("MÓDULO") ? "BLOQUEADO_MODULO"
                : item.observacao?.toUpperCase().includes("FREIO") ? "BLOQUEADO_FREIO"
                : item.observacao?.toUpperCase().includes("SUSPENS") || item.observacao?.toUpperCase().includes("MOLA") ? "BLOQUEADO_MOLA"
                : "BLOQUEADO_CORRETIVA",
              motivo: item.observacao || "Bloqueado na Manutenção",
              data: item.data || new Date().toISOString().split("T")[0],
              gravidade: "ALTA",
              status: "BLOQUEADO",
              responsavel: "Oficina Manutenção"
            });
          }
        }
      }
    });

    if (hasChanges) {
      const updatedCI = Array.from(ciMap.values());
      saveCIBloqueiosToStorage(updatedCI);
    }
  } catch (e) {
    console.error("Erro ao sincronizar manutenção com CI:", e);
  }
}

/**
 * Consulta unificada para saber se um carro está impedido pela manutenção ou pela CI
 */
export function checkCarroStatusManutencao(prefixo: string, data?: string): {
  isBloqueado: boolean;
  isEmExecucao: boolean;
  isLiberado: boolean;
  observacao?: string;
  origem: "MANUTENCAO" | "CI" | "LIVRE";
} {
  if (!prefixo) return { isBloqueado: false, isEmExecucao: false, isLiberado: true, origem: "LIVRE" };
  const clean = prefixo.replace(/\D/g, "");

  // 1. Checa a folha de manutenção do dia (já sincronizada com a CI)
  const refDate = data || new Date().toISOString().split("T")[0];
  const manutList = getManutencaoData(refDate);
  const foundManut = manutList.find(m => m.prefixo === clean);

  if (foundManut) {
    if (foundManut.liberado) {
      return { isBloqueado: false, isEmExecucao: false, isLiberado: true, observacao: foundManut.observacao, origem: "MANUTENCAO" };
    }
    if (foundManut.bloqueado || foundManut.emExecucao) {
      return {
        isBloqueado: foundManut.bloqueado,
        isEmExecucao: foundManut.emExecucao,
        isLiberado: false,
        observacao: foundManut.observacao,
        origem: "MANUTENCAO"
      };
    }
  }

  // 2. Fallback na base de CI
  const ciList = getInitialCIBloqueios();
  const foundCI = ciList.find(c => c.prefixo === clean);
  if (foundCI) {
    if (foundCI.status === "LIBERADO") {
      return { isBloqueado: false, isEmExecucao: false, isLiberado: true, observacao: foundCI.motivo, origem: "CI" };
    }
    return {
      isBloqueado: foundCI.status === "BLOQUEADO" || !foundCI.status,
      isEmExecucao: foundCI.status === "EM_MANUTENCAO",
      isLiberado: false,
      observacao: foundCI.motivo,
      origem: "CI"
    };
  }

  return { isBloqueado: false, isEmExecucao: false, isLiberado: true, origem: "LIVRE" };
}

/**
 * Escuta atualizações da tela de manutenção
 */
export function subscribeManutencaoUpdates(callback: (data: { data: string; items: ManutencaoCarroItem[] }) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ data: string; items: ManutencaoCarroItem[] }>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("manutencao_updated", handler);
  return () => {
    window.removeEventListener("manutencao_updated", handler);
  };
}
