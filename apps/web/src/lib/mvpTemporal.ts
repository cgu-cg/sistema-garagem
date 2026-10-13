import { ReadInterrupted } from './readCoordination';

export function operationalContext(now = new Date(), closingSeconds = 66600) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const seconds = Number(get('hour')) * 3600 + Number(get('minute')) * 60 + Number(get('second'));
  return { today, tomorrow: tomorrow.toISOString().slice(0, 10), open: seconds >= 10800 && seconds < closingSeconds };
}

export function canMutate(date: string, kind: 'ci' | 'manutencao', c4 = false) {
  const ctx = operationalContext(new Date(), c4 ? 72000 : 66600);
  return ctx.open && date === (kind === 'ci' ? ctx.tomorrow : ctx.today);
}

// CI e Controle compartilham a mesma operacao VCG. Estado apenas de UX,
// sem autoridade sobre preparacao, autorizacao ou versao do banco.
let mutationState = { pending: false, refreshRequired: false };
let readEpoch = 0;
const listeners = new Set<() => void>();
export const getMutationState = () => mutationState;
export function subscribeMutationState(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notifyMutationState() { listeners.forEach(listener => listener()); }
export function beginMutation() {
  if (mutationState.pending || mutationState.refreshRequired) throw new Error('Operacao pendente ou lista precisa ser atualizada.');
  readEpoch++;
  mutationState = { ...mutationState, pending: true }; notifyMutationState();
}
export function endMutation() { mutationState = { ...mutationState, pending: false }; notifyMutationState(); }
export function requireRefresh() { mutationState = { ...mutationState, refreshRequired: true }; notifyMutationState(); }
export function confirmRefresh() {
  if (mutationState.pending) return;
  mutationState = { ...mutationState, refreshRequired: false }; notifyMutationState();
}
export function readTicket() { return readEpoch; }
export function assertReadTicket(ticket: number) {
  if (ticket !== readEpoch) throw new ReadInterrupted('MUTATION', 'Consulta anterior a uma mutacao; atualize a lista.');
}
export class SavedRefreshRequired extends Error {
  constructor() { super('Alteracao salva, mas nao foi possivel atualizar os dados. Atualize a lista antes de continuar.'); }
}
export function revision(items: readonly { id?: string; updatedAt?: unknown }[]) {
  // Conteudo + timestamp: duas gravacoes no mesmo milissegundo nao compartilham versao.
  return JSON.stringify(items.map(item => {
    const i = item as Record<string, any>;
    const category = i.categoria ?? i.categoriaPlanilha ?? null;
    // Date.toString() descarta milissegundos; preserve o instante antes do transporte JSON.
    const updatedAt = i.updatedAt instanceof Date ? i.updatedAt.toISOString() : new Date(String(i.updatedAt)).toISOString();
    return [i.id, updatedAt, i.prefixo, i.consorciada,
      i.data ?? i.dataBloqueio, i.garagem ?? null, category, i.observacao ?? null,
      i.bloqueado ?? null, i.emExecucao ?? null, i.liberado ?? null,
      i.motivo || '', category === 'OFICINA' || category === 'PREVENTIVA' ? (i.subTipo ?? i.setorOficina ?? i.tipoPreventiva ?? '') : '',
      i.horarioReforco || '', i.horaBloqueio ?? i.hora ?? '', i.responsavel || '',
      i.observacoes ?? i.os ?? '', i.status || 'BLOQUEADO', i.gravidade || 'ALTA', i.dataLiberacao || '', i.motivoLiberacao || '', i.responsavelLiberacao || '',
      ...(i.chaveItem ? [i.chaveItem, i.tipoPosicao ?? null, i.ordemPosicao ?? null, i.dataBloqueio ?? null] : i.cicloId ? [i.observacaoBloqueio ?? null, i.observacaoOficina ?? null] : [])];
  }).sort((a, b) => String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0));
}
