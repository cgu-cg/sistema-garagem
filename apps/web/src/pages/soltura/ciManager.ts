import { BloqueioCarro } from "@/data/solturaData";
import { api } from "@/lib/api";
import { c4Context, c4Enabled, c4Items, c4SnapshotRevision, fetchC4Context, storeC4Context, C4Garage } from '@/lib/c4';
import { operationalContext, canMutate, revision, beginMutation, endMutation, requireRefresh, SavedRefreshRequired, getMutationState, readTicket, assertReadTicket } from "@/lib/mvpTemporal";
import { ReadInterrupted } from '@/lib/readCoordination';
export type CIUpdateContext = { garagem: C4Garage; day: string };
let officialCI: BloqueioCarro[] | null = null;
let officialGarage: C4Garage = 'VCG';
export const getCurrentCIGarage = () => officialGarage;
let requestNumber = 0;
const ciReads = new Map<string, Promise<BloqueioCarro[]>>();

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

export function getHojeIso(): string { return operationalContext().today; }

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

export function saveCIBloqueiosToStorage(list: BloqueioCarro[], _syncFolhas = false, context?: CIUpdateContext): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* Cache nao e autoridade operacional. */ }
  window.dispatchEvent(Object.assign(new CustomEvent('ci_bloqueios_updated', { detail: list }), { context }));
}

export function checkCarroBloqueado(prefixo: string, list: BloqueioCarro[], data?: string): BloqueioCarro | null {
  if (!prefixo) return null;
  const clean = prefixo.replace(/\D/g, "");
  if (c4Enabled(officialGarage)) {
    const selectedDay = data || operationalContext().today;
    const ctx = c4Context(officialGarage, selectedDay);
    const maintenance = ctx?.maintenance?.find(i => i.prefixo === clean);

    if (maintenance?.bloqueado || maintenance?.emExecucao) return { id: maintenance.id, prefixo: clean, consorciada: maintenance.consorciada, garagem: officialGarage, data: selectedDay,
      tipo: maintenance.bloqueado ? 'BLOQUEADO_CORRETIVA' : 'EM_MANUTENCAO', motivo: (maintenance.bloqueado ? maintenance.observacaoBloqueio : maintenance.observacaoOficina) ?? null, status: maintenance.bloqueado ? 'BLOQUEADO' : 'EM_MANUTENCAO' };
    return list.find(i => i.prefixo === clean && i.data === selectedDay && i.garagem === officialGarage && i.categoriaPlanilha === 'BLOQUEADO') || null;
  }

  // Cache local nunca determina disponibilidade oficial.
  // 2. Consulta a lista de CIs fornecida (apenas bloqueios reais de frota)
  return list.find(b => 
    b.status !== "LIBERADO" &&
    (b.status === "BLOQUEADO" || b.status === "EM_MANUTENCAO" || b.status === "AGUARDANDO_PECA" || !b.status) &&
    (b.categoriaPlanilha === "BLOQUEADO" || (!b.categoriaPlanilha && !b.setorOficina && !b.tipoPreventiva && !b.horarioReforco)) &&
    (b.prefixo === clean || b.prefixo === prefixo)
  ) || null;
}

export function subscribeCIUpdates(callback: (list: BloqueioCarro[], context?: CIUpdateContext) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BloqueioCarro[]> & { context?: CIUpdateContext };
    if (customEvent.detail) {
      callback(customEvent.detail, customEvent.context);
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
export async function fetchCIBloqueiosFromApi(params?: { garagem?: string; status?: string }, afterCommit = false): Promise<BloqueioCarro[]> {
  if (getMutationState().pending && !afterCommit) throw new ReadInterrupted('MUTATION', 'Gravacao pendente; aguarde antes de consultar.');
  const ticket = readTicket();
  const normalized = { garagem: params?.garagem === 'TODAS' ? undefined : params?.garagem, status: params?.status };
  const key = JSON.stringify([ticket, normalized]);
  const running = ciReads.get(key);
  if (running) return running;
  const number = ++requestNumber;
  const request = (async () => {
    const scope = (normalized.garagem || 'VCG') as C4Garage;
    const day = operationalContext().today;
    const context = await fetchC4Context(scope, day);
    const data = context.mode === 'C4' ? context.ci! : await api.listCiBloqueios({ ...normalized, ...(context.garages?.length ? { garagem: scope } : {}) });
    assertReadTicket(ticket);
    if (number !== requestNumber) throw new ReadInterrupted('SUPERSEDED', 'Consulta substituida por uma mais recente.');
    if (!Array.isArray(data)) throw new Error('Resposta invalida ao consultar CI.');
    storeC4Context(context, day);
    officialGarage = scope;
    officialCI = data; saveCIBloqueiosToStorage(data, false, { garagem: scope, day });
    return data;
  })();
  ciReads.set(key, request);
  try { return await request; } finally { if (ciReads.get(key) === request) ciReads.delete(key); }
}

export async function saveCISnapshot(list: BloqueioCarro[], date: string, baseline: BloqueioCarro[], removeBlocked: string[] = [], operation: 'save' | 'prepare' = 'save', garagem: C4Garage = 'VCG', tituloColunaAdicional?: string): Promise<BloqueioCarro[]> {
  if (!canMutate(date, 'ci', c4Enabled(garagem))) throw new Error('CI fora da janela de edicao.');
  if (!officialCI) throw new Error('Carregue a CI oficial antes de alterar.');
  const current = baseline.filter(i => i.data === date && i.garagem === garagem);
  const items = operation === 'prepare' ? [] : list.filter(i => i.data === date && i.garagem === garagem);
  beginMutation();
  let saved = false;
  try {
    const snapshot = c4Enabled(garagem) ? c4SnapshotRevision(baseline, garagem, date, 'ci') : undefined;
    await api.post('/ci-bloqueios/sync', { garagem, data: date, items: c4Enabled(garagem) ? c4Items(items) : items, base: revision(current), removeBlocked, operation,
      ...(snapshot ? { ...snapshot, tituloColunaAdicional } : {}) });
    saved = true;
    return await fetchCIBloqueiosFromApi({ garagem }, true);
  } catch (error) {
    requireRefresh();
    if (saved) throw new SavedRefreshRequired();
    throw error;
  } finally { endMutation(); }
}
// Compatibilidade para consumidores externos: erro explicito, sem gravação global por prefixo.
export async function persistCIBloqueio(_item: BloqueioCarro): Promise<void> {
  throw new Error('Use o comando de CI com contexto e versao.');
}
export async function releaseCIBloqueioApi(_data: { id?: string; prefixo?: string; dataLiberacao?: string; motivoLiberacao?: string; responsavelLiberacao?: string }): Promise<void> {
  throw new Error('Use a retirada direcionada da CI em preparacao.');
}
export async function deleteCIBloqueioApi(_id: string): Promise<void> {
  throw new Error('Use a retirada direcionada da CI em preparacao.');
}
