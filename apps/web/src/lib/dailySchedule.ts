import type { SolturaItem } from '../data/solturaTypes';
import type { DailyEscala, EscalaContext } from './sharedEscala';
import { currentScaleTemplate } from '../data/scheduleTemplates';

export type FixedScaleRow = SolturaItem & { carroSubstituido?: string; confirmada?: boolean };
export function fixedScheduleRows(contexto: EscalaContext, programacao = currentScaleTemplate(contexto)): FixedScaleRow[] {
  return programacao.map(i => ({ ...i, status: 'PENDENTE' }));
}
export function fixedScheduleToken(contexto: EscalaContext, id: string, programacao = currentScaleTemplate(contexto)) {
  return JSON.stringify(programacao.find(i => i.id === id));
}
export function applyDailySchedule(base: FixedScaleRow[], daily: DailyEscala | null): FixedScaleRow[] {
  const changes = new Map(daily?.itens.map(i => [i.id, i.carroSubstituido]));
  return base.map(item => ({ ...item, carroSubstituido: changes.get(item.id), suspensa: daily?.itens.find(i => i.id === item.id)?.suspensa ?? false, confirmada: daily?.confirmadas?.includes(item.id) ?? false }));
}
