import { releaseHistory } from './releaseVehicleExchange';
import { undoReleaseWithdrawals } from './releaseWithdrawals';
import { eventInstant } from './c4Temporal';
import { canEditHistoricalRelease } from './releaseDateAccess';
import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { parseDailyContext } from './escalaDiaria';
import { lockManualCI } from './c4Flow';
import { lockReleaseSheet, releaseSheetWhere, assertReleaseStarted, parseReleaseSheet } from './releaseLifecycle';
import { canDispatch } from './operationalAccess';
import { MvpError, operationalContext } from './mvpTemporal';
import { addDays } from './c4Temporal';
import { notifyC4Updated } from './c4Events';
import { releaseLineToken } from './lineClearAudit';
import { isIndependentRelease } from './independentRelease';

export async function clearReleaseLine(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date()) {
  const command = z.object({ contexto: z.unknown(), scheduleId: z.string().min(1).max(100),
    revisao: z.number().int().nonnegative(), operacao: z.enum(['limpar-linha', 'suspender-linha', 'reativar-linha']).default('limpar-linha'), base: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict().parse(value);
  const context = parseDailyContext(command.contexto);
  const preflight = context.dataOperacao < operationalContext(clock()).today && userId ? await db.user.findUnique({ where: { id: userId } }) : null;
  const assertDate = (role?: string) => {
    const today = operationalContext(clock()).today;
    if (context.garagem !== 'VCG' || context.dataOperacao !== today && !canEditHistoricalRelease(role, context.dataOperacao, today, 'EM_ANDAMENTO'))
      throw new MvpError(409, 'Limpar linha exige VCG e o dia da operação.');
  };
  assertDate(preflight?.role);
  const result = await db.$transaction(async tx => {
    if (!isIndependentRelease(context)) await lockManualCI(tx, context.garagem, context.dataOperacao);
    await lockReleaseSheet(tx, context);
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, include: { groups: true } }) : null;
    if (!userId || !canDispatch(user) || user?.role !== 'ADMIN' && user?.garagem !== context.garagem)
      throw new MvpError(403, 'Sem permissão para limpar esta linha.');
    assertDate(user?.role);
    const record = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(context) });
    assertReleaseStarted(record);
    if (record!.revisao !== command.revisao) throw new MvpError(409, 'Folha alterada em outro posto. Recarregue antes de limpar.');
    const sheet = parseReleaseSheet(record!.conteudo);
    const row = sheet.itens.find(row => row.id === command.scheduleId);
    if (!row) throw new MvpError(409, 'Linha fora da folha.');
    const matches = await tx.soltura.findMany({ where: { ...context, scheduleId: command.scheduleId } });
    if (matches.length > 1) throw new MvpError(409, 'Linha duplicada. Recarregue.');
    const previous = matches[0];
    if (command.operacao === 'limpar-linha' && (!previous || !['LIBERADO', 'SUBSTITUIDO'].includes(previous.status ?? '')))
      throw new MvpError(409, 'A linha nao possui uma unica libera\u00e7\u00e3o para limpar. Recarregue.');
    if (previous && (previous.carroRealizado || previous.driverCode) && releaseLineToken(previous) !== command.base)
      throw new MvpError(409, 'Carro ou motorista alterado em outro posto. Recarregue antes de continuar.');
    if (command.operacao === 'reativar-linha' ? !row.suspensa : Boolean(row.suspensa))
      throw new MvpError(409, 'Estado da linha mudou. Recarregue antes de continuar.');
    sheet.limpezas = [...(sheet.limpezas ?? []), { id: randomUUID(), linhaId: command.scheduleId,
      usuarioId: userId, registradoEm: clock().toISOString(), anterior: JSON.stringify(command.operacao === 'limpar-linha' ? previous : { operacao: command.operacao, linha: row, registro: previous ?? null }) }];
    let history = previous?.historicoTrocas;
    if (command.operacao === 'limpar-linha' && previous && releaseHistory(previous.historicoTrocas).some(e => e.origem === 'SOLTURA' && e.destino !== 'DESFEITO')) {
      const records = await tx.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
      const used = new Set(records.filter(r => r.id !== previous.id).map(r => r.carroRealizado).filter((p): p is string => Boolean(p)));
      const terminals = await tx.reservaTerminal.findMany({ where: { garagem: context.garagem, dataHora: { gte: eventInstant(context.dataOperacao, 0), lt: eventInstant(addDays(context.dataOperacao, 1), 0) } } });
      for (const terminal of terminals) used.add(terminal.carro);
      history = JSON.stringify(undoReleaseWithdrawals(previous.historicoTrocas, used, userId, clock()));
    }
    if (sheet.usosBloqueadosCI) sheet.usosBloqueadosCI = sheet.usosBloqueadosCI.filter(c => c.linhaId !== command.scheduleId);
    row.suspensa = command.operacao === 'suspender-linha';
    // Valida também os metadados novos antes de alterar despacho ou folha.
    const conteudo = JSON.stringify(parseReleaseSheet(JSON.stringify(sheet)));
    if (previous) await tx.soltura.update({ where: { id: previous.id }, data: { status: 'PENDENTE', carroRealizado: null,
      historicoTrocas: history, busId: null, driverCode: null, driverName: null, horaLiberacao: null, substituido: false, notes: null, userId } });
    const revisao = record!.revisao + 1;
    await tx.folhaSoltura.update({ where: { id: record!.id }, data: { revisao, conteudo, responsavelId: userId } });
    assertDate(user?.role);
    return { contexto: context, scheduleId: command.scheduleId, revisao };
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(context.garagem, addDays(context.dataOperacao, -1));
  return result;
}
