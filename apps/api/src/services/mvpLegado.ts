import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { assertContext, assertFlags, isVCG, MvpError, revision } from './mvpTemporal';

const common = z.object({
  id: z.string().min(1).max(100), prefixo: z.string().regex(/^\d{1,10}$/),
  // Valor legado pode atravessar o snapshot somente quando comprovadamente preservado.
  consorciada: z.string().max(10),
});
const maintenance = common.extend({
  observacao: z.string().max(255), bloqueado: z.boolean(), emExecucao: z.boolean(), liberado: z.boolean(),
  data: z.string(),
});
const ci = common.extend({
  garagem: z.literal('VCG'), data: z.string(),
  categoriaPlanilha: z.enum(['BLOQUEADO', 'OFICINA', 'PREVENTIVA', 'REFORCO']),
  motivo: z.string().max(255), status: z.enum(['BLOQUEADO', 'EM_MANUTENCAO', 'AGUARDANDO_PECA', 'TESTE_PISTA', 'LIBERADO']).nullish(),
  gravidade: z.enum(['ALTA', 'MEDIA', 'BAIXA']).nullish(),
  dataLiberacao: z.string().max(50).nullish(), motivoLiberacao: z.string().max(255).nullish(), responsavelLiberacao: z.string().max(100).nullish(),
  setorOficina: z.string().max(50).nullish(), tipoPreventiva: z.string().max(50).nullish(),
  horarioReforco: z.string().max(20).nullish(), hora: z.string().max(10).nullish(),
  responsavel: z.string().max(100).nullish(), os: z.string().max(255).nullish(),
});

