import type { TrafficCommand, TrafficModelCommand } from './trafficSchema';
import type { TrafficEditorDraft } from './trafficEditor';
import { defaultScheduleSelection } from './scheduleSelection';

type Catalog = { padroes: Omit<TrafficModelCommand, 'funcionamento'>[]; excecoes: TrafficCommand[] };

// A seleção representa a Escala operacional do mesmo contexto. Exceção da
// data tem prioridade; não permitir escolher um padrão que não será utilizado.
export function trafficScaleLinkOptions(catalog: Catalog | null, draft: TrafficEditorDraft | null) {
  if (!catalog || !draft || draft.tipo !== 'SOLTURA' || draft.contexto.turno === 'VESPERTINO') return [];
  const { garagem, escalaTipo, dataOperacao } = draft.contexto;
  const turno = escalaTipo === 'SEG_SEX' ? 'MATUTINO' : 'PADRAO';
  const compatible = (item: Catalog['padroes'][number] | TrafficCommand) => item.tipo === 'ESCALA'
    && item.contexto.garagem === garagem && item.contexto.escalaTipo === escalaTipo && item.contexto.turno === turno;
  const exception = draft.funcionamento === 'DATA' && dataOperacao
    && defaultScheduleSelection(dataOperacao).dayType === escalaTipo
    ? catalog.excecoes.find(item => compatible(item) && item.contexto.dataOperacao === dataOperacao) : undefined;
  if (exception) return [{ key: `data:${dataOperacao}`, label: `${exception.nome} · ${dataOperacao.split('-').reverse().join('/')}` }];
  const model = catalog.padroes.find(compatible);
  return model ? [{ key: `recorrente:${escalaTipo}`, label: `${model.nome} · Recorrente` }] : [];
}
