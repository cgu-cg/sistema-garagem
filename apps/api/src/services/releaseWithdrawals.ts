import { releaseHistory } from './releaseVehicleExchange';
import { releaseLineToken } from './lineClearAudit';
import { MvpError } from './mvpTemporal';

type RecordRow = { id?: number; scheduleId: string | null; turno: string | null; escalaTipo: string | null;
  carroRealizado: string | null; carroProgramado?: string | null; driverCode?: string | null; driverName?: string | null; horaLiberacao?: string | null; status?: string | null; historicoTrocas?: unknown };
export function releaseWithdrawals(records: RecordRow[]) {
  return records.flatMap(record => releaseHistory(record.historicoTrocas).flatMap((event, index) => {
    const destino = event.destino ?? (event.motivo === 'Defeito Garagem' ? 'BLOQUEAR' : null);
    if (destino !== 'PENDENTE' && destino !== 'BLOQUEAR') return [];
    if (typeof event.carroAnterior !== 'string' || !/^\d{1,10}$/.test(event.carroAnterior))
      throw new MvpError(409, 'Retirada salva sem carro valido.');
    return [{ registroId: record.id ?? 0, trocaId: typeof event.id === 'string' ? event.id : `legado:${index}`,
      prefixo: event.carroAnterior, substituto: typeof event.novoCarro === 'string' ? event.novoCarro : '',
      destino, motivo: typeof event.descricaoDefeito === 'string' ? event.descricaoDefeito : '',
      legado: event.origem !== 'SOLTURA', turno: record.turno, escalaTipo: record.escalaTipo,
      scheduleId: record.scheduleId, base: record.id ? releaseLineToken({ ...record, id: record.id, carroProgramado: record.carroProgramado ?? null, driverCode: record.driverCode ?? null, driverName: record.driverName ?? null, horaLiberacao: record.horaLiberacao ?? null, status: record.status ?? null, historicoTrocas: typeof record.historicoTrocas === 'string' ? record.historicoTrocas : null }) : '' }];
  }));
}

export function treatReleaseWithdrawal(history: unknown, trocaId: string, destino: 'RESERVA' | 'BLOQUEAR', motivo: string,
  userId: number, now: Date) {
  const events = structuredClone(releaseHistory(history));
  const event = events.find((item, index) => (item.id ?? `legado:${index}`) === trocaId);
  const current = event?.destino ?? (event?.motivo === 'Defeito Garagem' ? 'BLOQUEAR' : null);
  if (!event || !['PENDENTE', 'BLOQUEAR'].includes(String(current)) || current === destino)
    throw new MvpError(409, 'Tratativa ja alterada. Recarregue.');
  if (destino === 'BLOQUEAR' && !motivo.trim()) throw new MvpError(400, 'Informe o defeito ou motivo do bloqueio.');
  const treatments = event.tratativas ?? [];
  if (!Array.isArray(treatments)) throw new MvpError(409, 'Historico de tratativas invalido.');
  event.tratativas = [...treatments, { destinoAnterior: current, destino, motivo: motivo.trim(), usuarioId: userId, registradoEm: now.toISOString() }];
  event.destino = destino;
  if (destino === 'BLOQUEAR') event.descricaoDefeito = motivo.trim();
  return events;
}

export function undoReleaseWithdrawals(history: unknown, inUse: Set<string>, userId: number, now: Date) {
  return releaseHistory(history).map(event => {
    if (event.origem !== 'SOLTURA' || event.destino === 'DESFEITO') return event;
    if (typeof event.carroAnterior === 'string' && inUse.has(event.carroAnterior))
      throw new MvpError(409, `Carro ${event.carroAnterior} em uso em outra linha ou reserva terminal. Limpeza cancelada.`);
    return { ...event, destino: 'DESFEITO', desfazimento: { destinoAnterior: event.destino, usuarioId: userId, registradoEm: now.toISOString() } };
  });
}
