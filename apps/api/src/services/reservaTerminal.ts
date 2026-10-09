import type { PrismaClient } from '@prisma/client';
import { canDispatch } from './operationalAccess';
import { MvpError } from './mvpTemporal';

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
