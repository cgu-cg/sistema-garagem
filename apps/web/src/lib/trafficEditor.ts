import { defaultScheduleSelection } from './scheduleSelection';
import { copyTrafficBase } from './trafficBases';
import { trafficCommandSchema, trafficModelCommandSchema, type TrafficCommand, type TrafficModelCommand } from './trafficSchema';

export type TrafficEditorDraft = TrafficCommand & { funcionamento: 'DATA' | 'RECORRENTE' };
export function editDatedTraffic(item: TrafficCommand): TrafficEditorDraft {
  return { ...structuredClone(item), origem: { ...item.contexto }, funcionamento: 'DATA' };
}
export function editRecurringTraffic(item: Omit<TrafficModelCommand, 'funcionamento'>, makeId?: () => string): TrafficEditorDraft {
  return { tipo: item.tipo, nome: item.nome, revisao: item.revisao, origemCarros: item.origemCarros,
    itens: item.revisao === 0 && makeId ? copyTrafficBase(item.itens, makeId) : structuredClone(item.itens),
    funcionamento: 'RECORRENTE', contexto: { ...item.contexto, dataOperacao: '' } };
}
export function changeTrafficDate(draft: TrafficEditorDraft, date: string): TrafficEditorDraft {
  const escalaTipo = date ? defaultScheduleSelection(date).dayType : draft.contexto.escalaTipo;
  return { ...draft, contexto: { ...draft.contexto, dataOperacao: date, escalaTipo,
    turno: escalaTipo !== 'SEG_SEX' ? 'PADRAO' : draft.contexto.turno === 'PADRAO' ? 'MATUTINO' : draft.contexto.turno } };
}
export function trafficEditorPayload(draft: TrafficEditorDraft) {
  const { tipo, nome, revisao, itens, origemCarros } = draft;
  if (draft.funcionamento === 'RECORRENTE') {
    const { dataOperacao: _date, ...contexto } = draft.contexto;
    return trafficModelCommandSchema.parse({ tipo, nome, revisao, itens, origemCarros, contexto, funcionamento: 'RECORRENTE' });
  }
  return trafficCommandSchema.parse({ tipo, nome, revisao, itens, origemCarros, contexto: draft.contexto, ...(draft.origem ? { origem: draft.origem } : {}) });
}
