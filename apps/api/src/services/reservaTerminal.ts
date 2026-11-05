import type { PrismaClient } from '@prisma/client';
import { canDispatch } from './operationalAccess';
import { MvpError } from './mvpTemporal';
import { operationalContext } from './mvpTemporal';
import { releaseWithdrawals } from './releaseWithdrawals';
import { createReservaTerminalSchema } from '../utils/schemas';

export async function createReserva(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date()) {
  const command = createReservaTerminalSchema.parse(value);
  const garagem = (command.garagem ?? 'VCG').trim().toUpperCase(), day = operationalContext(clock()).today;
  if (!['VCG', 'VCM'].includes(garagem) || !/^\d{1,10}$/.test(command.carro.trim())) throw new MvpError(400, 'Garagem ou carro invalido.');
  return db.$transaction(async tx => {
    // Mesma faixa utilizada pelos escritores da Soltura; nao inicia folha.
    await tx.$queryRaw`SELECT id FROM dbo.soltura_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${garagem} AND data_operacao=${day}`;
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, include: { groups: true } }) : null;
    if (!userId || !canDispatch(user) || user?.role !== 'ADMIN' && user?.garagem !== garagem)
      throw new MvpError(403, 'Sem permissao para criar reserva nesta garagem.');
    const records = await tx.soltura.findMany({ where: { garagem, dataOperacao: day } });
    if (releaseWithdrawals(records).some(r => r.prefixo === command.carro.trim() && r.destino === 'BLOQUEAR'))
      throw new MvpError(409, 'Carro bloqueado na Soltura.');
    const result = await tx.reservaTerminal.create({ data: { carro: command.carro.trim(), tipo: command.tipo.toUpperCase(),
      terminal: command.terminal.trim(), garagem, userId, dataHora: clock() }, include: { user: { select: { id: true, name: true } } } });
    if (operationalContext(clock()).today !== day) throw new MvpError(409, 'Data alterada durante a reserva. Recarregue.');
    return result;
  }, { isolationLevel: 'Serializable' });
}

export async function removeReserva(db: PrismaClient, userId: number | undefined, id: number) {
  if (!userId) throw new MvpError(401, 'Sessao obrigatoria.');
  if (!Number.isSafeInteger(id) || id <= 0) throw new MvpError(400, 'ID invalido.');
  return db.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: userId }, include: { groups: true } });
    if (!user) throw new MvpError(401, 'Usuario da sessao nao encontrado.');
    if (!canDispatch(user)) throw new MvpError(403, 'Seu perfil ou garagem nao permite excluir reservas.');
    const record = await tx.reservaTerminal.findUnique({ where: { id } });
    if (!record) throw new MvpError(404, 'Reserva nao encontrada.');
    if (user.role !== 'ADMIN' && record.garagem !== user.garagem)
      throw new MvpError(403, 'Reserva de outra garagem nao autorizada.');
    // Reservas sao compartilhadas por garagem, sem restricao por autor.
    // O predicado de exclusao preserva o escopo validado mesmo sob concorrencia.
    const result = await tx.reservaTerminal.deleteMany({ where: { id, garagem: record.garagem } });
    if (result.count !== 1) throw new MvpError(409, 'Reserva alterada durante a exclusao. Recarregue.');
    return { message: 'Reserva removida com sucesso' };
  }, { isolationLevel: 'Serializable' });
}
