import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { parseDailyContext, officialFleet, parseStoredDailyScale } from './escalaDiaria';
import { officialGarageFleet } from './escalaAllocation';
import { canDispatch } from './operationalAccess';
import { canEditHistoricalRelease } from './releaseDateAccess';
import { MvpError, operationalContext } from './mvpTemporal';
import { lockManualCI } from './c4Flow';
import { addDays, dateValue, eventInstant } from './c4Temporal';
import { assertReleaseStarted, lockReleaseSheet, parseReleaseSheet, releaseSheetWhere } from './releaseLifecycle';
import { releaseLineToken } from './lineClearAudit';
import { releaseWithdrawals, treatReleaseWithdrawal } from './releaseWithdrawals';
import { releaseScaleContext } from './releaseProgramming';
import { notifyC4Updated } from './c4Events';
import { isIndependentRelease } from './independentRelease';

export async function treatReleaseCar(db: PrismaClient, userId: number | undefined, value: unknown,
  clock = () => new Date(), loadFleet = officialFleet) {
  const command = z.object({ contexto: z.unknown(), revisao: z.number().int().nonnegative(),
    registroId: z.number().int().positive(), trocaId: z.string().min(1).max(100), base: z.string().regex(/^[a-f0-9]{64}$/),
    destino: z.enum(['RESERVA', 'BLOQUEAR']), motivo: z.string().trim().max(1000).default('') }).strict().parse(value);
  const context = parseDailyContext(command.contexto);
  const fleet = officialGarageFleet(await loadFleet(), context.garagem);
  await db.$transaction(async tx => {
    // Mesmo no vespertino, desbloquear consulta CI; conserva a ordem CI -> Escala -> Soltura.
    await lockManualCI(tx, context.garagem, context.dataOperacao);
    if (!isIndependentRelease(context)) await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${context.garagem} AND data_operacao=${context.dataOperacao}`;
    await lockReleaseSheet(tx, context);
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, include: { groups: true } }) : null;
    if (!userId || !canDispatch(user) || user?.role !== 'ADMIN' && user?.garagem !== context.garagem)
      throw new MvpError(403, 'Sem permissao para tratar carros desta Soltura.');
    const sheetRecord = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(context) });
    assertReleaseStarted(sheetRecord);
    const assertDate = () => {
      const today = operationalContext(clock()).today;
      if (context.garagem !== 'VCG' || context.dataOperacao !== today && !canEditHistoricalRelease(user?.role, context.dataOperacao, today, sheetRecord!.status))
        throw new MvpError(409, 'Tratativa exige a data da operacao ou edicao administrativa de folha anterior.');
    };
    assertDate();
    const ci = !isIndependentRelease(context) || command.destino === 'RESERVA'
      ? await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: context.garagem, dataFolha: dateValue(context.dataOperacao) } }, include: { itens: true } }) : null;
    let sourceCards: ReturnType<typeof parseStoredDailyScale>['cards'] = [];
    if (!isIndependentRelease(context)) {
      if (ci?.status !== 'FINALIZADA') throw new MvpError(409, 'Finalize a CI antes de tratar carros da Soltura vinculada.');
      const c = releaseScaleContext(context);
      const scale = await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: c } });
      const source = parseStoredDailyScale(scale?.conteudo, c);
      if (source.fluxo?.status !== 'FINALIZADA') throw new MvpError(409, 'Finalize a Escala antes de tratar carros da Soltura vinculada.');
      sourceCards = source.cards;
    }
    if (sheetRecord!.revisao !== command.revisao) throw new MvpError(409, 'Folha alterada. Recarregue antes da tratativa.');
    const records = await tx.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
    const record = records.find(r => r.id === command.registroId && r.escalaTipo === context.escalaTipo && r.turno === context.turno);
    if (!record || releaseLineToken(record) !== command.base) throw new MvpError(409, 'Retirada alterada. Recarregue.');
    const all = releaseWithdrawals(records), retirada = all.find(r => r.registroId === record.id && r.trocaId === command.trocaId);
    if (!retirada || !fleet.includes(retirada.prefixo)) throw new MvpError(409, 'Retirada inexistente ou carro fora da frota.');
    if (command.destino === 'RESERVA') {
      const usages = records.filter(r => r.escalaTipo === context.escalaTipo && r.turno === context.turno
        && r.status !== 'PENDENTE' && r.carroRealizado === retirada.prefixo);
      if (usages.length) throw new MvpError(409, `Carro ${retirada.prefixo} em uso nesta Soltura: ${usages.map(r => `Linha ${r.linha} / Tab ${r.tabela || 'sem tabela'}`).join('; ')}.`);
      if (ci?.itens.some(i => i.prefixo === retirada.prefixo && i.categoria === 'BLOQUEADO' && i.statusItem !== 'LIBERADO'))
        throw new MvpError(409, 'Carro bloqueado na CI. O bloqueio sera preservado.');
      if (all.some(r => r.prefixo === retirada.prefixo && (r.registroId !== record.id || r.trocaId !== command.trocaId)))
        throw new MvpError(409, 'Carro possui outra pendencia ou bloqueio independente.');
      if ((sourceCards ?? []).filter(card => ['PORTARIA', 'SUBSTITUIDOS'].includes(card.id)).some(card => card.itens.some(i => i.prefixo === retirada.prefixo)))
        throw new MvpError(409, 'Carro bloqueado ou aguardando tratamento na Escala.');
    }
    const sheet = parseReleaseSheet(sheetRecord!.conteudo);
    if (!record.scheduleId || !sheet.itens.some(row => row.id === record.scheduleId))
      throw new MvpError(409, 'Retirada sem viagem nesta folha. Revise o registro anterior.');
    sheet.limpezas = [...(sheet.limpezas ?? []), { id: randomUUID(), linhaId: record.scheduleId!, usuarioId: userId,
      registradoEm: clock().toISOString(), anterior: JSON.stringify({ operacao: 'TRATAR_RETIRADA', registro: record, comando: command }) }];
    const history = treatReleaseWithdrawal(record.historicoTrocas, command.trocaId, command.destino, command.motivo, userId, clock());
    await tx.soltura.update({ where: { id: record.id }, data: { historicoTrocas: JSON.stringify(history), userId } });
    await tx.folhaSoltura.update({ where: { id: sheetRecord!.id }, data: { revisao: command.revisao + 1,
      conteudo: JSON.stringify(parseReleaseSheet(JSON.stringify(sheet))), responsavelId: userId } });
    assertDate();
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(context.garagem, addDays(context.dataOperacao, -1));
  return { contexto: context, revisao: command.revisao + 1 };
}
