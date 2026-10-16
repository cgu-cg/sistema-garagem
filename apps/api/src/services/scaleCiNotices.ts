export type ScaleCiNotice = { prefixo: string; categoria: 'PREVENTIVA' | 'OFICINA' | 'REFORCO';
  subTipo: string | null; horario: string | null; tipoPosicao: string | null; ordemPosicao: number | null };

// Mesmos horarios das 12 posicoes fixas apresentadas na CI; paridade testada.
export const ciFixedReinforcementTimes = [
  '07:15 - A', '07:15 - A', '07:32 - A', '07:40 - A', '07:40 - M', '07:40 - A',
  '07:40 - C', '07:45 - C', '07:45 - A', '07:50 - C', '07:50 - C', '07:50 - A',
] as const;

// Informacao da folha D+1 consultada, sem criar bloqueio ou reconstruir historico.
export function projectScaleCiNotices(items: { prefixo: string; categoria: string; subTipo?: string | null;
  horarioReforco?: string | null; tipoPosicao?: string | null; ordemPosicao?: number | null }[], fleet: string[]): ScaleCiNotice[] {
  const allowed = new Set(fleet);
  return items.filter(i => allowed.has(i.prefixo) && ['PREVENTIVA', 'OFICINA', 'REFORCO'].includes(i.categoria))
    .map(i => ({ prefixo: i.prefixo, categoria: i.categoria as ScaleCiNotice['categoria'], subTipo: i.subTipo ?? null,
      horario: i.horarioReforco?.trim() || (i.categoria === 'REFORCO' && i.tipoPosicao === 'FIXO' && i.ordemPosicao
        ? ciFixedReinforcementTimes[i.ordemPosicao - 1] ?? null : null),
      tipoPosicao: i.tipoPosicao ?? null, ordemPosicao: i.ordemPosicao ?? null }));
}
