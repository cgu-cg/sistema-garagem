import { BloqueioCarro } from "@/data/solturaData";
import { getInitialCIBloqueios, saveCIBloqueiosToStorage, getGaragemFisicaByCarro, deleteCIBloqueioApi } from "@/pages/soltura/ciManager";
import { api } from "@/lib/api";

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

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DEFAULT_REF_DATE = getTodayString();

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
export function isRealBloqueadoCI(ci: BloqueioCarro): boolean {
  if (!ci) return false;
  // Carros de PREVENTIVA, OFICINA e REFORÇO são serviços diários pontuais daquele dia e NÃO são bloqueios de frota
  if (ci.categoriaPlanilha === "PREVENTIVA" || ci.categoriaPlanilha === "OFICINA" || ci.categoriaPlanilha === "REFORCO") {
    return false;
  }
  if (ci.tipoPreventiva || ci.setorOficina || ci.horarioReforco) {
    return false;
  }
  return ci.categoriaPlanilha === "BLOQUEADO" || !ci.categoriaPlanilha;
}

/**
 * Reconcilia e sincroniza com rigor absoluto a lista de manutenção com os carros bloqueados da CI:
 * 1. Apenas veículos com bloqueio real ativo de frota na CI (categoriaPlanilha === "BLOQUEADO") recebem bloqueado: true.
 * 2. Carros de Preventivas, Setores da Oficina e Reforço não entram como bloqueados da frota.
 * 3. Carros com status "LIBERADO" na CI ou que não constam como bloqueio real não permanecem como bloqueados gerados automaticamente.
 */
export function syncItemsWithCI(
  items: ManutencaoCarroItem[], 
  ciList: BloqueioCarro[], 
  data: string
): ManutencaoCarroItem[] {
  const ciMap = new Map<string, BloqueioCarro>();
  ciList.forEach(ci => {
    // REGRA CRÍTICA: Bloqueios criados em datas futuras NUNCA devem aparecer no passado
    const ciDate = ci.dataBloqueio || ci.data || "";
    if (ciDate && ciDate > data) return;

    // Apenas bloqueados ATIVOS da CI alimentam a folha
    if (ci.prefixo && isRealBloqueadoCI(ci) && ci.status !== "LIBERADO") {
      const clean = ci.prefixo.replace(/\D/g, "");
      if (clean) {
        ciMap.set(clean, ci);
      }
    }
  });

  const processedPrefixes = new Set<string>();
  const updatedItems: ManutencaoCarroItem[] = [];

  // 1. Processar itens já presentes na folha de manutenção
  items.forEach(item => {
    const clean = (item.prefixo || "").replace(/\D/g, "");
    if (!clean) return;

    // Remove resíduos antigos gerados por sincronização indevida
    const obsUpper = (item.observacao || "").toUpperCase();
    if (obsUpper.includes("LIBERADO PELA CI")) {
      return;
    }

    const ci = ciMap.get(clean);

    // REGRA: "as listas de em manutencao e liberados sejam idependentes, os dados dela sao salvos na tabela no banco relacionada ao controle de manutencao e nao da ci."
    // Preserva intactos os veículos de Em Manutenção e Liberados da data atual
    if (item.emExecucao || item.liberado) {
      if (item.data && item.data !== data) {
        return; // Não aparece no próximo dia
      }
      processedPrefixes.add(clean);
      updatedItems.push({
        ...item,
        // Garante que não fiquem marcados como bloqueados
        bloqueado: false,
      });
      return;
    }

    // Para a lista de Bloqueados: APENAS ela tem vínculo com a CI
    // Se o carro está na folha como bloqueado, mas NÃO consta como bloqueado ativo na CI, descarta
    if (!ci && item.bloqueado) {
      return;
    }

    // Se o carro consta como bloqueado ativo na CI
    if (ci) {
      processedPrefixes.add(clean);
      updatedItems.push({
        ...item,
        consorciada: ci.consorciada || item.consorciada || getConsorciadaByPrefix(clean),
        observacao: item.observacao || ci.motivo || "",
        bloqueado: true,
        emExecucao: false,
        liberado: false,
        data: item.data || data
      });
      return;
    }

    // Se é outro registro da folha de manutenção, preserva
    processedPrefixes.add(clean);
    updatedItems.push(item);
  });

  // 2. Inserir carros da CI que ainda não constam na lista (APENAS BLOQUEADOS REAIS ATIVOS até a data consultada)
  ciList.forEach(ci => {
    const ciDate = ci.dataBloqueio || ci.data || "";
    if (ciDate && ciDate > data) return;
    if (ci.status === "LIBERADO" || !isRealBloqueadoCI(ci)) return;
    const clean = (ci.prefixo || "").replace(/\D/g, "");
    if (!clean) return;

    if (!processedPrefixes.has(clean)) {
      updatedItems.push({
        id: `manut-ci-${clean}`,
        prefixo: clean,
        consorciada: ci.consorciada || getConsorciadaByPrefix(clean),
        observacao: ci.motivo || "",
        bloqueado: true,
        emExecucao: false,
        liberado: false,
        data: data
      });
      processedPrefixes.add(clean);
    }
  });

  return updatedItems;
}