async function context(tx: Prisma.TransactionClient, userId: number | undefined, date: unknown, kind: 'ci' | 'manutencao', now: Date) {
  const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true } }) : null;
  if (user?.role !== 'ADMIN') throw new MvpError(403, 'MVP VCG requer ADMIN.');
  return assertContext(date, kind, now);
}
function verifyBase(base: unknown, records: { id: string; updatedAt: Date }[]) {
  if (typeof base !== 'string' || base !== revision(records)) throw new MvpError(409, 'Lista desatualizada. Recarregue antes de alterar.');
}
function verifyItems(items: { id: string; prefixo: string; data: string }[], date: string) {
  if (new Set(items.map(i => i.id)).size !== items.length) throw new MvpError(400, 'IDs duplicados.');
  if (items.some(i => i.data !== date || !isVCG(i.prefixo))) throw new MvpError(400, 'Item fora da data/garagem VCG.');
}
function verifyExistingVCG(records: { prefixo: string; garagem?: string }[]) {
  if (records.some(r => !/^\d{1,10}$/.test(r.prefixo) || !isVCG(r.prefixo) || (r.garagem !== undefined && r.garagem !== 'VCG'))) {
    throw new MvpError(409, 'Registro existente fora da VCG ou inconsistente. Revisao administrativa necessaria.');
  }
}
function validConsortium(value: string) { return ['VCG', 'VSF', 'JTU'].includes(value); }
function unchanged(existing: { updatedAt: Date }, received: object) {
  return revision([existing]) === revision([{ ...received, updatedAt: existing.updatedAt }]);
}
function verifySnapshotConsortium(current: { id: string; consorciada: string; updatedAt: Date }[], items: { id: string; consorciada: string }[]) {
  for (const row of current.filter(r => !validConsortium(r.consorciada))) {
    const received = items.find(i => i.id === row.id);
    if (!received || !unchanged(row, received)) throw new MvpError(409, 'Registro legado inconsistente deve permanecer inalterado; revisao administrativa necessaria.');
  }
  for (const i of items) {
    const existing = current.find(r => r.id === i.id);
    if ((!existing || !unchanged(existing, i)) && !validConsortium(i.consorciada)) throw new MvpError(400, 'Consorciada invalida para mutacao.');
  }
}
function verifyAffectedConsortium(records: { prefixo: string; consorciada: string }[], prefixes: string[]) {
  if (records.some(r => prefixes.includes(r.prefixo) && !validConsortium(r.consorciada))) throw new MvpError(409, 'Operacao afetaria registro legado inconsistente; revisao administrativa necessaria.');
}
const removals = z.array(z.string().regex(/^\d{1,10}$/)).max(1000).default([]);
function verifyUniqueBlocks(prefixes: string[]) {
  if (new Set(prefixes).size !== prefixes.length) throw new MvpError(409, 'BLOQUEADOS existentes duplicados; revisao administrativa necessaria.');
}
function verifyRemovals(requested: string[], before: string[], after: string[]) {
  if (new Set(requested).size !== requested.length || requested.some(p => !isVCG(p) || !before.includes(p) || after.includes(p))) {
    throw new MvpError(409, 'Retirada explicita invalida ou bloqueio desatualizado.');
  }
  if (before.some(p => !after.includes(p) && !requested.includes(p))) {
    throw new MvpError(409, 'Ausencia no snapshot nao autoriza retirada de BLOQUEADO.');
  }
}
async function verifyIds(tx: Prisma.TransactionClient, kind: 'ci' | 'manutencao', ids: string[], current: { id: string }[]) {
  const known = new Set(current.map(r => r.id));
  const foreign = ids.filter(id => !known.has(id));
  if (!foreign.length) return;
  const records = kind === 'ci'
    ? await tx.ciBloqueio.findMany({ where: { id: { in: foreign } }, select: { id: true } })
    : await tx.manutencaoCarro.findMany({ where: { id: { in: foreign } }, select: { id: true } });
  if (records.length) throw new MvpError(409, 'ID pertence a outro contexto; origem nao pode ser alterada.');
}
export async function saveMaintenance(db: PrismaClient, userId: number | undefined, body: unknown, clock = () => new Date()) {
  const input = z.object({ data: z.string(), items: z.array(maintenance).max(1000), base: z.string(), removeBlocked: removals, confirmRelease: z.boolean().default(false) }).parse(body);
  return db.$transaction(async tx => {
    const ctx = await context(tx, userId, input.data, 'manutencao', clock());
    verifyItems(input.items, input.data);
    assertFlags(input.items);
    const all = await tx.manutencaoCarro.findMany({ where: { data: ctx.today } });
    const current = all.filter(r => isVCG(r.prefixo));
    verifyExistingVCG(current);
    verifyUniqueBlocks(current.filter(r => r.bloqueado).map(r => r.prefixo));
    verifyBase(input.base, current);
    verifySnapshotConsortium(current, input.items);
    await verifyIds(tx, 'manutencao', input.items.map(i => i.id), current);
    const cis = await tx.ciBloqueio.findMany({ where: { dataBloqueio: ctx.tomorrow, garagem: 'VCG', categoria: 'BLOQUEADO', OR: [{ status: { not: 'LIBERADO' } }, { status: null }] } });
    verifyExistingVCG(cis);
    verifyUniqueBlocks(cis.map(r => r.prefixo));
    const blocked = input.items.filter(i => i.bloqueado);
    const changedBlocked = blocked.filter(i => !current.some(r => r.prefixo === i.prefixo && r.bloqueado && r.observacao === i.observacao && r.consorciada === i.consorciada));
    verifyAffectedConsortium(cis, [...input.removeBlocked, ...changedBlocked.map(i => i.prefixo)]);
    const before = current.filter(r => r.bloqueado).map(r => r.prefixo);
    // CI exclusiva nao mencionada continua intacta. Remocao exige intencao nominal.
    verifyRemovals(input.removeBlocked, before, blocked.map(i => i.prefixo));
    for (const p of input.removeBlocked) {
      if (current.some(r => r.prefixo === p && r.emExecucao) && !input.items.some(i => i.prefixo === p && i.emExecucao) && !(input.confirmRelease && input.items.some(i => i.prefixo === p && i.liberado))) {
        throw new MvpError(409, 'Retirar somente bloqueio deve preservar Em manutencao.');
      }
    }
    if (blocked.some(i => cis.filter(c => c.prefixo === i.prefixo).length > 1)) throw new MvpError(409, 'CI possui BLOQUEADOS duplicados; revisao administrativa necessaria.');
    const blockedBefore = new Set([...current.filter(r => r.bloqueado).map(r => r.prefixo), ...cis.map(r => r.prefixo)]);
    if (!input.confirmRelease && input.items.some(i => i.liberado && blockedBefore.has(i.prefixo))) {
      throw new MvpError(409, 'Confirme a liberacao do veiculo bloqueado antes de qualquer alteracao.');
    }
    // Todas as exclusoes sao por IDs ja validados na data D, nunca por prefixo global.
    await tx.manutencaoCarro.deleteMany({ where: { data: ctx.today, id: { in: current.filter(r => !input.items.some(i => i.id === r.id)).map(r => r.id) } } });
    for (const i of input.items) {
      const existing = current.find(r => r.id === i.id);
      if (existing && revision([existing]) === revision([{ ...i, updatedAt: existing.updatedAt }])) continue;
      const { id, ...data } = i;
      await tx.manutencaoCarro.upsert({ where: { id }, create: { id, ...data, userId }, update: { ...data, userId } });
    }
    for (const old of cis) {
      if (input.removeBlocked.includes(old.prefixo)) await tx.ciBloqueio.deleteMany({ where: { id: old.id, dataBloqueio: ctx.tomorrow, garagem: 'VCG', categoria: 'BLOQUEADO' } });
    }
    for (const i of changedBlocked) {
      const matches = cis.filter(c => c.prefixo === i.prefixo);
      if (matches.length > 1) throw new MvpError(409, 'CI possui BLOQUEADOS duplicados; revisao administrativa necessaria.');
      const id = matches[0]?.id || `ci-${randomUUID()}`;
      const data = { prefixo: i.prefixo, garagem: 'VCG', consorciada: i.consorciada, categoria: 'BLOQUEADO', motivo: i.observacao, dataBloqueio: ctx.tomorrow, status: 'BLOQUEADO', userId };
      await tx.ciBloqueio.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    // Revalida apos locks e imediatamente antes de devolver ao commit.
    const records = await tx.manutencaoCarro.findMany({ where: { data: ctx.today }, orderBy: { prefixo: 'asc' } });
    assertContext(input.data, 'manutencao', clock());
    return { records };
  }, { isolationLevel: 'Serializable' });
}
export async function saveCI(db: PrismaClient, userId: number | undefined, body: unknown, clock = () => new Date()) {
  const input = z.object({ data: z.string(), items: z.array(ci).max(1000), base: z.string(), removeBlocked: removals, operation: z.enum(['save', 'prepare']).default('save') }).parse(body);
  return db.$transaction(async tx => {
    const ctx = await context(tx, userId, input.data, 'ci', clock());
    verifyItems(input.items, input.data);
    const blocked = input.items.filter(i => i.categoriaPlanilha === 'BLOQUEADO' && i.status !== 'LIBERADO');
    if (new Set(blocked.map(i => i.prefixo)).size !== blocked.length) throw new MvpError(409, 'Segundo BLOQUEADO para o mesmo prefixo/CI nao permitido.');
    const current = await tx.ciBloqueio.findMany({ where: { garagem: 'VCG', dataBloqueio: ctx.tomorrow } });
    verifyExistingVCG(current);
    verifyUniqueBlocks(current.filter(c => c.categoria === 'BLOQUEADO' && c.status !== 'LIBERADO').map(c => c.prefixo));
    verifyBase(input.base, current);
    // Legado nao prova primeira preparacao: nunca copiar uma folha vazia.
    // Preparacao existente pode apenas ser validada, sem reconciliar o Controle.
    if (input.operation === 'prepare') {
      if (!current.length) throw new MvpError(409, 'CI vazia: primeira preparacao e esvaziamento sao indistinguiveis. Copia automatica indisponivel no MVP; use inclusoes explicitas.');
      if (input.items.length || input.removeBlocked.length) throw new MvpError(400, 'Preparacao conservadora nao aceita alteracoes.');
      assertContext(input.data, 'ci', clock());
      return { success: true, unchanged: true };
    }
    const before = new Set(current.filter(c => c.categoria === 'BLOQUEADO' && c.status !== 'LIBERADO').map(c => c.prefixo));
    verifySnapshotConsortium(current, input.items);
    verifyRemovals(input.removeBlocked, [...before], blocked.map(i => i.prefixo));
    await verifyIds(tx, 'ci', input.items.map(i => i.id), current);
    const ms = (await tx.manutencaoCarro.findMany({ where: { data: ctx.today } })).filter(m => isVCG(m.prefixo));
    verifyExistingVCG(ms);
    const changed = blocked.filter(b => !current.some(c => c.prefixo === b.prefixo && c.categoria === 'BLOQUEADO' && c.status !== 'LIBERADO' && (c.motivo || '') === b.motivo && c.consorciada === b.consorciada));
    verifyAffectedConsortium(ms, [...input.removeBlocked, ...changed.map(i => i.prefixo)]);
    if (blocked.some(b => ms.filter(m => m.prefixo === b.prefixo && m.bloqueado).length > 1)) throw new MvpError(409, 'Controle possui bloqueios duplicados; revisao necessaria.');
    await tx.ciBloqueio.deleteMany({ where: { garagem: 'VCG', dataBloqueio: ctx.tomorrow, id: { in: current.filter(r => !input.items.some(i => i.id === r.id)).map(r => r.id) } } });
    for (const i of input.items) {
      const existing = current.find(r => r.id === i.id);
      if (existing && revision([existing]) === revision([{ ...i, updatedAt: existing.updatedAt }])) continue;
      const data = { prefixo: i.prefixo, garagem: 'VCG', consorciada: i.consorciada, categoria: i.categoriaPlanilha,
        subTipo: i.setorOficina || i.tipoPreventiva || null, horarioReforco: i.horarioReforco || null,
        motivo: i.motivo, dataBloqueio: ctx.tomorrow, horaBloqueio: i.hora || null,
        responsavel: i.responsavel || null, observacoes: i.os || null, status: i.status || 'BLOQUEADO', gravidade: i.gravidade || 'ALTA',
        dataLiberacao: i.dataLiberacao || null, motivoLiberacao: i.motivoLiberacao || null, responsavelLiberacao: i.responsavelLiberacao || null, userId };
      await tx.ciBloqueio.upsert({ where: { id: i.id }, create: { id: i.id, ...data }, update: data });
    }
    for (const prefixo of new Set([...input.removeBlocked, ...changed.map(i => i.prefixo)])) {
      const b = blocked.find(i => i.prefixo === prefixo);
      const rows = ms.filter(m => m.prefixo === prefixo);
      if (!b && input.removeBlocked.includes(prefixo)) {
        for (const row of rows.filter(r => r.bloqueado)) {
          if (row.emExecucao || row.liberado) await tx.manutencaoCarro.update({ where: { id: row.id }, data: { bloqueado: false } });
          else await tx.manutencaoCarro.deleteMany({ where: { id: row.id, data: ctx.today } });
        }
      } else if (b) {
        if (rows.filter(r => r.bloqueado).length > 1) throw new MvpError(409, 'Controle possui bloqueios duplicados; revisao necessaria.');
        // Nova inclusao bloqueia novamente: remove Liberado, preserva execucao.
        for (const row of rows.filter(r => r.liberado)) await tx.manutencaoCarro.deleteMany({ where: { id: row.id, data: ctx.today } });
        const existing = rows.find(r => r.bloqueado);
        const id = existing?.id || `manut-${randomUUID()}`;
        const data = { prefixo, consorciada: b.consorciada, observacao: b.motivo, bloqueado: true, emExecucao: existing?.emExecucao || false, liberado: false, data: ctx.today, userId };
        await tx.manutencaoCarro.upsert({ where: { id }, create: { id, ...data }, update: data });
      }
    }
    assertContext(input.data, 'ci', clock());
    return { success: true };
  }, { isolationLevel: 'Serializable' });
}
