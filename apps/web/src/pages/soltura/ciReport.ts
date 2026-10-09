import type { BloqueioCarro } from '@/data/solturaData';

export function normalizeIsoDate(d?: string): string {
  if (!d) return '';
  const clean = String(d).trim().split(/[\sT]/)[0];
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) return parts[0].length === 4
      ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return clean;
}

// FolhaCI e unica por garagem/dataFolha; a API projeta esses campos do pai.
// Consorciada e garagem fisica do veiculo nao identificam a folha.
export function selectCIReportItems(items: BloqueioCarro[], date: string, garage: string) {
  const day = normalizeIsoDate(date);
  if (!day || (garage !== 'VCG' && garage !== 'VCM')) return [];
  return items.filter(i => normalizeIsoDate(i.data) === day && i.garagem === garage && i.status !== 'LIBERADO');
}

function legacySlot(item: BloqueioCarro) {
  return item.reforcoSlotId || item.id?.match(/(?:^|[-_])(ref(?:-extra)?-\d+)(?:[-_]|$)/)?.[1];
}

export function ciReportExtraSlots(items: BloqueioCarro[]) {
  const orders = new Set([1, 2, 3, 4, 5, 6]);
  for (const i of items.filter(i => i.categoriaPlanilha === 'REFORCO')) {
    const order = i.tipoPosicao === 'EXTRA' ? i.ordemPosicao : Number(legacySlot(i)?.match(/^ref-extra-(\d+)$/)?.[1]);
    if (order && order > 0) orders.add(order);
  }
  return [...orders].sort((a, b) => a - b).map(n => ({ id: `ref-extra-${n}` }));
}

// Usa somente itens salvos da folha selecionada, nunca drafts/localStorage.
export function ciReportSlot(items: BloqueioCarro[], slotId: string, c4: boolean,
  horario = '', fixedSlots: readonly { id: string; horario: string }[] = []) {
  const position = slotId.match(/^ref(-extra)?-(\d+)$/);
  const reforco = items.filter(i => i.categoriaPlanilha === 'REFORCO');
  let item = position ? reforco.find(i => c4
    ? i.tipoPosicao === (position[1] ? 'EXTRA' : 'FIXO') && i.ordemPosicao === Number(position[2])
    : legacySlot(i) === slotId) : undefined;
  // Compatibilidade legada: horarios repetidos ocupam slots distintos, sem heranca.
  if (!item && !c4 && position && !position[1] && horario) {
    const candidates = reforco.filter(i => !legacySlot(i) && i.horarioReforco === horario);
    const index = fixedSlots.filter(s => s.horario === horario).findIndex(s => s.id === slotId);
    if (index >= 0) item = candidates[index];
  }
  return { prefixo: item?.prefixo ?? '', motivo: item?.motivo ?? '', obs: item?.os ?? '', savedItem: item };
}
