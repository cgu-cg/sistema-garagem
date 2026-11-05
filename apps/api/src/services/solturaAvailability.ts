import { registerCiUse } from './portariaEvents';
import { isVcmMorningRelease, supportsReleaseContext } from './releaseSupport';
import { authorizeCiUse } from './ciUseConfirmation';
import { duplicateUseNotice, ReleaseDuplicateUseError, type ReleaseAssignment } from './releaseDuplicateUse';
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
import { parseDailyContext, parseStoredDailyScale } from './escalaDiaria';
import { canDispatch } from './operationalAccess';
import { assertC4Read } from './c4Authorization';
import { civil, dateValue, enabledGarages, addDays } from './c4Temporal';
import { notifyC4Updated } from './c4Events';
import { MvpError, operationalContext } from './mvpTemporal';
import { createSolturaSchema, createSolturaFields, batchSyncSolturaSchema } from '../utils/schemas';
import { releaseWithdrawals } from './releaseWithdrawals';
import { appendReleaseExchange, garageDefects } from './releaseVehicleExchange';

export class AvailabilityError extends MvpError {
  constructor(public code: string) { super(409, `Soltura impedida: ${code}. Nenhum registro foi gravado.`); }
}
export function resolveReleaseContext(garagem: unknown, dataOperacao: unknown, now: Date, allowPast = false) {
  if (garagem !== 'VCG' && garagem !== 'VCM') throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
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
  if (!supportsReleaseContext(parsed)) throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
  const independent = isIndependentRelease({ escalaTipo: parsed.escalaTipo ?? '', turno: parsed.turno ?? '' });
  if (!independent && !isVcmMorningRelease(parsed) && !configured().includes('VCG')) throw new AvailabilityError('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL');
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
  const fleet = independent || isVcmMorningRelease(releaseContext) ? officialGarageFleet(await loadFleet(), releaseContext.garagem) : null;
  const result = await db.$transaction(async tx => {
    // Mesma funcao e mesma ordem dos escritores CI, manutencao e scheduler.
    await lockManualCI(tx, releaseContext.garagem, context.ciDate);
    const scaleContext = releaseScaleContext(releaseContext);
    if (!independent) await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${scaleContext.garagem} AND data_operacao=${scaleContext.dataOperacao}`;
    const user = await tx.user.findUnique({ where: { id: userId }, include: { groups: true } });
    if (!canDispatch(user)) throw new MvpError(403, 'Sem permissao para despachar.');
    await assertC4Read(tx, userId, releaseContext.garagem);
    await lockReleaseSheet(tx, releaseContext);
    const releaseSheetRecord = await tx.folhaSoltura.findUnique({ where: releaseSheetWhere(releaseContext) });
    assertReleaseStarted(releaseSheetRecord);
    const releaseSheet = parseReleaseSheet(releaseSheetRecord!.conteudo);
    const checkTime = () => {
      const current = resolveReleaseContext(parsed.garagem, parsed.dataOperacao, clock(), canEditHistoricalRelease(user?.role, context.ciDate, operationalContext(clock()).today, releaseSheetRecord!.status));
      if ((!independent && !isVcmMorningRelease(releaseContext) && !configured().includes(releaseContext.garagem)) || current.maintenanceDate !== context.maintenanceDate)
        throw new AvailabilityError('CONTEXTO_ALTERADO_DURANTE_GRAVACAO');
    };
    checkTime();
    const previousCiUses = JSON.stringify(releaseSheet.usosBloqueadosCI ?? []);
    let folha: { itens: { prefixo: string; categoria: string; statusItem: string | null; folhaId?: number; chaveItem?: string }[] } | null = null;
    if (!independent) {
      const sourceFolha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: releaseContext.garagem, dataFolha: dateValue(context.ciDate) } }, include: { itens: true } });
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
        if (!parent || parent.garagem !== releaseContext.garagem || parent.status !== 'FINALIZADA' || parent.dataFolha >= ancestor.dataFolha)
          throw new AvailabilityError('ORIGEM_CI_NAO_CERTIFICADA');
        ancestor = parent;
      }

    }
    if (independent) folha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: releaseContext.garagem, dataFolha: dateValue(context.ciDate) } }, include: { itens: true } });
    const liveProgramming = await finalizedReleaseRows(tx, releaseContext);
    if (!liveProgramming) throw new AvailabilityError('ESCALA_NAO_FINALIZADA');
    const sourceScale = !independent ? await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: scaleContext } }) : null;
    const portaria = new Set((sourceScale ? parseStoredDailyScale(sourceScale.conteudo, scaleContext).cards ?? [] : [])
      .filter(card => card.id === 'PORTARIA').flatMap(card => card.itens.map(item => item.prefixo)));
    const dailyRecords = await tx.soltura.findMany({ where: { garagem: releaseContext.garagem, dataOperacao: context.ciDate } });
    const programming = await updatedReleaseSheetRows(tx, releaseContext, releaseSheet,
      dailyRecords.filter(record => record.escalaTipo === releaseContext.escalaTipo && record.turno === releaseContext.turno));
    // Projeta o resultado inteiro do lote antes de validar repeticoes ou retiradas.
    const currentRecords = dailyRecords.filter(r => r.escalaTipo === releaseContext.escalaTipo && r.turno === releaseContext.turno);
    const assignments: ReleaseAssignment[] = currentRecords.filter(r => r.scheduleId && !items.some(i => i.scheduleId === r.scheduleId))
      .map(r => ({ scheduleId: r.scheduleId!, linha: r.linha, tabela: r.tabela ?? '', carroRealizado: r.carroRealizado, driverCode: r.driverCode }));
    for (const i of items) {
      const existing = currentRecords.find(r => r.scheduleId === i.scheduleId);
      const released = existing && ['LIBERADO', 'SUBSTITUIDO'].includes(existing.status ?? '');
      const programmed = independent ? null : released ? existing.carroProgramado : programming.find(r => r.id === i.scheduleId)?.carroProgramado;
      assignments.push({ scheduleId: i.scheduleId, linha: i.linha, tabela: i.tabela,
        carroRealizado: i.carroRealizado || programmed || null, driverCode: i.driverCode });
    }
    const sharedElsewhere = (prefixo: string, scheduleId: string) => assignments.some(r => r.scheduleId !== scheduleId && r.carroRealizado === prefixo);
    const defects = new Set(garageDefects(dailyRecords).map(d => d.prefixo));
    const pendingWithdrawals = new Set<string>();
    const batchWithdrawals = new Set<string>();
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
      const history = appendReleaseExchange(existing[0]?.historicoTrocas, existing[0]?.carroRealizado || programmed, realized, i.trocaCarro, userId, clock());
      if (i.trocaCarro?.motivo === 'Defeito Garagem') {
        if (dailyRecords.some(r => r.id !== existing[0]?.id && r.turno === releaseContext.turno && r.escalaTipo === releaseContext.escalaTipo && r.carroRealizado === i.trocaCarro!.carroAnterior))
          throw new AvailabilityError('CARRO_RETIRADO_EM_OUTRO_DESPACHO');
        defects.add(i.trocaCarro.carroAnterior);
      }
      const retirada = history.length > (existing[0]?.historicoTrocas ? JSON.parse(existing[0].historicoTrocas).length : 0) ? history.at(-1) : null;
      if ((retirada?.destino === 'PENDENTE' || retirada?.destino === 'RESERVA') && typeof retirada.carroAnterior === 'string' && sharedElsewhere(retirada.carroAnterior, i.scheduleId)) {
        // A troca fica no historico, mas o carro nao foi retirado da operacao.
        retirada.destino = 'DESFEITO';
        retirada.motivo = 'Carro mantido em outra linha da mesma Soltura';
      }
      if ((retirada?.destino === 'PENDENTE' || retirada?.destino === 'RESERVA') && typeof retirada.carroAnterior === 'string' && batchWithdrawals.has(retirada.carroAnterior)) {
        retirada.destino = 'DESFEITO';
        retirada.motivo = 'Retirada registrada em outra linha deste lote';
      }
      if (retirada?.destino === 'PENDENTE' && typeof retirada.carroAnterior === 'string') {
        if (pendingWithdrawals.has(retirada.carroAnterior) || defects.has(retirada.carroAnterior))
          throw new AvailabilityError('CARRO_RETIRADO_JA_PENDENTE_OU_BLOQUEADO');
        pendingWithdrawals.add(retirada.carroAnterior);
        batchWithdrawals.add(retirada.carroAnterior);
      }
      snapshots.set(i.scheduleId, { existing: existing[0], programmed, realized, history, row });
      const uso = authorizeCiUse({ linhaId: i.scheduleId, prefixo: realized, ciData: context.ciDate,
        bloqueados: folha?.itens.filter(row => row.categoria === 'BLOQUEADO' && row.statusItem !== 'LIBERADO').map(row => row.prefixo) ?? [],
        confirmar: i.confirmarBloqueadoCI, anterior: released && existing[0]?.carroRealizado === realized
          ? releaseSheet.usosBloqueadosCI?.find(c => c.linhaId === i.scheduleId && c.prefixo === realized) : undefined,
        usuarioId: userId, agora: clock() });
      if (uso && i.confirmarBloqueadoCI) {
        const ciItem = folha?.itens.find(row => row.prefixo === realized && row.categoria === 'BLOQUEADO' && row.statusItem !== 'LIBERADO');
        if (ciItem) await registerCiUse(tx, releaseContext, ciItem, userId, `Linha ${i.linha} / Tab ${i.tabela}`, clock());
      }
      const usos = (releaseSheet.usosBloqueadosCI ?? []).filter(c => c.linhaId !== i.scheduleId);
      if (uso) usos.push(uso);
      if (uso || releaseSheet.usosBloqueadosCI) releaseSheet.usosBloqueadosCI = usos;
      if (uso && i.confirmarBloqueadoCI) releaseSheet.limpezas = [...(releaseSheet.limpezas ?? []), {
        id: randomUUID(), linhaId: i.scheduleId, usuarioId: userId, registradoEm: clock().toISOString(),
        anterior: JSON.stringify({ operacao: 'USO_BLOQUEADO_CI', ...uso }),
      }];
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
    for (const snapshot of snapshots.values()) if (portaria.has(snapshot.realized)) throw new AvailabilityError('VEICULO_BLOQUEADO_NA_PORTARIA');
    for (const snapshot of snapshots.values()) if (defects.has(snapshot.realized)) throw new AvailabilityError('VEICULO_COM_DEFEITO_GARAGEM');
    for (const snapshot of snapshots.values()) if (pendingWithdrawals.has(snapshot.realized)) throw new AvailabilityError('CARRO_AGUARDANDO_TRATATIVA');
    const duplicateUse = duplicateUseNotice(releaseContext, assignments, items.map(i => i.scheduleId));
    if (duplicateUse.conflitos.length && parsed.confirmarRepeticao !== duplicateUse.token) throw new ReleaseDuplicateUseError(duplicateUse);
    if (duplicateUse.conflitos.length) releaseSheet.limpezas = [...(releaseSheet.limpezas ?? []), {
      id: randomUUID(), linhaId: items[0].scheduleId, usuarioId: userId, registradoEm: clock().toISOString(),
      anterior: JSON.stringify({ operacao: 'USO_REPETIDO_CONFIRMADO', ...duplicateUse }),
    }];
    const historicalEdit = canEditHistoricalRelease(user?.role, context.ciDate, operationalContext(clock()).today, releaseSheetRecord!.status);
    if (historicalEdit) releaseSheet.limpezas = [...(releaseSheet.limpezas ?? []), ...items.map(item => ({
      id: randomUUID(), linhaId: item.scheduleId, usuarioId: userId, registradoEm: clock().toISOString(),
      anterior: JSON.stringify({ operacao: 'EDICAO_ADMIN_HISTORICA',
        registro: snapshots.get(item.scheduleId)!.existing ?? null, linha: snapshots.get(item.scheduleId)!.row }),
    }))];
    const sheetChanged = duplicateUse.conflitos.length > 0 || historicalEdit || items.some(i => Boolean(i.confirmarBloqueadoCI)) || previousCiUses !== JSON.stringify(releaseSheet.usosBloqueadosCI ?? []) || JSON.stringify(programming) !== JSON.stringify(releaseSheet.itens);
    const nextContent = sheetChanged ? JSON.stringify(parseReleaseSheet(JSON.stringify({ ...releaseSheet, itens: programming }))) : null;
    const records = [];
    for (const i of items) {
      const where = { scheduleId: i.scheduleId, dataOperacao: context.ciDate, garagem: releaseContext.garagem, turno: releaseContext.turno, escalaTipo: releaseContext.escalaTipo };
      const { existing, programmed, realized, history, row } = snapshots.get(i.scheduleId)!;
      const { garagem: _g, dataOperacao: _d, turno: _t, escalaTipo: _e, trocaCarro: _troca, confirmarBloqueadoCI: _confirmarCI, confirmarRepeticao: _confirmarRepeticao, historicoTrocas: _history, ...fields } = i;
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
  await notifyC4Updated(releaseContext.garagem, addDays(context.ciDate, -1));
  return result;
}
