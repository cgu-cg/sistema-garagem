import type { BloqueioCarro } from '@/data/solturaTypes';
import { api } from '@/lib/api';
import { operationalContext } from '@/lib/mvpTemporal';
import { useAuth } from '@/stores/auth';
import { getCache, compareAndSaveCache, getCacheEntries } from '@/lib/offline-db';
import { createMaintenanceOffline, type MaintenanceLocal } from '@/lib/maintenanceOffline';
import { localMaintenanceSnapshot } from '@/lib/maintenanceLocalDefaults';
import { maintenanceOperationId } from '@/lib/maintenanceCompatibility';
type C4Garage = 'VCG' | 'VCM';
export interface ManutencaoCarroItem {
  id: string;
  prefixo: string;
  consorciada: "VSF" | "JTU" | "VCG" | "VCM";
  observacao: string | null;
  bloqueado: boolean;
  emExecucao: boolean;
  liberado: boolean;
  data: string; // YYYY-MM-DD
  updatedAt?: string;
  observacaoBloqueio?: string | null;
  observacaoOficina?: string | null;
  dataBloqueio?: string;
  campoObservacao?: 'bloqueio' | 'oficina';
}

export const STORAGE_KEY_MANUTENCAO_PREFIX = "manutencao_carros_v2_";
export const LEGACY_STORAGE_KEY_PREFIX = "manutencao_carros_v1_";

export function getTodayString(): string { return operationalContext().today; }

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

/** Classifica bloqueios para exibicao; nao reconcilia nem altera registros. */
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

// Consultas nunca reconciliam a fotografia com a CI atual.
export function syncItemsWithCI(items: ManutencaoCarroItem[], _ciList: BloqueioCarro[], _data: string): ManutencaoCarroItem[] { return items; }

