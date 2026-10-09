import { createHash, randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient, ItemFolhaCI, EstadoManutencao } from '@prisma/client';
import { z } from 'zod';
import { MvpError, assertFlags, revision } from './mvpTemporal';
import { operationalContext, assertC4Context, C4_CLOSE_HOUR, Garage, garage, civil, dateValue, dateString, addDays, eventInstant } from './c4Temporal';
import { canWriteC4 } from './c4Authorization';

type Tx = Prisma.TransactionClient;
export const titles = ['INSPEÇÃO', 'LUBRIFICAÇÃO', 'EM MANUTENÇÃO', 'TROCA DE ÓLEO', 'REVISÃO', 'PREVENTIVA'] as const;
const company = z.enum(['VSF', 'VCG', 'JTU', 'VCM']);
const prefix = z.string().regex(/^\d{1,10}$/);
const itemSchema = z.object({
  id: z.string().min(1).max(100), chaveItem: z.string().uuid().optional(), prefixo: prefix, consorciada: company.nullish(),
  garagem: z.enum(['VCG', 'VCM']), data: z.string(),
  categoriaPlanilha: z.enum(['PREVENTIVA', 'OFICINA', 'REFORCO', 'BLOQUEADO']),
  motivo: z.string().max(255).nullish(), os: z.string().max(255).nullish(),
  setorOficina: z.string().max(50).nullish(), tipoPreventiva: z.string().max(50).nullish(),
  horarioReforco: z.string().max(20).nullish(), tipoPosicao: z.enum(['FIXO', 'EXTRA']).nullish(), ordemPosicao: z.number().int().positive().max(2147483647).nullish(),
  dataBloqueio: z.string().nullish(), hora: z.string().max(10).nullish(), gravidade: z.string().max(10).nullish(),
  responsavel: z.string().max(100).nullish(), status: z.string().max(20).nullish(),
  dataLiberacao: z.string().max(50).nullish(), motivoLiberacao: z.string().max(255).nullish(), responsavelLiberacao: z.string().max(100).nullish(),
});
const stateSchema = z.object({
  id: z.string().min(1).max(100), prefixo: prefix, consorciada: company, data: z.string(),
  observacao: z.string().max(255).nullish(), observacaoBloqueio: z.string().max(255).nullish(), observacaoOficina: z.string().max(255).nullish(),
  bloqueado: z.boolean(), emExecucao: z.boolean(), liberado: z.boolean(), dataBloqueio: z.string().nullish(),
});
const commandSchema = z.object({
  garagem: z.enum(['VCG', 'VCM']), data: z.string(), baseC4: z.string(), base: z.string(),
  removeBlocked: z.array(prefix).default([]), confirmRelease: z.boolean().default(false),
  tituloColunaAdicional: z.enum(titles).nullish(), operation: z.enum(['save', 'prepare']).default('save'),
});

