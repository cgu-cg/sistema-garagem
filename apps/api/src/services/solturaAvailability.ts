import { randomUUID } from 'node:crypto';
import { canEditHistoricalRelease } from './releaseDateAccess';
import { assertReleaseStarted, lockReleaseSheet, parseReleaseSheet, releaseSheetWhere } from './releaseLifecycle';
import { isIndependentRelease } from './independentRelease';
import { officialFleet } from './escalaDiaria';
import { officialGarageFleet } from './escalaAllocation';
import type { PrismaClient, Soltura } from '@prisma/client';
import { z } from 'zod';
import { lockManualCI } from './c4Flow';
import { finalizedReleaseRows, releaseScaleContext, updatedReleaseSheetRows } from './releaseProgramming';
import { parseDailyContext } from './escalaDiaria';
import { canDispatch } from './operationalAccess';
import { assertC4Read } from './c4Authorization';
import { civil, dateValue, enabledGarages, addDays } from './c4Temporal';
import { notifyC4Updated } from './c4Events';
import { MvpError, operationalContext } from './mvpTemporal';
import { createSolturaSchema, createSolturaFields, batchSyncSolturaSchema } from '../utils/schemas';
import { appendReleaseExchange, garageDefects } from './releaseVehicleExchange';

export class AvailabilityError extends MvpError {
  constructor(public code: string) { super(409, `Soltura impedida: ${code}. Nenhum registro foi gravado.`); }
}
export function resolveReleaseContext(garagem: unknown, dataOperacao: unknown, now: Date, allowPast = false) {
  if (garagem !== 'VCG') throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
  if (!dataOperacao) throw new AvailabilityError('DATA_OPERACIONAL_OBRIGATORIA');
  const ciDate = civil(dataOperacao), ctx = operationalContext(now);
  if (ciDate !== ctx.today && !(allowPast && ciDate < ctx.today)) throw new AvailabilityError('DATA_FORA_DO_CONTEXTO');
  // A data pedida determina a CI, nao a data do servidor sozinha.
  // Nao transportar estados de ontem para autorizar a madrugada atual.
  return { ciDate, maintenanceDate: ctx.today };
}
const identifier = z.string().trim().min(1).max(100);
const releaseItem = createSolturaFields.extend({
  scheduleId: identifier,
  carroRealizado: z.string().trim().regex(/^\d{0,10}$/).optional().nullable(),
  driverCode: identifier,
});