const localStates = new Map<string, MaintenanceLocal>();
const clients = new Map<string, ReturnType<typeof createMaintenanceOffline>>();
function identity(data: string, garagem: C4Garage) {
  const owner = useAuth.getState().user?.id;
  if (!owner) throw Error('Sessao obrigatoria.');
  return { owner, key: `maintenance-independent:v1:${owner}:${garagem}:${data}` };
}
function client(data: string, garagem: C4Garage) {
  const { owner, key } = identity(data, garagem);
  if (!clients.has(key)) {
    let storedVersion: string | null = null;
    clients.set(key, createMaintenanceOffline(key, garagem, data, {
    get: async k => { const value = await getCache(k); storedVersion = value === null ? null : JSON.stringify(value); return value; },
    put: async (k, value) => { await compareAndSaveCache(k, value, storedVersion); storedVersion = JSON.stringify(value); publish(k, value); },
    read: async () => {
      if (useAuth.getState().user?.id !== owner) throw Object.assign(Error('Sessao alterada.'), { status: 403 });
      const result = await api.get('/manutencao', { params: { garagem, data }, timeoutMs: 5000 });
      if (useAuth.getState().user?.id !== owner) throw Object.assign(Error('Sessao alterada.'), { status: 403 });
      return result;
    },
    send: command => {
      if (useAuth.getState().user?.id !== owner) throw Object.assign(Error('Entre com o usuario que criou a pendencia.'), { status: 403 });
      return api.post('/manutencao/sync', command, { timeoutMs: 5000 });
    }, online: () => navigator.onLine, uuid: maintenanceOperationId, today: getTodayString,
    seed: async () => {
      if (data !== getTodayString()) return localMaintenanceSnapshot(garagem, data);
      const entries = await getCacheEntries(`maintenance-independent:v1:${owner}:${garagem}:`);
      const snapshots = entries.map(entry => entry.data?.confirmed ?? (entry.data?.queue?.length ? null : entry.data?.snapshot))
        .filter(snapshot => snapshot?.origem === 'PERSISTIDA' && snapshot.garagem === garagem && snapshot.data < data)
        .sort((a, b) => b.data.localeCompare(a.data));
      return localMaintenanceSnapshot(garagem, data, snapshots[0]);
    },
  }));
  }
  return { key, engine: clients.get(key)! };
}
function publish(key: string, value: MaintenanceLocal) {
  localStates.set(key, value);
  window.dispatchEvent(new CustomEvent('manutencao_updated', { detail: {
    userId: Number(key.split(':')[2]), data: value.snapshot.data, garagem: value.snapshot.garagem, items: value.snapshot.items,
  } }));
}
export function getMaintenanceSyncStatus(data: string, garagem: C4Garage) {
  try { const value = localStates.get(identity(data, garagem).key); return { pending: value?.queue.length ?? 0, issue: value?.issue ?? '', notice: value?.notice ?? '', offline: value?.offline ?? !navigator.onLine }; }
  catch { return { pending: 0, issue: '', notice: '', offline: !navigator.onLine }; }
}
export async function listMaintenancePendingDates(garagem: C4Garage): Promise<{ data: string; count: number }[]> {
  const owner = useAuth.getState().user?.id;
  if (!owner) return [];
  const entries = await getCacheEntries(`maintenance-independent:v1:${owner}:${garagem}:`);
  return entries.filter(entry => entry.data?.queue?.length).map(entry => ({ data: entry.data.snapshot.data, count: entry.data.queue.length }));
}
export function getManutencaoData(data = getTodayString(), garagem: C4Garage = 'VCG'): ManutencaoCarroItem[] {
  try { return localStates.get(identity(data, garagem).key)?.snapshot.items ?? []; } catch { return []; }
}
export async function fetchManutencaoDataFromApi(data = getTodayString(), garagem?: string): Promise<ManutencaoCarroItem[]> {
  if (garagem !== 'VCG' && garagem !== 'VCM') throw Error('Selecione uma garagem explicitamente.');
  const { owner } = identity(data, garagem);
  const entries = await getCacheEntries(`maintenance-independent:v1:${owner}:${garagem}:`);
  let expired = 0;
  for (const entry of entries) if (entry.data?.queue?.length && entry.data.snapshot.data < getTodayString())
    expired += await client(entry.data.snapshot.data, garagem).engine.expire();
  const { key, engine } = client(data, garagem);
  const value = await engine.load();
  if (expired) value.notice = `${expired} alteracao(oes) de dias anteriores nao sincronizada(s) foram descartadas.`;
  publish(key, value); return value.snapshot.items;
}
export async function saveManutencaoData(data: string, items: ManutencaoCarroItem[], confirmRelease: boolean,
  baseline: ManutencaoCarroItem[], _removeBlocked: string[] = [], garagem: C4Garage = 'VCG'): Promise<ManutencaoCarroItem[]> {
  if (data !== getTodayString() || !operationalContext(new Date(), 72000).open) throw Error('Controle fora do dia/janela 03:00 ate 20:00.');
  const { key, engine } = client(data, garagem);
  const value = await engine.save(items, confirmRelease, baseline); publish(key, value); return value.snapshot.items;
}
export async function discardMaintenancePending(data: string, garagem: C4Garage) {
  const { key, engine } = client(data, garagem);
  const value = await engine.discard(); publish(key, value); return value.snapshot.items;
}
export async function deleteManutencaoCarroApi(_id: string): Promise<void> { throw Error('Use o comando com contexto.'); }
export const resetManutencaoSeedApi = fetchManutencaoDataFromApi;
export function subscribeManutencaoUpdates(callback: (data: { data: string; garagem?: C4Garage; items: ManutencaoCarroItem[] }) => void) {
  const handler = (event: Event) => { const detail = (event as CustomEvent).detail;
    if (detail.userId === useAuth.getState().user?.id) callback(detail);
  };
  window.addEventListener('manutencao_updated', handler);
  return () => window.removeEventListener('manutencao_updated', handler);
}
