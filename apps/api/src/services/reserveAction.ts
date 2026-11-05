import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { parseDailyContext, parseStoredDailyScale, fixedSchedule, officialFleet } from './escalaDiaria';
import { releaseScaleContext } from './releaseProgramming';
import { canDispatch, canWriteDailyScale } from './operationalAccess';
import { lockManualCI } from './c4Flow';
import { assertC4Read } from './c4Authorization';
import { dateValue, addDays, eventInstant } from './c4Temporal';
import { MvpError, operationalContext } from './mvpTemporal';
import { officialGarageFleet, allocationProjection } from './escalaAllocation';
import { assertReleaseStarted, releaseSheetWhere, parseReleaseSheet, lockReleaseSheet } from './releaseLifecycle';
import { releaseFleetProjection } from './releaseFleetProjection';
import { isIndependentRelease } from './independentRelease';
import { supportsReleaseContext } from './releaseSupport';
import { notifyC4Updated } from './c4Events';

export async function reserveAction(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date(), loadFleet = officialFleet) {
  const command = z.object({ contexto: z.unknown(), modulo: z.enum(['ESCALA','SOLTURA']), prefixo: z.string().regex(/^\d{1,10}$/),
    tipo: z.enum(['BLOQUEIO_CI','JUSTIFICATIVA']), descricao: z.string().trim().min(1).max(1000), operacaoId: z.string().uuid() }).strict().parse(value);
  const context = parseDailyContext(command.contexto), today = operationalContext(clock()).today;
  const checkDate = () => {
    if (operationalContext(clock()).today !== today || context.dataOperacao < today || command.modulo === 'SOLTURA' && context.dataOperacao !== today)
      throw new MvpError(409, 'Acoes da Reserva nao podem alterar CI de data passada.');
  };
  checkDate();
  const frota = officialGarageFleet(await loadFleet(), context.garagem);
  await db.$transaction(async tx => {
    await lockManualCI(tx, context.garagem, context.dataOperacao);
    const scaleContext = releaseScaleContext(context);
    await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${context.garagem} AND data_operacao=${context.dataOperacao}`;
    await lockReleaseSheet(tx, context);
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, include: { groups: true } }) : null;
    if (!userId || (command.modulo === 'ESCALA' ? !canWriteDailyScale(user, context.garagem)
      : !canDispatch(user) || user?.role !== 'ADMIN' && user?.garagem !== context.garagem || !supportsReleaseContext(context)))
      throw new MvpError(403, 'Sem permissao para agir na Reserva desta garagem.');
    await assertC4Read(tx, userId, context.garagem); checkDate();
    const previous = await tx.ciPortariaEvento.findUnique({ where: { operacaoId: command.operacaoId } });
    if (previous) {
      if (previous.usuarioId !== userId || previous.garagem !== context.garagem || previous.dataOperacao !== context.dataOperacao
        || previous.modulo !== command.modulo || previous.escalaTipo !== context.escalaTipo || previous.turno !== context.turno
        || previous.prefixo !== command.prefixo || previous.tipo !== command.tipo || previous.descricao !== command.descricao)
        throw new MvpError(409, 'Operacao ja utilizada com outro conteudo.');
      return;
    }
    const ci = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: context.garagem, dataFolha: dateValue(context.dataOperacao) } }, include: { itens: true } });
    const blocks = ci?.itens.filter(i => i.categoria === 'BLOQUEADO' && i.statusItem !== 'LIBERADO').map(i => i.prefixo) ?? [];
    const scaleRecord = await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: scaleContext } });
    const scale = parseStoredDailyScale(scaleRecord?.conteudo, scaleContext);
    if (command.modulo === 'ESCALA' && (!scaleRecord || !scale.fluxo || !['EM_PREPARACAO','FINALIZADA'].includes(scale.fluxo.status)))
      throw new MvpError(409, 'Inicie a Escala antes de agir na Reserva.');
    const cards = scale.cards ?? [], allocation = allocationProjection(scale.programacao ?? fixedSchedule(scaleContext), scale.itens, cards, frota, blocks);
    let reserve = allocation.reserva;
    if (command.modulo === 'SOLTURA') {
      const record = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(context) }); assertReleaseStarted(record);
      const sheet = parseReleaseSheet(record!.conteudo);
      const independent = isIndependentRelease(context);
      if (!independent && scale.fluxo?.status !== 'FINALIZADA') throw new MvpError(409, 'Finalize a Escala vinculada antes de agir na Reserva da Soltura.');
      const records = await tx.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
      reserve = releaseFleetProjection({ ...allocation, reserva: independent ? frota : reserve, bloqueados: independent ? [] : blocks,
        cards: independent ? [] : cards, coresFrota: {}, reservaPorCor: { updatedAt: null } }, sheet.itens, records, context).reserva;
    }
    if (!reserve.includes(command.prefixo)) throw new MvpError(409, 'Carro nao esta mais disponivel nesta Reserva. Recarregue.');
    const terminals = await tx.reservaTerminal.findMany({ where: { garagem: context.garagem, carro: command.prefixo,
      dataHora: { gte: eventInstant(context.dataOperacao, 0), lt: eventInstant(addDays(context.dataOperacao, 1), 0) } } });
    if (terminals.length) throw new MvpError(409, 'Carro alocado na Reserva Terminal. Remova a reserva antes desta acao.');
    if (command.tipo === 'BLOQUEIO_CI' && !ci) throw new MvpError(409, 'Inicie a CI desta data antes de bloquear o carro.');
    let item = ci?.itens.find(i => i.prefixo === command.prefixo && i.categoria === 'BLOQUEADO' && i.statusItem !== 'LIBERADO');
    if (command.tipo === 'BLOQUEIO_CI') {
      if (command.descricao.length > 255) throw new MvpError(400, 'Descricao do bloqueio permite ate 255 caracteres.');
      // Mesma classificacao de consorciada usada pela selecao de veiculos da CI.
      // A garagem fisica ja foi validada pela frota oficial; nao e inferida pelo prefixo.
      const consorciadas: Record<string, string> = { '1': 'VCM', '2': 'VSF', '3': 'JTU' };
      const consorciada = ci!.itens.find(i => i.prefixo === command.prefixo && i.consorciada)?.consorciada
        ?? consorciadas[command.prefixo[0]] ?? 'VCG';
      if (!item) item = await tx.itemFolhaCI.create({ data: { folhaId: ci!.id, chaveItem: randomUUID(), prefixo: command.prefixo,
        categoria: 'BLOQUEADO', consorciada, motivo: command.descricao, dataBloqueio: dateValue(context.dataOperacao),
        statusItem: 'BLOQUEADO', responsavelRegistroId: userId } });
    }
    await tx.ciPortariaEvento.create({ data: { ...context, prefixo: command.prefixo, tipo: command.tipo, modulo: command.modulo,
      descricao: command.descricao, operacaoId: command.operacaoId, usuarioId: userId, folhaId: ci?.id, itemChave: command.tipo === 'BLOQUEIO_CI' ? item?.chaveItem : undefined,
      createdAt: clock() } });
    checkDate();
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(context.garagem, addDays(context.dataOperacao, -1));
  return { contexto: context, operacaoId: command.operacaoId };
}
