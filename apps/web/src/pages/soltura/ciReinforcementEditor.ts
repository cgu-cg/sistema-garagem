import type { BloqueioCarro } from '@/data/solturaTypes';
import { c4EditedText, c4KnownFields } from '@/lib/c4ItemFields';
import { ciReportExtraSlots, ciReportSlot, selectCIReportItems, normalizeIsoDate } from './ciReport';

export const MAX_INSPECTION_CARS = 6;
export type ReinforcementDraft = { prefixo: string; motivo: string; obs: string };
export type InspectionChoice = { key: string; prefixo: string };
export type ReinforcementEditContext = {
  date: string; garage: 'VCG' | 'VCM'; c4: boolean; serviceTitle: string;
  fixedSlots: readonly { id: string; horario: string }[];
  legacyVehicle: (prefixo: string) => Pick<BloqueioCarro, 'garagem' | 'consorciada'>;
};

export function savedInspectionEntries(baseline: BloqueioCarro[], context: ReinforcementEditContext) {
  const items = selectCIReportItems(baseline, context.date, context.garage);
  return ciReportExtraSlots(items).flatMap(slot => {
    const saved = ciReportSlot(items, slot.id, context.c4).savedItem;
    return saved ? [{ key: slot.id, prefixo: saved.prefixo, saved }] : [];
  });
}

function sameRecord(item: BloqueioCarro, saved: BloqueioCarro) {
  return item.id === saved.id && item.data === saved.data && item.garagem === saved.garagem &&
    item.categoriaPlanilha === 'REFORCO' && item.prefixo === saved.prefixo;
}

// Uma posicao antes LIBERADA aparece vazia no card. Ao preenche-la, substituir
// apenas seu registro, como no fluxo anterior, sem duplicar tipo+ordem no sync.
function recordAtSlot(baseline: BloqueioCarro[], context: ReinforcementEditContext, slotId: string, horario = '') {
  return ciReportSlot(baseline.filter(i => normalizeIsoDate(i.data) === context.date && i.garagem === context.garage),
    slotId, context.c4, horario, context.fixedSlots).savedItem;
}

function reinforcement(context: ReinforcementEditContext, slotId: string, draft: ReinforcementDraft,
  saved?: BloqueioCarro, horario?: string): BloqueioCarro {
  const position = slotId.match(/^ref(-extra)?-(\d+)$/);
  if (!position) throw new Error('Posição de reforço inválida.');
  const extra = Boolean(position[1]), prefixo = draft.prefixo.trim();
  if (!/^\d{1,10}$/.test(prefixo)) throw new Error('Selecione um carro.');
  if (!extra && !draft.motivo.trim()) throw new Error('Selecione a situação.');
  return {
    ...saved, id: saved?.id || `ci-reforco-${slotId}-${context.date}`, prefixo,
    data: context.date, garagem: context.garage, categoriaPlanilha: 'REFORCO', tipo: 'REFORCO_REVISAO',
    tipoPosicao: extra ? 'EXTRA' : 'FIXO', ordemPosicao: Number(position[2]), reforcoSlotId: slotId,
    horarioReforco: context.c4 ? saved ? saved.horarioReforco ?? null : extra ? null : horario : extra ? context.serviceTitle : horario,
    motivo: extra ? context.serviceTitle : draft.motivo.trim(), os: draft.obs.trim() || undefined,
    status: 'BLOQUEADO', gravidade: 'ALTA', responsavel: 'Pista / Reforço',
    ...(!context.c4 ? context.legacyVehicle(prefixo) : {
      ...c4KnownFields(saved),
      motivo: extra ? saved?.motivo ?? null : c4EditedText(draft.motivo, saved?.motivo),
      os: c4EditedText(draft.obs, saved?.os),
    }),
  };
}

export function saveFixedReinforcement(baseline: BloqueioCarro[], context: ReinforcementEditContext,
  slotId: string, horario: string, draft: ReinforcementDraft) {
  const saved = ciReportSlot(selectCIReportItems(baseline, context.date, context.garage),
    slotId, context.c4, horario, context.fixedSlots).savedItem;
  const item = reinforcement(context, slotId, draft, saved, horario);
  const replaced = recordAtSlot(baseline, context, slotId, horario);
  return [...baseline.filter(i => !replaced || !sameRecord(i, replaced)), item];
}

// Um unico snapshot/gravação para todo o conjunto; itens mantidos conservam
// PK, chave logica e campos opcionais. Nada e retirado de outros setores/datas.
export function saveInspectionSelection(baseline: BloqueioCarro[], context: ReinforcementEditContext,
  selected: InspectionChoice[]) {
  if (selected.length > MAX_INSPECTION_CARS) throw new Error('Selecione no máximo 6 carros.');
  if (new Set(selected.map(i => i.key)).size !== selected.length) throw new Error('Seleção repetida.');
  const original = savedInspectionEntries(baseline, context);
  const kept = selected.flatMap(choice => {
    const entry = original.find(i => i.key === choice.key);
    if (!entry) {
      if (choice.key !== `new-${choice.prefixo}`) throw new Error('Seleção alterada. Reabra a inspeção.');
      return [];
    }
    if (choice.prefixo !== entry.prefixo) throw new Error('Registro de inspeção alterado.');
    return [entry];
  });
  const newChoices = selected.filter(choice => !original.some(i => i.key === choice.key));
  if (newChoices.some(choice => selected.filter(i => i.prefixo === choice.prefixo).length > 1)) throw new Error('Carro já selecionado na inspeção.');
  const occupied = new Set(kept.map(i => Number(i.key.replace('ref-extra-', ''))));
  const added = newChoices.map(choice => {
    const order = Array.from({ length: MAX_INSPECTION_CARS }, (_, i) => i + 1).find(i => !occupied.has(i));
    if (!order) throw new Error('Não há posição livre na inspeção.');
    occupied.add(order);
    return reinforcement(context, `ref-extra-${order}`, { prefixo: choice.prefixo, motivo: '', obs: '' });
  });
  const replaced = added.flatMap(item => {
    const saved = recordAtSlot(baseline, context, item.reforcoSlotId!);
    return saved ? [saved] : [];
  });
  return [...baseline.filter(i => !original.some(entry => sameRecord(i, entry.saved)) && !replaced.some(saved => sameRecord(i, saved))),
    ...kept.map(i => i.saved), ...added];
}
