import { ciUseSchema } from './ciUseConfirmation';
import { canEditHistoricalRelease } from './releaseDateAccess';
import type { Prisma, PrismaClient, Soltura } from '@prisma/client';
import { z } from 'zod';
import { parseDailyContext, parseStoredDailyScale, fixedSchedule } from './escalaDiaria';
import { allocationProjection } from './escalaAllocation';
import { releaseFleetProjection } from './releaseFleetProjection';
import { canDispatch } from './operationalAccess';
import { assertC4Read } from './c4Authorization';
import { MvpError, operationalContext } from './mvpTemporal';
import { lockManualCI } from './c4Flow';
import { enabledGarages, eventInstant, addDays, dateValue } from './c4Temporal';
import { isIndependentRelease } from './independentRelease';
import { readReleaseProgramming, finalizedReleaseRows, releaseScaleContext, updatedReleaseSheetRows } from './releaseProgramming';
import { notifyC4Updated } from './c4Events';
import { releaseWithdrawals } from './releaseWithdrawals';
import { garageDefects } from './releaseVehicleExchange';
import { resolveDateProgramming } from './trafficProgramming';
import { scaleLinkedReleaseIds } from './releaseScaleUpdates';
import { lineClearAuditSchema } from './lineClearAudit';

export type ReleaseContext = ReturnType<typeof parseDailyContext>;
const rowSchema = z.object({ suspensa: z.boolean().optional(), id: z.string(), linha: z.string(), tabela: z.string(), carroProgramado: z.string(),
  saidaGaragem: z.string(), inicioLinha: z.string().optional(), inicioBairro: z.string().optional(), chegadaGaragem: z.string().optional(),
  ordem: z.number().optional(), tipo: z.string().optional(), observacoes: z.string().optional() }).passthrough();
export const releaseSheetSchema = z.object({ version: z.literal(1), itens: z.array(rowSchema).min(1),
  limpezas: z.array(lineClearAuditSchema).optional(),
  usosBloqueadosCI: z.array(ciUseSchema).max(2000).optional(),
  escalaVinculadaIds: z.array(z.string().min(1)).max(2000).optional(),
  eventos: z.array(z.object({ operacao: z.enum(['iniciar', 'finalizar', 'reabrir']), usuarioId: z.number().int().positive(), registradoEm: z.string().datetime() })),
  relatorio: z.unknown().optional() }).strict();
export type ReleaseSheet = z.infer<typeof releaseSheetSchema>;
export function parseReleaseSheet(conteudo: string): ReleaseSheet {
  let value: unknown;
  try { value = JSON.parse(conteudo); }
  catch { throw new MvpError(503, 'Conteudo salvo da Soltura invalido (JSON). Nenhum dado foi descartado.'); }
  const parsed = releaseSheetSchema.safeParse(value);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => `${issue.path.join('.') || 'folha'} (${issue.code})`))].slice(0, 5).join(', ');
    throw new MvpError(503, `Conteudo salvo da Soltura invalido em: ${fields}. Nenhum dado foi descartado; informe estes campos ao suporte.`);
  }
  return parsed.data;
}
export const releaseSheetWhere = (context: ReleaseContext) => ({ garagem_escalaTipo_turno_dataOperacao: context });

