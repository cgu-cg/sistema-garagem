import { currentReleaseTemplate } from '../data/scheduleTemplates';

// A unica excecao a tabela obrigatoria e o fretamento identificado no molde.
export function hasValidReleaseTable(item: { tabela: string; linha: string; scheduleId?: string | null;
  garagem?: string | null; escalaTipo?: string | null; turno?: string | null }) {
  if (item.tabela.trim()) return true;
  if (item.garagem !== 'VCG' || item.escalaTipo !== 'SEG_SEX' || item.turno !== 'MATUTINO') return false;
  return currentReleaseTemplate({ garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' })
    .some(row => row.id === item.scheduleId && row.linha === item.linha && row.tipo === 'FRETAMENTO' && row.tabela === '');
}