// Todos os escritores (inclusive jobs) tomam os mesmos locks por garagem/dia.
// HOLDLOCK protege tambem a chave ausente; nunca trava globalmente todas as garagens.
async function lock(tx: Tx, scope: Garage, day: string) {
  await tx.$queryRaw`SELECT id FROM dbo.ciclo_operacional WITH (UPDLOCK, HOLDLOCK) WHERE garagem = ${scope} AND data_operacional = ${dateValue(day)}`;
  await tx.$queryRaw`SELECT id FROM dbo.folha_ci WITH (UPDLOCK, HOLDLOCK) WHERE garagem = ${scope} AND data_folha = ${dateValue(addDays(day, 1))}`;
}
async function bundle(tx: Tx, scope: Garage, day: string) {
  const cycle = await tx.cicloOperacional.findUnique({ where: { garagem_dataOperacional: { garagem: scope, dataOperacional: dateValue(day) } } });
  const folha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: scope, dataFolha: dateValue(addDays(day, 1)) } }, include: { itens: { orderBy: { id: 'asc' } } } });
  const states = cycle ? await tx.estadoManutencao.findMany({ where: { cicloId: cycle.id }, orderBy: { id: 'asc' } }) : [];
  const baseC4 = createHash('sha256').update(JSON.stringify([cycle, folha, states])).digest('hex');
  return { cycle, folha, states, baseC4 };
}
export function projectItem(i: ItemFolhaCI, scope: string, day: string) {
  return { id: `c4-ci-${i.id}`, chaveItem: i.chaveItem, updatedAt: i.updatedAt, garagem: scope, data: day,
    prefixo: i.prefixo, consorciada: i.consorciada, categoriaPlanilha: i.categoria,
    setorOficina: i.categoria === 'OFICINA' ? i.subTipo : undefined, tipoPreventiva: i.categoria === 'PREVENTIVA' ? i.subTipo : undefined,
    horarioReforco: i.horarioReforco, tipoPosicao: i.tipoPosicao, ordemPosicao: i.ordemPosicao,
    reforcoSlotId: i.tipoPosicao ? `${i.tipoPosicao === 'EXTRA' ? 'ref-extra' : 'ref'}-${i.ordemPosicao}` : undefined,
    motivo: i.motivo, os: i.observacoes, dataBloqueio: i.dataBloqueio ? dateString(i.dataBloqueio) : null,
    hora: i.horaBloqueio, gravidade: i.gravidade, responsavel: i.responsavel,
    status: i.statusItem, tipo: i.categoria === 'BLOQUEADO' ? 'BLOQUEADO_CORRETIVA' : 'REFORCO_REVISAO',
    dataLiberacao: i.dataLiberacao, motivoLiberacao: i.motivoLiberacao, responsavelLiberacao: i.responsavelLiberacao };
}
export function projectState(s: EstadoManutencao, day: string) {
  return { ...s, id: `c4-m-${s.id}`, data: day, observacao: s.bloqueado ? s.observacaoBloqueio : s.observacaoOficina };
}
export async function readContext(db: PrismaClient, scope: Garage, day: string) {
  civil(day);
  // Leitura coerente: nao cria estrutura nem chama recuperacao, mesmo se ausente.
  return db.$transaction(async tx => {
    const b = await bundle(tx, scope, day);
    const folhas = await tx.folhaCI.findMany({ where: { garagem: scope }, include: { itens: { orderBy: { id: 'asc' } } }, orderBy: { dataFolha: 'asc' } });
    return { mode: 'C4', garagem: scope, day, baseC4: b.baseC4,
      cycle: b.cycle, folha: b.folha ? { ...b.folha, itens: undefined } : null,
      folhas: folhas.map(f => ({ ...f, itens: undefined, dataFolha: dateString(f.dataFolha) })),
      ci: folhas.flatMap(f => f.itens.map(i => projectItem(i, scope, dateString(f.dataFolha)))),
      maintenance: b.states.map(s => projectState(s, day)),
      mutable: operationalContext().open && day === operationalContext().today && b.folha?.status === 'EM_PREPARACAO' && b.folha.cicloPreparacaoId === b.cycle?.id };
  }, { isolationLevel: 'Serializable' });
}

