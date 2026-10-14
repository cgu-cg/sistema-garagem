import type { InventoryVehicle } from '@/lib/api';
import type { ManutencaoCarroItem } from './manutencaoManager';

export function garageVehiclePrefixes(fleet: InventoryVehicle[], garage: 'VCG' | 'VCM' | undefined): string[] {
  if (!garage) return [];
  const registered = garage === 'VCG' ? '2' : '1';
  return [...new Set(fleet.filter(car => String(car.garagem ?? '').trim() === registered)
    .map(car => String(car.idCarro)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// Prepara uma unica gravacao, sem modificar a fotografia original do editor.
// A confirmacao de retirada de bloqueios acontece antes de chamar a persistencia.
export function addMaintenanceSelection(
  baseline: ManutencaoCarroItem[], prefixes: string[], status: 'BLOQUEADO' | 'EM_EXECUCAO' | 'LIBERADO',
  observation: string, day: string, c4: boolean,
  company: (prefixo: string) => ManutencaoCarroItem['consorciada'],
): ManutencaoCarroItem[] {
  let next = [...baseline];
  const obs = observation.trim().toUpperCase();
  for (const prefixo of new Set(prefixes)) {
    const same = next.filter(i => i.prefixo === prefixo);
    if (same.some(i => status === 'BLOQUEADO' ? i.bloqueado && !i.liberado
      : status === 'EM_EXECUCAO' ? i.emExecucao && !i.liberado : i.liberado)) continue;
    // No legado, bloqueio e oficina podem ter registros separados.
    const old = c4 ? same[0] : status === 'BLOQUEADO'
      ? same.find(i => i.bloqueado && !i.liberado) || same.find(i => i.liberado)
      : same.find(i => i.emExecucao || i.liberado);
    const blocked = status !== 'LIBERADO' && Boolean(old?.bloqueado || status === 'BLOQUEADO');
    const row: ManutencaoCarroItem = {
      ...old, id: old?.id || `manut-${day}-${status}-${prefixo}`, prefixo,
      consorciada: old?.consorciada || company(prefixo), data: day,
      bloqueado: blocked,
      emExecucao: status === 'EM_EXECUCAO' || (status === 'BLOQUEADO' && Boolean(old?.emExecucao)),
      liberado: status === 'LIBERADO', observacao: obs || old?.observacao || (c4 ? null : ''),
      ...(c4 ? status === 'BLOQUEADO'
        ? { observacaoBloqueio: obs || old?.observacaoBloqueio || null }
        : { observacaoOficina: obs || old?.observacaoOficina || null } : {}),
    };
    if (status === 'LIBERADO' && !c4) next = next.filter(i => i.prefixo !== prefixo || i.id === old?.id);
    next = old ? next.map(i => i.id === old.id ? row : i) : [...next, row];
  }
  return next;
}
