import type { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { civil, dateValue, dateString } from './c4Temporal';
import { MvpError, operationalContext } from './mvpTemporal';
import { officialFleet } from './escalaDiaria';
import { officialGarageFleet } from './escalaAllocation';
import { canWriteC4, assertC4Read } from './c4Authorization';

const contextSchema = z.object({ garagem: z.enum(['VCG', 'VCM']), data: z.string() });
export const maintenanceRowSchema = z.object({
  id: z.string().min(1).max(100), prefixo: z.string().regex(/^\d{1,10}$/),
  consorciada: z.enum(['VCG', 'VCM', 'VSF', 'JTU']), data: z.string(),
  observacao: z.string().max(255).nullable(), observacaoBloqueio: z.string().max(255).nullish(),
  observacaoOficina: z.string().max(255).nullish(),
  bloqueado: z.boolean(), emExecucao: z.boolean(), liberado: z.boolean(),
});
const itemsSchema = z.array(maintenanceRowSchema).max(5000);
const sheetSchema = z.object({ version: z.literal(1), items: itemsSchema,
  eventos: z.array(z.object({ id: z.string().uuid(), hash: z.string(), usuarioId: z.number().int().positive(), registradoEm: z.string().datetime() })) });
const commandSchema = contextSchema.extend({ base: z.string().min(1), operacaoId: z.string().uuid(),
  items: itemsSchema, confirmRelease: z.boolean().default(false) });
type Tx = Prisma.TransactionClient;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const where = (garagem: string, dataOperacao: string) => ({ garagem_dataOperacao: { garagem, dataOperacao } });
export function rolloverMaintenance(items: z.infer<typeof itemsSchema>, day: string) {
  return items.filter(item => item.bloqueado).map(item => ({ ...item, id: `manut-${day}-${item.prefixo}`, data: day,
    bloqueado: true, emExecucao: false, liberado: false }));
}
export async function projectMaintenance(db: Pick<Tx, 'controleManutencaoFolha' | 'cicloOperacional' | 'estadoManutencao' | 'manutencaoCarro'>,
  garagem: 'VCG' | 'VCM', day: string, now: Date) {
  const saved = await db.controleManutencaoFolha.findUnique({ where: where(garagem, day) });
  if (saved) return { garagem, data: day, revisao: saved.revisao, base: String(saved.revisao),
    items: sheetSchema.parse(JSON.parse(saved.conteudo)).items, origem: 'PERSISTIDA' as const };
  // Historico ausente nao e reconstruido a partir do presente.
  const current = day === operationalContext(now).today;
  const previous = current ? await db.controleManutencaoFolha.findFirst({ where: { garagem, dataOperacao: { lt: day } }, orderBy: { dataOperacao: 'desc' } }) : null;
  if (previous) {
    const items = rolloverMaintenance(sheetSchema.parse(JSON.parse(previous.conteudo)).items, day);
    return { garagem, data: day, revisao: 0, base: `0:${hash([previous.dataOperacao, previous.revisao, items])}`, items, origem: 'VIRADA' as const };
  }
  if (current) return { garagem, data: day, revisao: 0, base: `0:${hash([])}`, items: [], origem: 'VAZIA' as const };
  // Compatibilidade de leitura com estados de oficina ja persistidos. Nunca consulta CI.
  const cycle = await db.cicloOperacional.findFirst({ where: { garagem, dataOperacional: dateValue(day) }, orderBy: { dataOperacional: 'desc' } });
  let items: z.infer<typeof itemsSchema> = [];
  if (cycle) {
    const states = await db.estadoManutencao.findMany({ where: { cicloId: cycle.id }, orderBy: { prefixo: 'asc' } });
    items = states.filter(s => s.bloqueado || s.emExecucao || s.liberado).map(s => ({ id: `c4-m-${s.id}`, prefixo: s.prefixo,
      consorciada: z.enum(['VCG', 'VCM', 'VSF', 'JTU']).parse(s.consorciada), data: dateString(cycle.dataOperacional),
      observacao: s.bloqueado ? s.observacaoBloqueio : s.observacaoOficina,
      observacaoBloqueio: s.observacaoBloqueio, observacaoOficina: s.observacaoOficina,
      bloqueado: s.bloqueado, emExecucao: s.emExecucao, liberado: s.liberado }));
  } else {
    const legacy = await db.manutencaoCarro.findMany({ where: { data: day }, orderBy: { prefixo: 'asc' } });
    items = legacy.filter(s => (s.prefixo.startsWith('1') || s.prefixo === '2002') === (garagem === 'VCM'))
      .map(s => maintenanceRowSchema.parse(s));
  }
  items = itemsSchema.parse(items);
  return { garagem, data: day, revisao: 0, base: `0:${hash(items)}`, items, origem: items.length ? 'LEGADO' as const : 'VAZIA' as const };
}
export async function readMaintenanceBoard(db: PrismaClient, userId: number | undefined, value: unknown, now = () => new Date()) {
  const c = contextSchema.parse(value); civil(c.data); await assertC4Read(db, userId, c.garagem);
  return db.$transaction(tx => projectMaintenance(tx, c.garagem, c.data, now()), { isolationLevel: 'Serializable' });
}
export async function saveMaintenanceBoard(db: PrismaClient, userId: number | undefined, value: unknown,
  now = () => new Date(), loadFleet = officialFleet) {
  const c = commandSchema.parse(value); civil(c.data);
  const checkDate = () => { const ctx = operationalContext(now(), 72000);
    if (c.data !== ctx.today || !ctx.open) throw new MvpError(409, 'Pendencia fora do dia/janela de manutencao (03:00 ate 20:00). Revise sem transportar para outra data.'); };
  checkDate();
  const fleet = officialGarageFleet(await loadFleet(), c.garagem);
  return db.$transaction(async tx => {
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
    if (!userId || !canWriteC4(user, c.garagem)) throw new MvpError(403, 'Controle exige ADMIN ou manutencao da propria garagem habilitada.');
    await tx.$queryRaw`SELECT id FROM dbo.controle_manutencao_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${c.garagem} AND data_operacao<=${c.data}`;
    checkDate();
    const old = await tx.controleManutencaoFolha.findUnique({ where: where(c.garagem, c.data) });
    const content = old ? sheetSchema.parse(JSON.parse(old.conteudo)) : { version: 1 as const, items: [], eventos: [] };
    const fingerprint = hash([c.items, c.confirmRelease]);
    const applied = content.eventos.find(e => e.id === c.operacaoId);
    if (applied) {
      if (applied.usuarioId !== userId || applied.hash !== fingerprint) throw new MvpError(409, 'Identificador de operacao ja usado com outro conteudo.');
      return projectMaintenance(tx, c.garagem, c.data, now());
    }
    const baseline = await projectMaintenance(tx, c.garagem, c.data, now());
    if (baseline.base !== c.base) throw new MvpError(409, 'Controle alterado em outro dispositivo. Pendencia preservada para revisao.');
    if (new Set(c.items.map(i => i.prefixo)).size !== c.items.length || new Set(c.items.map(i => i.id)).size !== c.items.length)
      throw new MvpError(400, 'Carro ou identificador duplicado no Controle.');
    for (const i of c.items) {
      if (i.data !== c.data || [i.bloqueado, i.emExecucao, i.liberado].filter(Boolean).length !== 1) throw new MvpError(400, 'Escolha somente um estado e a data do Controle.');
      if (!fleet.includes(i.prefixo)) throw new MvpError(400, 'Carro fora da frota oficial da garagem.');
      if (i.liberado && baseline.items.some(old => old.prefixo === i.prefixo && old.bloqueado) && !c.confirmRelease)
        throw new MvpError(409, 'Confirme a liberacao do carro bloqueado.');
    }
    if (content.eventos.length >= 10000) throw new MvpError(409, 'Limite de operacoes da folha atingido. Solicite revisao.');
    const data = { revisao: (old?.revisao ?? 0) + 1, responsavelId: userId,
      conteudo: JSON.stringify({ version: 1, items: c.items, eventos: [...content.eventos, { id: c.operacaoId, hash: fingerprint, usuarioId: userId, registradoEm: now().toISOString() }] }) };
    checkDate();
    if (old) await tx.controleManutencaoFolha.update({ where: { id: old.id }, data });
    else await tx.controleManutencaoFolha.create({ data: { garagem: c.garagem, dataOperacao: c.data, ...data } });
    checkDate();
    return { garagem: c.garagem, data: c.data, revisao: data.revisao, base: String(data.revisao), items: c.items, origem: 'PERSISTIDA' as const };
  }, { isolationLevel: 'Serializable' });
}