export function validateItems(items: z.infer<typeof itemSchema>[], scope: Garage, day: string, blockCutoff = day) {
  if (new Set(items.map(i => i.id)).size !== items.length) throw new MvpError(400, 'IDs duplicados.');
  const blocks = new Set<string>(), slots = new Set<string>();
  for (const i of items) {
    if (i.garagem !== scope || i.data !== day) throw new MvpError(400, 'Item fora da folha explicita.');
    if (i.categoriaPlanilha === 'BLOQUEADO') {
      if (i.consorciada == null) throw new MvpError(400, 'BLOQUEADO exige consorciada explicita.');
      company.parse(i.consorciada);
      if (blocks.has(i.prefixo)) throw new MvpError(409, 'Segundo BLOQUEADO para o mesmo prefixo/folha.');
      blocks.add(i.prefixo);
      if (civil(i.dataBloqueio) > blockCutoff) throw new MvpError(400, 'Data de bloqueio futura no contexto operacional.');
      if (i.status === 'LIBERADO') throw new MvpError(400, 'Retire o bloqueio explicitamente; nao grave BLOQUEADO liberado.');
    }
    if (i.categoriaPlanilha === 'REFORCO') {
      if (!i.tipoPosicao || !i.ordemPosicao || (i.tipoPosicao === 'FIXO' && i.ordemPosicao > 12)) throw new MvpError(400, 'Posicao do reforco invalida.');
      const key = `${i.tipoPosicao}:${i.ordemPosicao}`;
      if (slots.has(key)) throw new MvpError(409, 'Posicao de reforco duplicada.');
      slots.add(key);
    } else if (i.tipoPosicao != null || i.ordemPosicao != null) throw new MvpError(400, 'Posicao so pertence ao reforco.');
  }
}
function itemData(i: z.infer<typeof itemSchema>) {
  return { categoria: i.categoriaPlanilha, prefixo: i.prefixo, consorciada: i.consorciada ?? null,
    subTipo: i.categoriaPlanilha === 'OFICINA' ? i.setorOficina ?? null : i.categoriaPlanilha === 'PREVENTIVA' ? i.tipoPreventiva ?? null : null,
    tipoPosicao: i.tipoPosicao ?? null, ordemPosicao: i.ordemPosicao ?? null, horarioReforco: i.horarioReforco ?? null,
    motivo: i.motivo ?? null, observacoes: i.os ?? null, dataBloqueio: i.categoriaPlanilha === 'BLOQUEADO' ? dateValue(civil(i.dataBloqueio)) : null,
    horaBloqueio: i.hora ?? null, gravidade: i.gravidade ?? null, responsavel: i.responsavel ?? null, statusItem: i.status ?? null,
    dataLiberacao: i.dataLiberacao ?? null, motivoLiberacao: i.motivoLiberacao ?? null, responsavelLiberacao: i.responsavelLiberacao ?? null };
}
function explicitRemovals(before: string[], after: string[], requested: string[]) {
  const removed = before.filter(p => !after.includes(p));
  if (new Set(requested).size !== requested.length || requested.some(p => !removed.includes(p)) || removed.some(p => !requested.includes(p))) throw new MvpError(409, 'Retirada de BLOQUEADO exige intencao explicita.');
}
async function authorized(tx: Tx, userId: number | undefined, day: string, kind: 'ci' | 'manutencao', now: () => Date, scope: Garage) {
  const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
  if (!canWriteC4(user, scope)) throw new MvpError(403, 'Fluxo C4 exige ADMIN ou manutencao vinculada a VCG.');
  return assertC4Context(day, kind, now());
}

