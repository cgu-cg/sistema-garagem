import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { escalaContextSchema } from './escalaCarros';
import escalaFixa from '../data/escalaFixa.json';
import { assertC4Read } from './c4Authorization';
import { MvpError } from './mvpTemporal';
import { canWriteDailyScale } from './operationalAccess';
import { addDays, dateValue } from './c4Temporal';
import { lockC4Context } from './c4Flow';
import { allocationCardsSchema, defaultAllocations, allocationProjection, occupations, officialGarageFleet, validateAllocation, type AllocationCard } from './escalaAllocation';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
  const d = new Date(s + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, 'Data invalida.');
export function parseDailyContext(value: unknown) {
  const raw = z.object({ garagem: z.unknown(), escalaTipo: z.unknown(), turno: z.unknown(), dataOperacao: date }).strict().parse(value);
  const { dataOperacao, ...base } = raw;
  return { ...escalaContextSchema.parse(base), dataOperacao };
}
const itemsSchema = z.array(z.object({ id: z.string().min(1).max(100), carroSubstituido: z.string().regex(/^\d{1,10}$/) }).strict()).max(2000)
  .refine(items => new Set(items.map(i => i.id)).size === items.length, 'Viagens duplicadas.');
const header = { contexto: z.unknown(), revisao: z.number().int().nonnegative().max(2147483646) };
const prefix = z.string().trim().regex(/^(\d{1,10})?$/);
const commandSchema = z.union([
  z.object({ ...header, id: z.string().min(1).max(100), carroSubstituido: prefix, base: z.string().min(1) }).strict(),
  z.object({ ...header, card: z.string().min(1).max(100), operacao: z.enum(['adicionar', 'remover', 'definir']),
    prefixo: prefix, itemId: z.string().max(100).optional(), linha: z.string().trim().min(1).max(100).optional(),
    tabela: z.string().trim().min(1).max(100).optional() }).strict(),
]);
const confirmationsSchema = z.array(z.object({ id: z.string().min(1).max(100), prefixo: z.string().regex(/^\d{1,10}$/) }).strict()).max(2000)
  .refine(values => new Set(values.map(v => v.id)).size === values.length, 'Confirmacoes duplicadas.');