/**
 * Lê os itens de manutenção da data selecionada.
 * - Se não houver dados salvos para a data, herda da data anterior mais recente salva no histórico.
 * - Garante que bloqueios criados no futuro nunca vazem para o passado.
 */
export function getManutencaoData(data: string = getTodayString()): ManutencaoCarroItem[] {
  const currentCI = getInitialCIBloqueios();
  let baseList: ManutencaoCarroItem[] = [];

  try {
    const keyV2 = `${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`;
    const savedV2 = localStorage.getItem(keyV2);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Regra: o que foi adicionado em manutenção ou liberado em um dia NÃO deve aparecer no próximo
        baseList = parsed.filter(it => {
          if ((it.emExecucao || it.liberado) && it.data && it.data !== data) {
            return false;
          }
          return true;
        });
      }
    }
  } catch (e) {
    console.error("Erro ao carregar dados de manutenção do localStorage:", e);
  }

  // Se a lista estiver vazia para a data, procura a data anterior mais recente no cache
  if (baseList.length === 0) {
    try {
      const pastDates: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_MANUTENCAO_PREFIX)) {
          const datePart = k.replace(STORAGE_KEY_MANUTENCAO_PREFIX, "");
          // Apenas datas anteriores à data consultada!
          if (datePart < data && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            pastDates.push(datePart);
          }
        }
      }
      pastDates.sort().reverse(); // A mais recente anterior primeiro

      if (pastDates.length > 0) {
        const prevKey = `${STORAGE_KEY_MANUTENCAO_PREFIX}${pastDates[0]}`;
        const prevSaved = localStorage.getItem(prevKey);
        if (prevSaved) {
          const prevParsed = JSON.parse(prevSaved);
          if (Array.isArray(prevParsed) && prevParsed.length > 0) {
            // Regra: "as listas de em manutencao e liberado o q foi adicionado hj no proximo dia nao aparecer mais"
            // Herda APENAS os veículos bloqueados vigentes da data anterior
            baseList = prevParsed
              .filter((it: ManutencaoCarroItem) => it.bloqueado && !it.emExecucao && !it.liberado)
              .map((it: ManutencaoCarroItem) => ({
                ...it,
                id: `manut-${data}-${it.prefixo}`,
                data: data,
                bloqueado: true,
                emExecucao: false,
                liberado: false
              }));
          }
        }
      }
    } catch (_) {}
  }

  // Se ainda estiver vazia, gera apenas com os carros bloqueados reais da CI criados até esta data
  if (baseList.length === 0) {
    baseList = currentCI
      .filter(ci => {
        const ciDate = ci.dataBloqueio || ci.data || "";
        if (ciDate && ciDate > data) return false;
        return ci.status !== "LIBERADO" && ci.prefixo && isRealBloqueadoCI(ci);
      })
      .map(ci => {
        const clean = ci.prefixo.replace(/\D/g, "");
        return {
          id: `manut-ci-${clean}`,
          prefixo: clean,
          consorciada: ci.consorciada || getConsorciadaByPrefix(clean),
          observacao: ci.motivo || "",
          bloqueado: true,
          emExecucao: false,
          liberado: false,
          data: data
        };
      });
  }

  // Sincroniza estritamente os bloqueados com a CI respeitando a data
  const synchronized = syncItemsWithCI(baseList, currentCI, data);

  // Persiste no cache
  try {
    localStorage.setItem(`${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`, JSON.stringify(synchronized));
  } catch {}

  return synchronized;
}

/**
 * Busca a folha de manutenção diretamente do banco de dados (API REST / SQL Server)
 */
export async function fetchManutencaoDataFromApi(data: string = getTodayString(), garagem?: string): Promise<ManutencaoCarroItem[]> {
  try {
    const params: Record<string, string> = { data };
    if (garagem && garagem !== "TODAS") {
      params.garagem = garagem;
    }
    const response = await api.get<any[]>("/manutencao", {
      params
    });

    if (response && Array.isArray(response)) {
      const dbItems: ManutencaoCarroItem[] = response.map((it: any) => ({
        id: String(it.id),
        prefixo: String(it.prefixo),
        consorciada: (it.consorciada as any) || getConsorciadaByPrefix(it.prefixo),
        observacao: String(it.observacao || ""),
        bloqueado: Boolean(it.bloqueado),
        emExecucao: Boolean(it.emExecucao),
        liberado: Boolean(it.liberado),
        data: String(it.data || data)
      }));

      // Atualiza o cache local com a verdade absoluta do banco de dados (mesmo se vazio)
      const key = `${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`;
      try {
        localStorage.setItem(key, JSON.stringify(dbItems));
      } catch {}

      return dbItems;
    }
  } catch (error) {
    console.warn("[Manutenção] Falha ao carregar do banco de dados, usando fallback local:", error);
  }

  return getManutencaoData(data);
}