export async function writeSafeRelease(db: PrismaClient, userId: number | undefined, body: unknown, batch: boolean,
  clock = () => new Date(), configured = () => enabledGarages(), loadFleet = officialFleet) {
  const parsed = batch ? batchSyncSolturaSchema.parse(body) : createSolturaSchema.parse(body);
  // Server configuration only; input flags cannot select the source.
  if (parsed.garagem !== 'VCG') throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
  const independent = isIndependentRelease({ escalaTipo: parsed.escalaTipo ?? '', turno: parsed.turno ?? '' });
  if (!independent && !configured().includes('VCG')) throw new AvailabilityError('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL');
  const before = operationalContext(clock());
  // Preflight autoriza somente prosseguir aos locks. A folha real e o papel sao revalidados abaixo.
  const preflight = parsed.dataOperacao && parsed.dataOperacao < before.today && userId ? await db.user.findUnique({ where: { id: userId } }) : null;
  const context = resolveReleaseContext(parsed.garagem, parsed.dataOperacao, clock(), preflight?.role === 'ADMIN');
  const releaseContext = parseDailyContext({ garagem: parsed.garagem, escalaTipo: parsed.escalaTipo,
    turno: parsed.escalaTipo === 'SEG_SEX' ? parsed.turno : 'PADRAO', dataOperacao: context.ciDate });
  const raw = batch ? (parsed as z.infer<typeof batchSyncSolturaSchema>).items : [parsed];
  const items = z.array(releaseItem).min(1).max(1000).parse(raw);
  if (!userId || !Number.isInteger(userId) || userId <= 0) throw new MvpError(403, 'Usuario autenticado obrigatorio.');
  if (new Set(items.map(i => i.scheduleId)).size !== items.length) throw new AvailabilityError('POSICAO_DUPLICADA_NO_LOTE');
  const fleet = independent ? officialGarageFleet(await loadFleet(), 'VCG') : null;
  const result = await db.$transaction(async tx => {
    // Mesma funcao e mesma ordem dos escritores CI, manutencao e scheduler.
    if (!independent) await lockManualCI(tx, 'VCG', context.ciDate);
    const scaleContext = releaseScaleContext(releaseContext);
    if (!independent) await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${scaleContext.garagem} AND data_operacao=${scaleContext.dataOperacao}`;
    const user = await tx.user.findUnique({ where: { id: userId }, include: { groups: true } });
    if (!canDispatch(user)) throw new MvpError(403, 'Sem permissao para despachar.');
    await assertC4Read(tx, userId, 'VCG');
    await lockReleaseSheet(tx, releaseContext);
    const releaseSheetRecord = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(releaseContext) });
    assertReleaseStarted(releaseSheetRecord);
    const releaseSheet = parseReleaseSheet(releaseSheetRecord!.conteudo);
    const checkTime = () => {
      const current = resolveReleaseContext(parsed.garagem, parsed.dataOperacao, clock(), canEditHistoricalRelease(user?.role, context.ciDate, operationalContext(clock()).today, releaseSheetRecord!.status));
      if ((!independent && !configured().includes('VCG')) || current.maintenanceDate !== context.maintenanceDate)
        throw new AvailabilityError('CONTEXTO_ALTERADO_DURANTE_GRAVACAO');
    };
    checkTime();
    let folha: { itens: { prefixo: string; categoria: string; statusItem: string | null }[] } | null = null;
    if (!independent) {
      const sourceFolha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: 'VCG', dataFolha: dateValue(context.ciDate) } }, include: { itens: true } });
      if (!sourceFolha) throw new AvailabilityError('CI_OPERACIONAL_AUSENTE');
      if (sourceFolha.status !== 'FINALIZADA') throw new AvailabilityError('CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA');
      if (sourceFolha.origem === 'RECUPERACAO') throw new AvailabilityError('CI_RECUPERADA_NAO_CERTIFICA_DISPONIBILIDADE');
      folha = sourceFolha;
      // Copia NORMAL de uma recuperacao vazia nao a transforma em fonte certificada.
      let ancestor = sourceFolha;
      const visited = new Set<number>();
      while (ancestor.origem !== 'IMPORTACAO') {
        if (ancestor.origem !== 'NORMAL' || !ancestor.folhaOrigemId || visited.has(ancestor.id))
          throw new AvailabilityError('ORIGEM_CI_NAO_CERTIFICADA');
        visited.add(ancestor.id);
        const parent = await tx.folhaCI.findUnique({ where: { id: ancestor.folhaOrigemId }, include: { itens: true } });
        if (!parent || parent.garagem !== 'VCG' || parent.status !== 'FINALIZADA' || parent.dataFolha >= ancestor.dataFolha)
          throw new AvailabilityError('ORIGEM_CI_NAO_CERTIFICADA');
        ancestor = parent;
      }

    }
    const liveProgramming = await finalizedReleaseRows(tx, releaseContext);
    if (!liveProgramming) throw new AvailabilityError('ESCALA_NAO_FINALIZADA');
    const dailyRecords = await tx.soltura.findMany({ where: { garagem: 'VCG', dataOperacao: context.ciDate } });
    const programming = await updatedReleaseSheetRows(tx, releaseContext, releaseSheet,
      dailyRecords.filter(record => record.escalaTipo === releaseContext.escalaTipo && record.turno === releaseContext.turno));
    const defects = new Set(garageDefects(dailyRecords).map(d => d.prefixo));
    const snapshots = new Map<string, { existing: Soltura | undefined; programmed: string | null; realized: string; history: ReturnType<typeof appendReleaseExchange>; row: typeof programming[number] }>();
    for (const i of items) {
      if (releaseSheet.itens.find(row => row.id === i.scheduleId)?.suspensa) throw new AvailabilityError('LINHA_SUSPENSA_REATIVE_ANTES_DE_LIBERAR');
      const row = programming.find(row => row.id === i.scheduleId);
      if (!row || row.linha !== i.linha || row.tabela !== i.tabela) throw new AvailabilityError('VIAGEM_FORA_DO_MOLDE');
      if (!row.tabela.trim() && row.tipo !== 'FRETAMENTO') throw new AvailabilityError('TABELA_OBRIGATORIA');
      const existing = dailyRecords.filter(r => r.scheduleId === i.scheduleId && r.turno === releaseContext.turno && r.escalaTipo === releaseContext.escalaTipo);
      if (existing.length > 1) throw new AvailabilityError('SOLTURA_DUPLICADA_EXISTENTE');
      const released = existing[0] && ['LIBERADO', 'SUBSTITUIDO'].includes(existing[0].status ?? '');
      const programmed = independent ? null : released ? existing[0].carroProgramado : row.carroProgramado || null;
      if (!released && releaseSheet.escalaVinculadaIds?.includes(row.id) && i.carroProgramado !== undefined
        && (i.carroProgramado || null) !== programmed) throw new AvailabilityError('CARRO_PROGRAMADO_ALTERADO_RECARREGUE');
      const realized = i.carroRealizado || programmed;
      if (!realized || !/^\d{1,10}$/.test(realized)) throw new AvailabilityError('CARRO_REALIZADO_OU_PROGRAMADO_OBRIGATORIO');
      if (fleet && !fleet.includes(realized)) throw new AvailabilityError('VEICULO_FORA_DA_FROTA');
      const history = appendReleaseExchange(existing[0]?.historicoTrocas, existing[0]?.carroRealizado, realized, i.trocaCarro, userId, clock());
      if (i.trocaCarro?.motivo === 'Defeito Garagem') {
        if (dailyRecords.some(r => r.id !== existing[0]?.id && r.turno === releaseContext.turno && r.escalaTipo === releaseContext.escalaTipo && r.carroRealizado === i.trocaCarro!.carroAnterior))
          throw new AvailabilityError('CARRO_RETIRADO_EM_OUTRO_DESPACHO');
        defects.add(i.trocaCarro.carroAnterior);
      }
      snapshots.set(i.scheduleId, { existing: existing[0], programmed, realized, history, row });
      if (folha?.itens.some(row => row.prefixo === realized && row.categoria === 'BLOQUEADO' && row.statusItem !== 'LIBERADO'))
        throw new AvailabilityError('VEICULO_BLOQUEADO_NA_CI');
      // IDs auxiliares nao podem apontar para outro veiculo que o checado.
      if (i.busId) {
        const bus = await tx.bus.findUnique({ where: { id: i.busId } });
        if (!bus || bus.prefix !== realized) throw new AvailabilityError('IDENTIDADE_DO_VEICULO_DIVERGENTE');
      }
      if (i.programmedBusId) {
        const bus = await tx.bus.findUnique({ where: { id: i.programmedBusId } });
        if (!bus || bus.prefix !== programmed) throw new AvailabilityError('IDENTIDADE_PROGRAMADA_DIVERGENTE');
      }
    }
    // Inclui defeitos declarados no proprio lote, independentemente da ordem.
    for (const snapshot of snapshots.values()) if (defects.has(snapshot.realized)) throw new AvailabilityError('VEICULO_COM_DEFEITO_GARAGEM');
    const historicalEdit = canEditHistoricalRelease(user?.role, context.ciDate, operationalContext(clock()).today, releaseSheetRecord!.status);
    if (historicalEdit) releaseSheet.limpezas = [...(releaseSheet.limpezas ?? []), ...items.map(item => ({
      id: randomUUID(), linhaId: item.scheduleId, usuarioId: userId, registradoEm: clock().toISOString(),
      anterior: JSON.stringify({ operacao: 'EDICAO_ADMIN_HISTORICA',
        registro: snapshots.get(item.scheduleId)!.existing ?? null, linha: snapshots.get(item.scheduleId)!.row }),
    }))];
    const sheetChanged = historicalEdit || JSON.stringify(programming) !== JSON.stringify(releaseSheet.itens);
    const nextContent = sheetChanged ? JSON.stringify(parseReleaseSheet(JSON.stringify({ ...releaseSheet, itens: programming }))) : null;
    const records = [];
    for (const i of items) {
      const where = { scheduleId: i.scheduleId, dataOperacao: context.ciDate, garagem: 'VCG', turno: releaseContext.turno, escalaTipo: releaseContext.escalaTipo };
      const { existing, programmed, realized, history, row } = snapshots.get(i.scheduleId)!;
      const { garagem: _g, dataOperacao: _d, turno: _t, escalaTipo: _e, trocaCarro: _troca, historicoTrocas: _history, ...fields } = i;
      const data = { ...fields, ...where, userId, status: 'LIBERADO', carroProgramado: programmed, carroRealizado: realized,
        substituido: independent ? history.length > 0 : realized !== (programmed ?? ''),
        linha: existing?.linha ?? row.linha, tabela: existing?.tabela ?? row.tabela,
        saidaGaragem: existing ? existing.saidaGaragem : row.saidaGaragem,
        inicioLinha: existing ? existing.inicioLinha : row.inicioLinha ?? row.inicioBairro ?? null,
        historicoTrocas: JSON.stringify(history) };
      records.push(existing ? await tx.soltura.update({ where: { id: existing.id }, data }) : await tx.soltura.create({ data }));
    }
    if (nextContent !== null) {
      await tx.folhaSoltura.update({ where: { id: releaseSheetRecord!.id }, data: {
        conteudo: nextContent,
        revisao: releaseSheetRecord!.revisao + 1, responsavelId: userId,
      } });
    }
    checkTime();
    return batch ? { count: records.length, items: records } : records[0];
  }, { isolationLevel: 'Serializable' });
  // Transporte de invalidacao compartilhado; nao consulta nem altera CI.
  await notifyC4Updated('VCG', addDays(context.ciDate, -1));
  return result;
}