export async function saveC4(db: PrismaClient, userId: number | undefined, body: unknown, kind: 'ci' | 'manutencao', now = () => new Date()) {
  const c = commandSchema.parse(body);
  const items = kind === 'ci' ? z.array(itemSchema).max(5000).parse((body as { items?: unknown }).items) : [];
  const states = kind === 'manutencao' ? z.array(stateSchema).max(5000).parse((body as { items?: unknown }).items) : [];
  const day = kind === 'ci' ? addDays(civil(c.data), -1) : civil(c.data);
  const target = addDays(day, 1);
  if (kind === 'ci') validateItems(items, c.garagem, target, day);
  if (kind === 'manutencao') {
    assertFlags(states);
    if (new Set(states.map(s => s.prefixo)).size !== states.length || new Set(states.map(s => s.id)).size !== states.length) throw new MvpError(409, 'C4 exige um estado por veiculo/ciclo.');
    if (states.some(s => s.data !== day)) throw new MvpError(400, 'Estado fora do ciclo.');
  }
  return db.$transaction(async tx => {
    await lock(tx, c.garagem, day);
    await authorized(tx, userId, c.data, kind, now, c.garagem);
    const b = await bundle(tx, c.garagem, day);
    if (!b.cycle || !b.folha || b.folha.status !== 'EM_PREPARACAO' || b.folha.cicloPreparacaoId !== b.cycle.id) throw new MvpError(409, 'Ciclo/folha em preparacao indisponivel; consulta nunca inicializa.');
    if (c.baseC4 !== b.baseC4) throw new MvpError(409, 'Snapshot C4 desatualizado. Recarregue CI e Controle.');
    const folha = b.folha, cycle = b.cycle;
    const current = kind === 'ci' ? folha.itens.map(i => projectItem(i, c.garagem, target)) : b.states.map(s => projectState(s, day));
    if (c.base !== revision(current)) throw new MvpError(409, 'Conteudo de origem desatualizado.');
    if (c.operation === 'prepare') {
      if (kind !== 'ci' || items.length) throw new MvpError(400, 'Consulta de preparacao nao recebe itens.');
      return { unchanged: true };
    }
    // Divergencia preexistente nao pode ser corrigida implicitamente por uma gravacao.
    const oldBlocks = folha.itens.filter(i => i.categoria === 'BLOQUEADO');
    if (oldBlocks.length !== b.states.filter(s => s.bloqueado).length || oldBlocks.some(i => !b.states.some(s => s.bloqueado && s.prefixo === i.prefixo && s.consorciada === i.consorciada && (s.observacaoBloqueio ?? null) === (i.motivo ?? null)))) throw new MvpError(409, 'CI e Controle divergentes; revisao explicita necessaria.');
    if (kind === 'ci') {
      explicitRemovals(oldBlocks.map(i => i.prefixo), items.filter(i => i.categoriaPlanilha === 'BLOQUEADO').map(i => i.prefixo), c.removeBlocked);
      for (const i of items) {
        const existing = folha.itens.find(r => `c4-ci-${r.id}` === i.id);
        if (i.id.startsWith('c4-ci-') && !existing) throw new MvpError(409, 'ID pertence a outra folha.');
        if (existing && i.chaveItem && existing.chaveItem.toLowerCase() !== i.chaveItem.toLowerCase()) throw new MvpError(409, 'Identidade logica alterada.');
      }
      // Excluir somente itens explicitamente ausentes desta folha, apos validar intencao.
      for (const old of folha.itens) if (!items.some(i => i.id === `c4-ci-${old.id}`)) await tx.itemFolhaCI.delete({ where: { id: old.id } });
      for (const i of items) {
        const existing = folha.itens.find(r => `c4-ci-${r.id}` === i.id);
        const data = { ...itemData(i), responsavelRegistroId: userId };
        if (existing) {
          const before = itemData(itemSchema.parse(projectItem(existing, c.garagem, target)));
          if (JSON.stringify(before) !== JSON.stringify(itemData(i))) await tx.itemFolhaCI.update({ where: { id: existing.id }, data });
        }
        else await tx.itemFolhaCI.create({ data: { ...data, folhaId: folha.id, chaveItem: randomUUID() } });
      }
      for (const s of b.states) {
        const block = items.find(i => i.categoriaPlanilha === 'BLOQUEADO' && i.prefixo === s.prefixo);
        if (block && (!s.bloqueado || s.liberado || s.consorciada !== block.consorciada || (s.observacaoBloqueio ?? null) !== (block.motivo ?? null))) await tx.estadoManutencao.update({ where: { id: s.id }, data: { bloqueado: true, liberado: false, consorciada: company.parse(block.consorciada), observacaoBloqueio: block.motivo ?? null, responsavelRegistroId: userId } });
        else if (!block && s.bloqueado) await tx.estadoManutencao.update({ where: { id: s.id }, data: { bloqueado: false, observacaoBloqueio: null, responsavelRegistroId: userId } });
      }
      for (const i of items.filter(i => i.categoriaPlanilha === 'BLOQUEADO' && !b.states.some(s => s.prefixo === i.prefixo))) await tx.estadoManutencao.create({ data: { cicloId: cycle.id, prefixo: i.prefixo, consorciada: company.parse(i.consorciada), bloqueado: true, emExecucao: false, liberado: false, observacaoBloqueio: i.motivo ?? null, responsavelRegistroId: userId } });
      if (c.tituloColunaAdicional !== undefined && c.tituloColunaAdicional !== folha.tituloColunaAdicional) await tx.folhaCI.update({ where: { id: folha.id }, data: { tituloColunaAdicional: c.tituloColunaAdicional, responsavelRegistroId: userId } });
    } else {
      explicitRemovals(oldBlocks.map(i => i.prefixo), states.filter(s => s.bloqueado).map(s => s.prefixo), c.removeBlocked);
      if (!c.confirmRelease && states.some(s => s.liberado && oldBlocks.some(i => i.prefixo === s.prefixo))) throw new MvpError(409, 'Confirme a liberacao antes da gravacao.');
      for (const old of b.states.filter(s => s.bloqueado && s.emExecucao)) {
        const after = states.find(s => s.prefixo === old.prefixo);
        if ((!after || !after.bloqueado) && !after?.emExecucao && !(after?.liberado && c.confirmRelease)) throw new MvpError(409, 'Retirada de bloqueio preserva execucao; confirme liberacao para retirar ambas.');
      }
      for (const s of states) {
        const old = b.states.find(r => `c4-m-${r.id}` === s.id);
        if (s.id.startsWith('c4-m-') && !old) throw new MvpError(409, 'Estado pertence a outro ciclo.');
        if (old && old.prefixo !== s.prefixo) throw new MvpError(400, 'Prefixo do estado nao pode mudar.');
        const block = oldBlocks.find(i => i.prefixo === s.prefixo);
        const blockDate = s.bloqueado ? civil(s.dataBloqueio ?? (block?.dataBloqueio ? dateString(block.dataBloqueio) : day)) : null;
        if (blockDate && blockDate > day) throw new MvpError(400, 'Data de bloqueio futura.');
        const data = { prefixo: s.prefixo, consorciada: s.consorciada, bloqueado: s.bloqueado, emExecucao: s.emExecucao, liberado: s.liberado,
          observacaoBloqueio: s.bloqueado ? s.observacaoBloqueio !== undefined ? s.observacaoBloqueio : s.observacao ?? null : null,
          observacaoOficina: s.emExecucao || s.liberado ? s.observacaoOficina !== undefined ? s.observacaoOficina : s.observacao ?? null : null, responsavelRegistroId: userId };
        if (old) {
          if (Object.entries(data).some(([key, value]) => key !== 'responsavelRegistroId' && (old as unknown as Record<string, unknown>)[key] !== value)) await tx.estadoManutencao.update({ where: { id: old.id }, data });
        }
        else if (b.states.some(r => r.prefixo === s.prefixo)) throw new MvpError(409, 'Estado existente deve manter identidade.');
        else await tx.estadoManutencao.create({ data: { ...data, cicloId: cycle.id } });
        if (s.bloqueado) {
          const blockData = { consorciada: s.consorciada, motivo: data.observacaoBloqueio, dataBloqueio: dateValue(blockDate!), responsavelRegistroId: userId };
          if (block) {
            if (block.consorciada !== blockData.consorciada || block.motivo !== blockData.motivo || !block.dataBloqueio || dateString(block.dataBloqueio) !== blockDate) await tx.itemFolhaCI.update({ where: { id: block.id }, data: blockData });
          }
          else await tx.itemFolhaCI.create({ data: { ...blockData, folhaId: folha.id, chaveItem: randomUUID(), prefixo: s.prefixo, categoria: 'BLOQUEADO' } });
        } else if (block) await tx.itemFolhaCI.delete({ where: { id: block.id } });
      }
      for (const old of b.states.filter(r => !states.some(s => s.id === `c4-m-${r.id}`))) {
        await tx.estadoManutencao.delete({ where: { id: old.id } });
        const block = oldBlocks.find(i => i.prefixo === old.prefixo);
        if (block) await tx.itemFolhaCI.delete({ where: { id: block.id } });
      }
    }
    // Esperas/escritas tambem podem atravessar 20:00: rollback integral nesse caso.
    const result = await bundle(tx, c.garagem, day);
    assertC4Context(c.data, kind, now());
    return { records: result.states.map(s => projectState(s, day)), baseC4: result.baseC4 };
  }, { isolationLevel: 'Serializable' });
}

