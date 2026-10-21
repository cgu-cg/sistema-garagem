import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { lockC4Context } from './c4Flow';
import { assertC4Read } from './c4Authorization';
import { addDays, civil, dateValue, enabledGarages, eventInstant } from './c4Temporal';
import { MvpError, operationalContext } from './mvpTemporal';
import { createSolturaSchema, createSolturaFields, batchSyncSolturaSchema } from '../utils/schemas';

export class AvailabilityError extends MvpError {
  constructor(public code: string) { super(409, `Soltura impedida: ${code}. Nenhum registro foi gravado.`); }
}
export function resolveReleaseContext(garagem: unknown, dataOperacao: unknown, now: Date) {
  if (garagem !== 'VCG') throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
  if (!dataOperacao) throw new AvailabilityError('DATA_OPERACIONAL_OBRIGATORIA');
  const ciDate = civil(dataOperacao), ctx = operationalContext(now);
  if (ciDate !== ctx.today && ciDate !== ctx.tomorrow) throw new AvailabilityError('DATA_FORA_DO_CONTEXTO');
  // A data pedida determina a CI, nao a data do servidor sozinha.
  // Nao transportar estados de ontem para autorizar a madrugada atual.
  if (now < eventInstant(ctx.today, 3)) throw new AvailabilityError('MANUTENCAO_ATUAL_NA_MADRUGADA_NAO_COMPROVADA');
  return { ciDate, maintenanceDate: ctx.today };
}
const identifier = z.string().trim().min(1).max(100);
const releaseItem = createSolturaFields.extend({
  scheduleId: identifier,
  carroRealizado: z.string().regex(/^\d{1,10}$/),
  driverCode: identifier,
});

