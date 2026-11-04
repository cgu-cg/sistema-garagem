import { releaseWithdrawals } from './releaseWithdrawals';
import { garageDefects, releaseHistory } from './releaseVehicleExchange';
import { groupReserveColorsBy } from './scaleReserveColors';
import type { FleetColor } from './fleetColors';

export function releaseFleetProjection(scale: { frota: string[]; reserva: string[]; bloqueados: string[];
  cards: { id: string; itens: { prefixo: string }[] }[]; coresFrota: Record<string, FleetColor>;
  reservaPorCor: { updatedAt: string | null } },
  programming: { id: string; carroProgramado: string }[],
  records: { id?: number; scheduleId: string | null; turno: string | null; escalaTipo: string | null; carroRealizado: string | null; historicoTrocas?: unknown }[],
  context: { turno: string; escalaTipo: string }) {
  const retiradas = releaseWithdrawals(records);
  // Os cards pertencem a folha selecionada; a indisponibilidade continua abrangendo o dia.
  const substituidos = retiradas.filter(r => r.destino === 'PENDENTE' && r.turno === context.turno && r.escalaTipo === context.escalaTipo);
  const bloqueadosPortaria = retiradas.filter(r => r.destino === 'BLOQUEAR' && r.turno === context.turno && r.escalaTipo === context.escalaTipo);
  const defeitosGaragem = garageDefects(records);
  const blocked = new Set([...scale.bloqueados, ...defeitosGaragem.map(d => d.prefixo), ...retiradas.filter(r => r.destino === 'PENDENTE').map(d => d.prefixo),
    ...scale.cards.filter(c => !['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'].includes(c.id)).flatMap(c => c.itens.map(i => i.prefixo))]);
  const currentRecords = records.filter(r => r.turno === context.turno && r.escalaTipo === context.escalaTipo);
  const used = new Set([...currentRecords.map(r => r.carroRealizado), ...programming.map(row =>
    currentRecords.find(r => r.scheduleId === row.id)?.carroRealizado ?? row.carroProgramado)]);
  const returned = currentRecords.flatMap(r => releaseHistory(r.historicoTrocas).filter(h => h.destino === 'RESERVA' || !h.destino && h.motivo === 'Adicionado equivocadamente')
    .map(h => h.carroAnterior).filter((p): p is string => typeof p === 'string'));
  const reserva = [...new Set([...scale.reserva, ...returned])].filter(p => scale.frota.includes(p) && !used.has(p) && !blocked.has(p))
    .sort((a, b) => Number(a) - Number(b));
  return { reserva, defeitosGaragem, substituidos, bloqueadosPortaria, reservaPorCor: groupReserveColorsBy(reserva, scale.reservaPorCor.updatedAt, p => scale.coresFrota[p] ?? 'OUTRO') };
}