const savedSchema = z.object({ version: z.literal(2), itens: itemsSchema, cards: allocationCardsSchema, confirmacoes: confirmationsSchema.default([]) }).strict();
export function fixedSchedule(contexto: ReturnType<typeof parseDailyContext>) {
  return escalaFixa[(contexto.garagem + '_' + contexto.escalaTipo + '_' + contexto.turno) as keyof typeof escalaFixa];
}
function selector(contexto: ReturnType<typeof parseDailyContext>) { return { garagem_escalaTipo_turno_dataOperacao: contexto }; }
function stored(conteudo: string | undefined, contexto: ReturnType<typeof parseDailyContext>) {
  const parsed: unknown = conteudo === undefined ? [] : JSON.parse(conteudo);
  const value = Array.isArray(parsed) ? { itens: itemsSchema.parse(parsed), cards: null, confirmacoes: [] } : savedSchema.parse(parsed);
  const ids = new Set(fixedSchedule(contexto).map(i => i.id));
  if (value.itens.some(i => !ids.has(i.id)) || value.confirmacoes.some(i => !ids.has(i.id))) throw new MvpError(409, 'Substituicoes fora da programacao fixa. Revisar sem descartar historico.');
  return value;
}
export type FleetLoader = () => Promise<{ source: string; data: unknown }>;
const officialFleet: FleetLoader = async () => (await import('./mssql')).queryVeiculosSelect();
async function ciBlocks(tx: Pick<PrismaClient, 'folhaCI'>, contexto: ReturnType<typeof parseDailyContext>, frota: string[]) {
  const ciData = addDays(contexto.dataOperacao, 1);
  const folha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: contexto.garagem, dataFolha: dateValue(ciData) } }, include: { itens: true } });
  if (!folha) throw new MvpError(503, 'CI de ' + ciData + ' ausente. Nao foi possivel confirmar os bloqueios.');
  const blocks = folha.itens.filter(i => i.categoria === 'BLOQUEADO' && i.statusItem !== 'LIBERADO');
  if (blocks.some(i => !/^\d{1,10}$/.test(i.prefixo))) throw new MvpError(503, 'CI com bloqueado invalido. Alocacoes bloqueadas.');
  return { ciData, bloqueados: [...new Set(blocks.map(i => i.prefixo))].filter(p => frota.includes(p)) };
}
function project(contexto: ReturnType<typeof parseDailyContext>, revisao: number, itens: z.infer<typeof itemsSchema>, cards: AllocationCard[],
  frota: string[], source: { ciData: string; bloqueados: string[] }, cardsOrigem: 'padrao' | 'salvo', omitidosPadrao: number,
  confirmacoes: z.infer<typeof confirmationsSchema>) {
  const allocation = allocationProjection(fixedSchedule(contexto), itens, cards, frota, source.bloqueados);
  const blocked = [...source.bloqueados, ...(cards.find(c => c.id === 'PORTARIA')?.itens.map(i => i.prefixo) ?? [])];
  const replacements = new Map(itens.map(i => [i.id, i.carroSubstituido]));
  const confirmadas = confirmacoes.filter(c => {
    const fixed = fixedSchedule(contexto).find(i => i.id === c.id);
    return fixed && c.prefixo === (replacements.get(c.id) ?? fixed.carroProgramado) && frota.includes(c.prefixo)
      && !blocked.includes(c.prefixo) && !allocation.ocupacoes.some(o => o.prefixo === c.prefixo && o.chave !== 'linha:' + c.id);
  }).map(c => c.id);
  return { contexto, revisao, itens, cards, ciData: source.ciData, cardsOrigem, omitidosPadrao,
    confirmadas, ...allocation };
}
export async function readEscalaDiaria(db: PrismaClient, value: unknown, userId: number | undefined, loadFleet: FleetLoader = officialFleet) {
  const contexto = parseDailyContext(value);
  await assertC4Read(db, userId, contexto.garagem);
  const frota = officialGarageFleet(await loadFleet(), contexto.garagem);
  return db.$transaction(async tx => {
    const source = await ciBlocks(tx, contexto, frota);
    const record = await tx.escalaDiaria.findUnique({ where: selector(contexto) });
    const state = stored(record?.conteudo, contexto);
    const defaults = defaultAllocations(contexto.garagem, frota, source.bloqueados, fixedSchedule(contexto), state.itens);
    return project(contexto, record?.revisao ?? 0, state.itens, state.cards ?? defaults.cards, frota, source,
      state.cards ? 'salvo' : 'padrao', state.cards ? 0 : defaults.omitted, state.confirmacoes);
  }, { isolationLevel: 'Serializable' });
}
export async function saveEscalaDiaria(db: PrismaClient, userId: number | undefined, value: unknown, loadFleet: FleetLoader = officialFleet) {
  const c = commandSchema.parse(value), contexto = parseDailyContext(c.contexto);
  const userBefore = userId ? await db.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
  if (!canWriteDailyScale(userBefore, contexto.garagem)) throw new MvpError(403, 'Edicao exige ADMIN ou Soltura da propria garagem.');
  const frota = officialGarageFleet(await loadFleet(), contexto.garagem), fixed = fixedSchedule(contexto);
  return db.$transaction(async tx => {
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
    if (!canWriteDailyScale(user, contexto.garagem)) throw new MvpError(403, 'Permissao de edicao revogada.');
    // Mesmo protocolo dos escritores C4: ciclo D/folha D+1, depois escala diaria.
    await lockC4Context(tx, contexto.garagem, contexto.dataOperacao);
    const { garagem, escalaTipo, turno, dataOperacao } = contexto;
    await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${garagem} AND escala_tipo=${escalaTipo} AND turno=${turno} AND data_operacao=${dataOperacao}`;
    const old = await tx.escalaDiaria.findUnique({ where: selector(contexto) });
    if ((old?.revisao ?? 0) !== c.revisao) throw new MvpError(409, 'Escala do dia alterada em outro posto. Recarregue e revise antes de salvar.');
    const source = await ciBlocks(tx, contexto, frota), state = stored(old?.conteudo, contexto);
    const itens = state.itens;
    let confirmacoes = state.confirmacoes;
    const cards = state.cards ?? defaultAllocations(garagem, frota, source.bloqueados, fixed, itens).cards;
    const used = occupations(fixed, itens, cards);
    const portaria = cards.find(card => card.id === 'PORTARIA')?.itens.map(i => i.prefixo).filter(Boolean) ?? [];
    if ('id' in c) {
      const original = fixed.find(i => i.id === c.id);
      if (!original || c.base !== JSON.stringify(original)) throw new MvpError(409, 'Programacao fixa diferente da versao do servidor. Atualize a pagina e revise.');
      const effective = c.carroSubstituido || original.carroProgramado;
      validateAllocation(effective, 'linha:' + c.id, frota, [...source.bloqueados, ...portaria], used);
      confirmacoes = [...confirmacoes.filter(i => i.id !== c.id), { id: c.id, prefixo: effective }];
      const index = itens.findIndex(i => i.id === c.id);
      if (!c.carroSubstituido || c.carroSubstituido === original.carroProgramado) { if (index >= 0) itens.splice(index, 1); }
      else { const next = { id: c.id, carroSubstituido: c.carroSubstituido }; if (index < 0) itens.push(next); else itens[index] = next; }
    } else {
      const card = cards.find(card => card.id === c.card);
      if (!card) throw new MvpError(400, 'Card desconhecido.');
      const item = card.itens.find(i => i.id === c.itemId);
      if (c.operacao === 'remover') {
        if (!item) throw new MvpError(409, 'Posicao ja removida. Recarregue.');
        if (card.modo === 'lista') card.itens = card.itens.filter(i => i.id !== item.id);
        else item.prefixo = '';
      } else {
        if (c.operacao === 'definir' && !item) throw new MvpError(409, 'Posicao inexistente.');
        if (c.prefixo) validateAllocation(c.prefixo, item ? 'card:' + card.id + ':' + item.id : '', frota,
          [...source.bloqueados, ...portaria.filter(p => !(card.id === 'PORTARIA' && item?.prefixo === p))], used);
        if (c.operacao === 'definir' && item) item.prefixo = c.prefixo;
        else if (card.modo === 'lista' && c.prefixo) card.itens.push({ id: randomUUID(), prefixo: c.prefixo });
        else if (card.modo === 'rabicho' && c.linha && c.tabela) card.itens.push({ id: randomUUID(), prefixo: c.prefixo, linha: c.linha, tabela: c.tabela });
        else throw new MvpError(400, 'Informe os dados da posicao.');
      }
    }
    const payload = savedSchema.parse({ version: 2, itens, cards, confirmacoes });
    const data = { revisao: c.revisao + 1, conteudo: JSON.stringify(payload), responsavelId: userId! };
    if (old) await tx.escalaDiaria.update({ where: { id: old.id }, data });
    else await tx.escalaDiaria.create({ data: { ...contexto, ...data } });
    return project(contexto, data.revisao, itens, cards, frota, source, 'salvo', 0, confirmacoes);
  }, { isolationLevel: 'Serializable' });
}