/**
 * Salva os itens de manutenção da data e sincroniza bidirecionalmente com a CI, Soltura e Banco de Dados.
 */
/**
 * Salva os itens de manutenção da data e sincroniza bidirecionalmente com a CI, Soltura e Banco de Dados.
 * Propaga automaticamente adições e atualizações para as datas futuras.
 */
export function saveManutencaoData(data: string, items: ManutencaoCarroItem[]): void {
  try {
    const key = `${STORAGE_KEY_MANUTENCAO_PREFIX}${data}`;
    localStorage.setItem(key, JSON.stringify(items));
    
    // Atualiza também a chave de contingência
    try {
      localStorage.setItem(`${LEGACY_STORAGE_KEY_PREFIX}${data}`, JSON.stringify(items));
    } catch {}

    // Propaga adições e alterações para o cache de datas futuras já abertas:
    // APENAS bloqueados vigentes são propagados para o futuro.
    // Veículos em manutenção ou liberados pertencem estritamente à data de lançamento e NÃO aparecem nos próximos dias.
    try {
      const liberadosSet = new Set(items.filter(it => it.liberado).map(it => it.prefixo));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_MANUTENCAO_PREFIX)) {
          const datePart = k.replace(STORAGE_KEY_MANUTENCAO_PREFIX, "");
          if (datePart > data && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            const futureRaw = localStorage.getItem(k);
            if (futureRaw) {
              const futureList: ManutencaoCarroItem[] = JSON.parse(futureRaw);
              if (Array.isArray(futureList)) {
                // Se algum carro foi liberado hoje, garante que nas datas futuras ele não conste mais como bloqueado
                let merged = futureList.filter(f => !liberadosSet.has(f.prefixo));

                const existingPrefixes = new Set(merged.map(f => f.prefixo));
                for (const item of items) {
                  // NÃO propaga em manutenção nem liberado para dias futuros!
                  if (item.emExecucao || item.liberado || !item.bloqueado) continue;

                  if (!existingPrefixes.has(item.prefixo)) {
                    merged.push({
                      ...item,
                      id: `manut-${datePart}-${item.prefixo}`,
                      data: datePart,
                      bloqueado: true,
                      emExecucao: false,
                      liberado: false
                    });
                  }
                }
                localStorage.setItem(k, JSON.stringify(merged));
              }
            }
          }
        }
      }
    } catch (_) {}

    // Dispara evento de atualização de manutenção
    window.dispatchEvent(new CustomEvent("manutencao_updated", { 
      detail: { data, items } 
    }));

    // Sincroniza bidirecionalmente com a base de CIs
    syncManutencaoToCI(items);

    // Persiste no banco de dados via API REST
    api.post("/manutencao/sync", { data, items }).catch((err: any) => {
      console.error("[Manutenção] Erro ao sincronizar folha com o banco de dados:", err);
    });
  } catch (e) {
    console.error("Erro ao salvar dados de manutenção:", e);
  }
}

/**
 * Remove um veículo diretamente do banco de dados e da folha
 */
export async function deleteManutencaoCarroApi(id: string): Promise<void> {
  try {
    await api.delete(`/manutencao/${encodeURIComponent(id)}`);
  } catch (e) {
    console.error("[Manutenção] Erro ao excluir veículo no banco de dados:", e);
  }
}

/**
 * Restaura a base de dados oficial no banco de dados
 */
export async function resetManutencaoSeedApi(data: string): Promise<ManutencaoCarroItem[]> {
  try {
    const res = await api.post<any>("/manutencao/reset", { data });
    if (res?.records && Array.isArray(res.records)) {
      return res.records;
    }
  } catch (e) {
    console.error("[Manutenção] Erro ao resetar semente no banco de dados:", e);
  }
  return SEED_MANUTENCAO_OFICIAL.map(it => ({ ...it, data }));
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

      // REGRA: "apenas a lista de bloqueados tenha vinculo com a CI, mas as listas de em manutencao e liberados sejam idependentes"
      // Se o carro foi liberado ou está em manutenção interna (não bloqueado), remove de bloqueios da CI se constava lá
      if (item.liberado || item.emExecucao || !item.bloqueado) {
        if (existing) {
          hasChanges = true;
          ciMap.delete(clean);
        }
        deleteCIBloqueioApi(clean);
      }
      // CASO BLOQUEADO: Único que mantém vínculo direto com a CI
      else if (item.bloqueado && !item.emExecucao && !item.liberado) {
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
      saveCIBloqueiosToStorage(updatedCI, false);
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
