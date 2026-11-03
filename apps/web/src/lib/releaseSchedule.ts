import { currentReleaseTemplate, type TemplateContext } from '../data/scheduleTemplates';
import type { SolturaItem } from '../data/solturaTypes';

export function releaseScheduleBase(context: TemplateContext, published?: SolturaItem[]): SolturaItem[] {
  if (context.garagem !== 'VCG' && published) return published;
  return currentReleaseTemplate(context).map(row => ({ ...row, status: 'PENDENTE' }));
}
export interface ReleaseRecord {
  status?: string | null;
  carroRealizado: string; motoristaCodigo: string; motoristaNome: string; horaLiberacao: string;
  observacoes?: string; substituido: boolean; carroProgramado?: string; scheduleSnapshot?: SolturaItem;
}
export function isActiveReleaseRecord(record: { status?: string | null }) { return record.status !== 'PENDENTE'; }
export function applyReleaseRecords(base: SolturaItem[], records: Record<string, ReleaseRecord>, includeRemoved = false): SolturaItem[] {
  const ids = new Set(base.map(row => row.id));
  const removed = includeRemoved ? Object.entries(records).flatMap(([id, record]) =>
    isActiveReleaseRecord(record) && !ids.has(id) && record.scheduleSnapshot ? [{ ...record.scheduleSnapshot, id }] : []) : [];
  return [...base, ...removed].map(row => {
    const record = records[row.id];
    return record && isActiveReleaseRecord(record) ? { ...row, ...record.scheduleSnapshot, id: row.id, carroProgramado: record.carroProgramado ?? record.scheduleSnapshot?.carroProgramado ?? row.carroProgramado,
      carroRealizado: record.carroRealizado, motoristaCodigo: record.motoristaCodigo,
      motoristaNome: record.motoristaNome, horaLiberacao: record.horaLiberacao,
      observacoes: record.observacoes ?? row.observacoes, status: record.substituido ? 'SUBSTITUIDO' : 'LIBERADO' } : row;
  });
}