export async function startCycle(db: PrismaClient, scope: Garage, now = () => new Date()) {
  garage(scope);
  const instant = now(), day = operationalContext(instant).today;
  if (instant < eventInstant(day, 3)) return { result: 'NOT_DUE', garagem: scope, day };
  return db.$transaction(async tx => {
    await lock(tx, scope, day);
    const b = await bundle(tx, scope, day);
    if (b.cycle && b.folha && b.folha.cicloPreparacaoId === b.cycle.id) return { result: 'ALREADY_DONE', garagem: scope, day };
    if (b.cycle || b.folha) throw new MvpError(409, 'Estrutura C4 parcial; nao corrigir implicitamente.');
    const source = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: scope, dataFolha: dateValue(day) } }, include: { itens: { orderBy: { id: 'asc' } } } });
    const normal = source?.status === 'FINALIZADA';
    if (normal) validateItems(source!.itens.map(i => itemSchema.parse(projectItem(i, scope, day))), scope, day);
    const effective = now();
    if (operationalContext(effective).today !== day) throw new MvpError(409, 'Dia mudou durante inicializacao; reavalie evento atual.');
    const origem = normal ? 'NORMAL' : 'RECUPERACAO';
    const cycle = await tx.cicloOperacional.create({ data: { garagem: scope, dataOperacional: dateValue(day), origem, inicializacaoPrevistaEm: eventInstant(day, 3), inicializadoEm: effective } });
    const folha = await tx.folhaCI.create({ data: { garagem: scope, dataFolha: dateValue(addDays(day, 1)), status: 'EM_PREPARACAO', origem, cicloPreparacaoId: cycle.id,
      folhaOrigemId: normal ? source!.id : null, tituloColunaAdicional: normal ? source!.tituloColunaAdicional : null,
      inicializacaoPrevistaEm: eventInstant(day, 3), inicializadaEm: effective, finalizacaoPrevistaEm: eventInstant(day, C4_CLOSE_HOUR), referenciaOrigem: normal ? null : 'Sem fotografia finalizada do dia; recuperacao sem reconstruir historico.' } });
    if (normal) for (const item of source!.itens) {
      const { id: _id, folhaId: _folha, createdAt: _created, updatedAt: _updated, ...snapshot } = item;
      await tx.itemFolhaCI.create({ data: { ...snapshot, folhaId: folha.id } });
      if (item.categoria === 'BLOQUEADO') await tx.estadoManutencao.create({ data: { cicloId: cycle.id, prefixo: item.prefixo, consorciada: company.parse(item.consorciada), bloqueado: true, emExecucao: false, liberado: false, observacaoBloqueio: item.motivo } });
    }
    return { result: origem, garagem: scope, day };
  }, { isolationLevel: 'Serializable' });
}
export async function finalizeCycle(db: PrismaClient, scope: Garage, now = () => new Date()) {
  garage(scope);
  const instant = now(), day = operationalContext(instant).today;
  if (instant < eventInstant(day, C4_CLOSE_HOUR)) return { result: 'NOT_DUE', garagem: scope, day };
  return db.$transaction(async tx => {
    await lock(tx, scope, day);
    const b = await bundle(tx, scope, day);
    if (!b.folha || !b.cycle || b.folha.cicloPreparacaoId !== b.cycle.id) throw new MvpError(409, 'Ciclo atual ausente/ambiguo; finalizacao nao cria folha.');
    if (b.folha.status === 'FINALIZADA') return { result: 'ALREADY_DONE', garagem: scope, day };
    if (b.folha.status !== 'EM_PREPARACAO') throw new MvpError(409, 'Estado de folha invalido.');
    const effective = now();
    if (operationalContext(effective).today !== day || effective < eventInstant(day, C4_CLOSE_HOUR)) throw new MvpError(409, 'Evento fora do dia/horario de finalizacao.');
    await tx.folhaCI.update({ where: { id: b.folha.id }, data: { status: 'FINALIZADA', finalizadaEm: effective } });
    return { result: 'FINALIZADA', garagem: scope, day };
  }, { isolationLevel: 'Serializable' });
}
