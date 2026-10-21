import type { SolturaItem } from '../data/solturaTypes';
import type { DailyEscala, EscalaContext } from './sharedEscala';
import { currentScaleTemplate } from '../data/scheduleTemplates';

export type FixedScaleRow = SolturaItem & { carroSubstituido?: string; confirmada?: boolean };
export function fixedScheduleRows(contexto: EscalaContext): FixedScaleRow[] {
  return currentScaleTemplate(contexto).map(i => ({ ...i, status: 'PENDENTE' }));
}
export function fixedScheduleToken(contexto: EscalaContext, id: string) {
  return JSON.stringify(currentScaleTemplate(contexto).find(i => i.id === id));
}
export function applyDailySchedule(base: FixedScaleRow[], daily: DailyEscala | null): FixedScaleRow[] {
  const changes = new Map(daily?.itens.map(i => [i.id, i.carroSubstituido]));
  return base.map(item => ({ ...item, carroSubstituido: changes.get(item.id), confirmada: daily?.confirmadas?.includes(item.id) ?? false }));
}
