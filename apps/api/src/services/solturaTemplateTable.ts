import { currentReleaseTemplate } from '../data/scheduleTemplates';

// A unica excecao a tabela obrigatoria e o fretamento identificado no molde.
export function hasValidReleaseTable(item: { tabela: string; linha: string; scheduleId?: string | null;
  garagem?: string | null; escalaTipo?: string | null; turno?: string | null; dataOperacao?: string | null }) {
  if (item.tabela.trim()) return true;
  // Identidades do editor por data: o tipo FRETAMENTO e a linha serão
  // conferidos contra a fotografia oficial dentro de writeSafeRelease.
  if (/^trafego-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.scheduleId ?? '')
    && /^\d{4}-\d{2}-\d{2}$/.test(item.dataOperacao ?? '')) return true;
  if (item.garagem !== 'VCG' || item.escalaTipo !== 'SEG_SEX' || item.turno !== 'MATUTINO') return false;
  return currentReleaseTemplate({ garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' })
    .some(row => row.id === item.scheduleId && row.linha === item.linha && row.tipo === 'FRETAMENTO' && row.tabela === '');
}
