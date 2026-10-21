import type { InventoryVehicle } from '@/lib/api';
import type { ManutencaoCarroItem } from './manutencaoManager';

export function removeMaintenanceSelection(baseline: ManutencaoCarroItem[], ids: string[]) {
  const selected = new Set(ids);
  return {
    items: baseline.filter(item => !selected.has(item.id)),
    removeBlocked: [...new Set(baseline.filter(item => selected.has(item.id) && item.bloqueado).map(item => item.prefixo))],
  };
}

export function garageVehiclePrefixes(fleet: InventoryVehicle[], garage: 'VCG' | 'VCM' | undefined): string[] {
  if (!garage) return [];
  const registered = garage === 'VCG' ? '2' : '1';
  return [...new Set(fleet.filter(car => String(car.garagem ?? '').trim() === registered)
    .map(car => String(car.idCarro)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// Prepara uma unica gravacao, sem modificar a fotografia original do editor.
// Liberacoes de bloqueados exigem confirmacao; transicoes sao revalidadas no backend.
export function addMaintenanceSelection(
  baseline: ManutencaoCarroItem[], prefixes: string[], status: 'BLOQUEADO' | 'EM_EXECUCAO' | 'LIBERADO',
  observation: string, day: string, c4: boolean,
  company: (prefixo: string) => ManutencaoCarroItem['consorciada'],
): ManutencaoCarroItem[] {
  let next = [...baseline];
  const obs = observation.trim().toUpperCase();
  for (const prefixo of new Set(prefixes)) {
    const same = next.filter(i => i.prefixo === prefixo && i.data === day);
    const old = same[0];
    const already = same.length === 1 && (status === 'BLOQUEADO' ? old.bloqueado && !old.emExecucao && !old.liberado
      : status === 'EM_EXECUCAO' ? old.emExecucao && !old.bloqueado && !old.liberado : old.liberado && !old.bloqueado && !old.emExecucao);
    if (already) continue;
    const reason = obs || (status === 'BLOQUEADO' ? old?.observacaoBloqueio : old?.observacaoOficina) || old?.observacao || (c4 ? null : '');
    const row: ManutencaoCarroItem = {
      ...old, id: old?.id || 'manut-' + day + '-' + prefixo, prefixo,
      consorciada: old?.consorciada || company(prefixo), data: day,
      bloqueado: status === 'BLOQUEADO', emExecucao: status === 'EM_EXECUCAO', liberado: status === 'LIBERADO', observacao: reason,
      ...(c4 ? { observacaoBloqueio: status === 'BLOQUEADO' ? reason : null,
        observacaoOficina: status !== 'BLOQUEADO' ? reason : old?.observacaoOficina ?? null } : {}),
    };
    next = [...next.filter(i => !(i.prefixo === prefixo && i.data === day)), row];
  }
  return next;
}