export async function writeSafeRelease(db: PrismaClient, userId: number | undefined, body: unknown, batch: boolean,
  clock = () => new Date(), configured = () => enabledGarages()) {
  const parsed = batch ? batchSyncSolturaSchema.parse(body) : createSolturaSchema.parse(body);
  // Server configuration only; input flags cannot select the source.
  if (parsed.garagem !== 'VCG') throw new AvailabilityError('FONTE_VCM_NAO_COMPROVADA');
  if (!configured().includes('VCG')) throw new AvailabilityError('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL');
  const context = resolveReleaseContext(parsed.garagem, parsed.dataOperacao, clock());
  const raw = batch ? (parsed as z.infer<typeof batchSyncSolturaSchema>).items : [parsed];
  const items = z.array(releaseItem).min(1).max(1000).parse(raw);
  if (!userId || !Number.isInteger(userId) || userId <= 0) throw new MvpError(403, 'Usuario autenticado obrigatorio.');
  if (new Set(items.map(i => i.scheduleId)).size !== items.length) throw new AvailabilityError('POSICAO_DUPLICADA_NO_LOTE');
  return db.$transaction(async tx => {
    // Mesma funcao e mesma ordem dos escritores CI, manutencao e scheduler.
    await lockC4Context(tx, 'VCG', context.maintenanceDate);
    await assertC4Read(tx, userId, 'VCG');
    const checkTime = () => {
      const current = resolveReleaseContext(parsed.garagem, parsed.dataOperacao, clock());
      if (!configured().includes('VCG') || current.maintenanceDate !== context.maintenanceDate)
        throw new AvailabilityError('CONTEXTO_ALTERADO_DURANTE_GRAVACAO');
    };
    checkTime();
    const cycle = await tx.cicloOperacional.findUnique({ where: { garagem_dataOperacional: { garagem: 'VCG', dataOperacional: dateValue(context.maintenanceDate) } } });
    if (!cycle || cycle.origem !== 'NORMAL') throw new AvailabilityError('MANUTENCAO_ATUAL_NAO_COMPROVADA');
    const folha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: 'VCG', dataFolha: dateValue(context.ciDate) } }, include: { itens: true } });
    if (!folha) throw new AvailabilityError('CI_OPERACIONAL_AUSENTE');
    if (folha.status !== 'FINALIZADA') throw new AvailabilityError('CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA');
    if (folha.origem === 'RECUPERACAO') throw new AvailabilityError('CI_RECUPERADA_NAO_CERTIFICA_DISPONIBILIDADE');
    // Copia NORMAL de uma recuperacao vazia nao a transforma em fonte certificada.
    let ancestor = folha;
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
    const preparationDate = addDays(context.maintenanceDate, 1);
    const preparation = context.ciDate === preparationDate ? folha
      : await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: 'VCG', dataFolha: dateValue(preparationDate) } }, include: { itens: true } });
    if (!preparation || preparation.cicloPreparacaoId !== cycle.id || preparation.origem !== 'NORMAL'
      || !['EM_PREPARACAO', 'FINALIZADA'].includes(preparation.status))
      throw new AvailabilityError('VINCULO_CI_MANUTENCAO_NAO_COMPROVADO');
    const states = await tx.estadoManutencao.findMany({ where: { cicloId: cycle.id } });
    if (states.some(s => s.liberado && (s.bloqueado || s.emExecucao)) || new Set(states.map(s => s.prefixo)).size !== states.length)
      throw new AvailabilityError('MANUTENCAO_INCONSISTENTE');
    const blocks = preparation.itens.filter(i => i.categoria === 'BLOQUEADO');
    const currentBlocks = states.filter(s => s.bloqueado);
    if (new Set(blocks.map(i => i.prefixo)).size !== blocks.length || blocks.length !== currentBlocks.length
      || blocks.some(i => !currentBlocks.some(s => s.prefixo === i.prefixo && s.consorciada === i.consorciada)))
      throw new AvailabilityError('CI_MANUTENCAO_DIVERGENTES');
    for (const i of items) {
      if (folha.itens.some(row => row.prefixo === i.carroRealizado && row.categoria === 'BLOQUEADO'))
        throw new AvailabilityError('VEICULO_BLOQUEADO_NA_CI');
      if (states.some(s => s.prefixo === i.carroRealizado && (s.bloqueado || s.emExecucao)))
        throw new AvailabilityError('VEICULO_BLOQUEADO_OU_EM_EXECUCAO');
      // IDs auxiliares nao podem apontar para outro veiculo que o checado.
      if (i.busId) {
        const bus = await tx.bus.findUnique({ where: { id: i.busId } });
        if (!bus || bus.prefix !== i.carroRealizado) throw new AvailabilityError('IDENTIDADE_DO_VEICULO_DIVERGENTE');
      }
      if (i.programmedBusId) {
        const bus = await tx.bus.findUnique({ where: { id: i.programmedBusId } });
        if (!bus || bus.prefix !== i.carroProgramado) throw new AvailabilityError('IDENTIDADE_PROGRAMADA_DIVERGENTE');
      }
    }
    const records = [];
    for (const i of items) {
      const where = { scheduleId: i.scheduleId, dataOperacao: context.ciDate, garagem: 'VCG', turno: parsed.turno ?? null, escalaTipo: parsed.escalaTipo ?? null };
      const existing = await tx.soltura.findMany({ where });
      if (existing.length > 1) throw new AvailabilityError('SOLTURA_DUPLICADA_EXISTENTE');
      const { garagem: _g, dataOperacao: _d, turno: _t, escalaTipo: _e, ...fields } = i;
      const data = { ...fields, ...where, userId, status: 'LIBERADO',
        historicoTrocas: typeof i.historicoTrocas === 'string' ? i.historicoTrocas : i.historicoTrocas ? JSON.stringify(i.historicoTrocas) : null };
      records.push(existing[0] ? await tx.soltura.update({ where: { id: existing[0].id }, data }) : await tx.soltura.create({ data }));
    }
    checkTime();
    return batch ? { count: records.length, items: records } : records[0];
  }, { isolationLevel: 'Serializable' });
}