export async function lockReleaseSheet(tx: Pick<Prisma.TransactionClient, '$queryRaw'>, c: ReleaseContext) {
  await tx.$queryRaw`SELECT id FROM dbo.soltura_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${c.garagem} AND data_operacao=${c.dataOperacao}`;
  await tx.$queryRaw`SELECT id FROM dbo.soltura_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${c.garagem} AND escala_tipo=${c.escalaTipo} AND turno=${c.turno} AND data_operacao=${c.dataOperacao}`;
}
export function assertReleaseStarted(record: { status: string } | null) {
  if (!record) throw new MvpError(409, 'Inicie a Soltura antes de liberar veiculos.');
  if (record.status !== 'EM_ANDAMENTO') throw new MvpError(409, 'Soltura finalizada. Somente administrador pode reabrir.');
}
export function completedReleaseRows(rows: ReleaseSheet['itens'], records: Pick<Soltura, 'scheduleId' | 'linha' | 'tabela' | 'carroRealizado' | 'driverCode' | 'status'>[]) {
  if (!rows.length || records.some(record => !rows.some(row => row.id === record.scheduleId))) return false;
  return rows.every(row => {
    const matches = records.filter(r => r.scheduleId === row.id);
    if (row.suspensa) return matches.length <= 1 && matches.every(r => r.linha === row.linha && r.tabela === row.tabela && !r.carroRealizado && !r.driverCode);
    return matches.length === 1 && matches[0].linha === row.linha && matches[0].tabela === row.tabela
      && /^\d{1,10}$/.test(matches[0].carroRealizado ?? '') && Boolean(matches[0].driverCode?.trim()) && matches[0].status === 'LIBERADO';
  });
}
export function releaseReportRows(rows: ReleaseSheet['itens'], records: Soltura[]) {
  return rows.map(row => {
    const saved = records.find(r => r.scheduleId === row.id || (!r.scheduleId && `legacy:${r.id}` === row.id));
    return { ...row, carroProgramado: saved ? saved.carroProgramado ?? '' : row.carroProgramado,
      carroRealizado: saved?.carroRealizado ?? '', motoristaCodigo: saved?.driverCode ?? '',
      motoristaNome: saved?.driverName ?? '', horaLiberacao: saved?.horaLiberacao ?? '',
      status: row.suspensa ? 'SUSPENSA' : saved?.status ?? 'PENDENTE', observacoes: saved?.notes ?? row.observacoes ?? '' };
  });
}
export function releaseLifecycleView(record: { status: string; revisao: number; conteudo: string } | null) {
  const sheet = record ? parseReleaseSheet(record.conteudo) : null;
  return { status: record?.status ?? 'NAO_INICIADA', revisao: record?.revisao ?? 0,
    eventos: sheet?.eventos ?? [], usosBloqueadosCI: sheet?.usosBloqueadosCI ?? [], itens: sheet?.itens ?? null };
}
export async function readReleaseLifecycle(db: PrismaClient, value: unknown, userId: number | undefined) {
  const context = parseDailyContext(value); await assertC4Read(db, userId, context.garagem);
  const record = await db.folhaSoltura.findUnique({ where: releaseSheetWhere(context) });
  return { contexto: context, ...releaseLifecycleView(record) };
}
export async function collectReleaseReport(db: PrismaClient, context: ReleaseContext, userId: number | undefined,
  rows: ReleaseSheet['itens'], records: Soltura[], now: Date) {
  const programming = await readReleaseProgramming(db, context, userId);
  const terminals = await db.reservaTerminal.findMany({ where: { garagem: context.garagem,
    dataHora: { gte: eventInstant(context.dataOperacao, 0), lt: eventInstant(addDays(context.dataOperacao, 1), 0) } }, orderBy: { dataHora: 'asc' } });
  return { contexto: context, status: 'EM_ANDAMENTO', emitidoEm: now.toISOString(), itens: releaseReportRows(rows, records),
    reserva: programming.disponibilidade.reserva, bloqueados: programming.escala.bloqueados,
    ciNaoVinculada: isIndependentRelease(context),
    defeitosGaragem: programming.disponibilidade.defeitosGaragem,
    substituidos: programming.disponibilidade.substituidos, bloqueadosPortaria: programming.disponibilidade.bloqueadosPortaria,
    reservasTerminais: terminals.map(t => ({ terminal: t.terminal, carro: t.carro })) };
}
export async function changeReleaseLifecycle(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date(), prepare = readReleaseProgramming) {
  const command = z.object({ contexto: z.unknown(), revisao: z.number().int().nonnegative(), operacao: z.enum(['iniciar', 'finalizar', 'reabrir']) }).strict().parse(value);
  const context = parseDailyContext(command.contexto);
  const preflight = command.operacao === 'finalizar' && context.dataOperacao < operationalContext(clock()).today && userId ? await db.user.findUnique({ where: { id: userId } }) : null;
  const assertDate = (role?: string) => { const today = operationalContext(clock()).today;
    if (context.garagem !== 'VCG' || context.dataOperacao !== today && !(command.operacao === 'finalizar' && canEditHistoricalRelease(role, context.dataOperacao, today, 'EM_ANDAMENTO')))
    throw new MvpError(409, 'Inicio, finalizacao e reabertura exigem VCG e o dia da operacao.'); };
  assertDate(preflight?.role);
  // Leitura auxiliar antes dos locks; a fotografia da finalizacao e montada com despachos relidos na transacao.
  const preparation = command.operacao !== 'reabrir' ? await prepare(db, context, userId) : null;
  const result = await db.$transaction(async tx => {
    if (!isIndependentRelease(context)) {
      await lockManualCI(tx, context.garagem, context.dataOperacao);
      const c = releaseScaleContext(context);
      await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${c.garagem} AND data_operacao=${c.dataOperacao}`;
    }
    await lockReleaseSheet(tx, context);
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, include: { groups: true } }) : null;
    if (!canDispatch(user) || (user?.role !== 'ADMIN' && user?.garagem !== context.garagem)) throw new MvpError(403, 'Sem permissao para alterar esta Soltura.');
    if (command.operacao === 'reabrir' && user?.role !== 'ADMIN') throw new MvpError(403, 'Somente administrador pode reabrir a Soltura.');
    assertDate(user?.role);
    const old = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(context) });
    if ((old?.revisao ?? 0) !== command.revisao) throw new MvpError(409, 'Soltura alterada em outro posto. Recarregue.');
    if (command.operacao === 'iniciar' && old) throw new MvpError(409, 'Soltura ja iniciada.');
    if (command.operacao === 'finalizar') assertReleaseStarted(old);
    if (command.operacao === 'reabrir' && old?.status !== 'FINALIZADA') throw new MvpError(409, 'Somente Soltura finalizada pode ser reaberta.');
    const currentRows = command.operacao === 'iniciar' ? await finalizedReleaseRows(tx, context) : null;
    const sourceCI = command.operacao === 'iniciar' && !isIndependentRelease(context)
      ? await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: context.garagem, dataFolha: dateValue(context.dataOperacao) } } }) : null;
    if (command.operacao === 'iniciar' && (!currentRows || (!isIndependentRelease(context)
      && (!enabledGarages().includes('VCG') || sourceCI?.status !== 'FINALIZADA' || !preparation?.escala.fluxo.ciFinalizada)))) throw new MvpError(409, 'Finalize a CI e a Escala desta data antes de iniciar a Soltura.');
    const records = await tx.soltura.findMany({ where: context });
    if (command.operacao === 'finalizar' && releaseWithdrawals(records).some(r => r.destino === 'PENDENTE'))
      throw new MvpError(409, 'Trate todos os carros em Substituidos antes de finalizar a Soltura.');
    const sheet: ReleaseSheet = old ? parseReleaseSheet(old.conteudo) : { version: 1, itens: currentRows!, eventos: [] };
    if (!old && !isIndependentRelease(context)) {
      const template = await resolveDateProgramming(tx, 'SOLTURA', context);
      sheet.escalaVinculadaIds = scaleLinkedReleaseIds(template.itens, template.excecao, template.recorrente, template.origemCarros === 'ESCALA');
    }
    if (!old) {
      for (const record of records) {
        if (!record.scheduleId) throw new MvpError(409, 'Despacho anterior sem identificador. Revise antes de iniciar.');
        if (!sheet.itens.some(row => row.id === record.scheduleId)) sheet.itens.push({ id: record.scheduleId,
          linha: record.linha, tabela: record.tabela, carroProgramado: isIndependentRelease(context) ? '' : record.carroProgramado ?? '',
          saidaGaragem: record.saidaGaragem ?? '', inicioLinha: record.inicioLinha ?? '' });
      }
    }
    if (old?.status === 'EM_ANDAMENTO') sheet.itens = await updatedReleaseSheetRows(tx, context, sheet, records);
    if (command.operacao === 'finalizar' && !completedReleaseRows(sheet.itens, records)) throw new MvpError(409, 'Libere todas as viagens com carro e motorista ou suspenda as que nao vao operar antes de finalizar.');
    sheet.eventos.push({ operacao: command.operacao, usuarioId: userId!, registradoEm: clock().toISOString() });
    if (command.operacao === 'finalizar') {
      const dailyRecords = await tx.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
      let scale: Parameters<typeof releaseFleetProjection>[0] = preparation!.escala;
      if (!isIndependentRelease(context)) {
        const c = releaseScaleContext(context);
        const scaleRecord = await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: c } });
        const savedScale = parseStoredDailyScale(scaleRecord?.conteudo, c);
        if (savedScale.fluxo?.status !== 'FINALIZADA') throw new MvpError(409, 'Escala alterada durante a finalizacao.');
        const cards = savedScale.cards ?? [];
        scale = { ...scale, cards, ...allocationProjection(savedScale.programacao ?? fixedSchedule(c), savedScale.itens, cards, scale.frota, savedScale.fluxo.fonteCI.bloqueados) };
      }
      const availability = releaseFleetProjection(scale, sheet.itens, dailyRecords, context);
      const terminals = await tx.reservaTerminal.findMany({ where: { garagem: context.garagem,
        dataHora: { gte: eventInstant(context.dataOperacao, 0), lt: eventInstant(addDays(context.dataOperacao, 1), 0) } }, orderBy: { dataHora: 'asc' } });
      sheet.relatorio = { contexto: context, status: 'FINALIZADA', emitidoEm: clock().toISOString(), itens: releaseReportRows(sheet.itens, records),
        reserva: availability.reserva, bloqueados: scale.bloqueados,
        ciNaoVinculada: isIndependentRelease(context),
        defeitosGaragem: availability.defeitosGaragem,
        substituidos: availability.substituidos, bloqueadosPortaria: availability.bloqueadosPortaria,
        reservasTerminais: terminals.map(t => ({ terminal: t.terminal, carro: t.carro })) };
    }
    const data = { status: command.operacao === 'finalizar' ? 'FINALIZADA' : 'EM_ANDAMENTO',
      revisao: command.revisao + 1, conteudo: JSON.stringify(releaseSheetSchema.parse(sheet)), responsavelId: userId! };
    const saved = old ? await tx.folhaSoltura.update({ where: { id: old.id }, data }) : await tx.folhaSoltura.create({ data: { ...context, ...data } });
    assertDate(user?.role); return { contexto: context, ...releaseLifecycleView(saved) };
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(context.garagem, addDays(context.dataOperacao, -1)); return result;
}

export async function readReleaseReport(db: PrismaClient, value: unknown, userId: number | undefined, clock = () => new Date()) {
  const context = parseDailyContext(value); await assertC4Read(db, userId, context.garagem);
  const record = await db.folhaSoltura.findUnique({ where: releaseSheetWhere(context) });
  const sheet = record ? parseReleaseSheet(record.conteudo) : null;
  if (record?.status === 'FINALIZADA') {
    if (!sheet?.relatorio) throw new MvpError(409, 'Fotografia do relatorio finalizado indisponivel.');
    return sheet.relatorio;
  }
  const records = await db.soltura.findMany({ where: context });
  if (!sheet && context.dataOperacao < operationalContext(clock()).today) {
    const storedRows = [...records].sort((a, b) => (a.saidaGaragem ?? '').localeCompare(b.saidaGaragem ?? '')).map(record => ({ id: record.scheduleId ?? `legacy:${record.id}`, linha: record.linha, tabela: record.tabela,
      carroProgramado: isIndependentRelease(context) ? '' : record.carroProgramado ?? '', saidaGaragem: record.saidaGaragem ?? '', inicioLinha: record.inicioLinha ?? '' }));
    return { contexto: context, status: 'LEGADO', emitidoEm: clock().toISOString(), itens: releaseReportRows(storedRows, records),
      reserva: [], bloqueados: [], defeitosGaragem: garageDefects(records), reservasTerminais: [], auxiliaresIndisponiveis: true };
  }
  const rows = sheet ? await updatedReleaseSheetRows(db, context, sheet, records) : (await readReleaseProgramming(db, context, userId)).itens;
  return { ...await collectReleaseReport(db, context, userId, rows, records, clock()), status: record?.status ?? 'NAO_INICIADA' };
}
