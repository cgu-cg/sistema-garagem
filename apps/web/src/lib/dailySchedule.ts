import type { SolturaItem } from '../data/solturaData';
import type { DailyEscala, EscalaContext } from './sharedEscala';
import fixed from '../data/escalaFixa.json';

export type FixedScaleRow = SolturaItem & { carroSubstituido?: string; confirmada?: boolean };
export function fixedScheduleRows(contexto: EscalaContext): FixedScaleRow[] {
  const key = `${contexto.garagem}_${contexto.escalaTipo}_${contexto.turno}` as keyof typeof fixed;
  return fixed[key].map(i => ({ ...i, status: 'PENDENTE' }));
}
export function fixedScheduleToken(contexto: EscalaContext, id: string) {
  const key = `${contexto.garagem}_${contexto.escalaTipo}_${contexto.turno}` as keyof typeof fixed;
  return JSON.stringify(fixed[key].find(i => i.id === id));
}
export function applyDailySchedule(base: FixedScaleRow[], daily: DailyEscala | null): FixedScaleRow[] {
  const changes = new Map(daily?.itens.map(i => [i.id, i.carroSubstituido]));
  return base.map(item => ({ ...item, carroSubstituido: changes.get(item.id), confirmada: daily?.confirmadas?.includes(item.id) ?? false }));
}
