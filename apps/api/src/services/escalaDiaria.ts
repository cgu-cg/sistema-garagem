import { ciUseSchema, ciUseCommandSchema, authorizeCiUse } from './ciUseConfirmation';
import legacyVcmWeekdays from '../data/escala-carros/vcm/seg-sex-legado.json';
import { lineClearAuditSchema } from './lineClearAudit';
import { dateProgramming } from './trafficProgramming';
import { trafficRowSchema, trafficRowsSchema } from './trafficSchema';
import { scaleLifecycleSchema, assertScaleDate, assertScaleOperation, type ScaleLifecycle } from './dailyScaleLifecycle';
import { scaleWithdrawalSchema, scaleExchangeSchema, registerScaleWithdrawal, treatScaleWithdrawal, returnFixedToSubstituted, undoFixedWithdrawal } from './scaleSubstitution';
import { projectScaleCiNotices, type ScaleCiNotice } from './scaleCiNotices';
import { notifyC4Updated } from './c4Events';
import { groupReserveColors, isColorReserveCard } from './scaleReserveColors';
import { readColorCache, vehicleColor, type FleetColorCache } from './fleetColors';
import path from 'node:path';
import type { PrismaClient, ItemFolhaCI } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { escalaContextSchema } from './escalaCarros';
import { currentScaleTemplate, retiredScaleRows } from '../data/scheduleTemplates';
import { assertC4Read } from './c4Authorization';
import { MvpError, operationalContext } from './mvpTemporal';
import { canWriteDailyScale } from './operationalAccess';
import { addDays, dateValue } from './c4Temporal';
import { lockManualCI } from './c4Flow';
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
const itemsSchema = z.array(z.object({ id: z.string().min(1).max(100), carroSubstituido: z.string().regex(/^(\d{1,10})?$/), suspensa: z.boolean().optional() }).strict()).max(2000)
  .refine(items => new Set(items.map(i => i.id)).size === items.length, 'Viagens duplicadas.');
const header = { contexto: z.unknown(), revisao: z.number().int().nonnegative().max(2147483646) };
const prefix = z.string().trim().regex(/^(\d{1,10})?$/);
const commandSchema = z.union([
  z.object({ ...header, operacao: z.enum(['limpar-linha', 'suspender-linha', 'reativar-linha', 'devolver-fixo']), id: z.string().min(1).max(100), base: z.string().min(1) }).strict(),
  z.object({ ...header, operacao: z.literal('tratar-substituido'), trocaId: z.string().uuid(), retirada: scaleWithdrawalSchema }).strict(),
  z.object({ ...header, operacao: z.enum(['iniciar', 'finalizar', 'reabrir']) }).strict(),
  z.object({ ...header, id: z.string().min(1).max(100), carroSubstituido: prefix, confirmarBloqueadoCI: ciUseCommandSchema, base: z.string().min(1), retirada: scaleWithdrawalSchema.optional() }).strict(),
  z.object({ ...header, card: z.string().min(1).max(100), operacao: z.enum(['adicionar', 'remover', 'definir']),
    prefixo: prefix, itemId: z.string().max(100).optional(), linha: z.string().trim().min(1).max(100).optional(),
    tabela: z.string().trim().min(1).max(100).optional() }).strict(),
]);
const confirmationsSchema = z.array(z.object({ id: z.string().min(1).max(100), prefixo: z.string().regex(/^\d{1,10}$/), usoBloqueadoCI: ciUseSchema.optional() }).strict()).max(2000)
  .refine(values => new Set(values.map(v => v.id)).size === values.length, 'Confirmacoes duplicadas.');
const savedSchema = z.object({ limpezas: z.array(lineClearAuditSchema).optional(), version: z.union([z.literal(2), z.literal(3)]), itens: itemsSchema, cards: allocationCardsSchema, confirmacoes: confirmationsSchema.default([]), historicoTrocas: z.array(scaleExchangeSchema).default([]), fluxo: scaleLifecycleSchema.optional(), programacao: trafficRowsSchema.optional() }).strict();
export function fixedSchedule(contexto: ReturnType<typeof parseDailyContext>) {
  return currentScaleTemplate(contexto);
}
function selector(contexto: ReturnType<typeof parseDailyContext>) { return { garagem_escalaTipo_turno_dataOperacao: contexto }; }
export function parseStoredDailyScale(conteudo: string | undefined, contexto: ReturnType<typeof parseDailyContext>) {
  const parsed: unknown = conteudo === undefined ? [] : JSON.parse(conteudo);
  const value = Array.isArray(parsed) ? { itens: itemsSchema.parse(parsed), cards: null, confirmacoes: [] } : savedSchema.parse(parsed);
  if ('version' in value && value.version === 3 && !value.fluxo) throw new MvpError(409, 'Estado da escala invalido.');
  if ('fluxo' in value && value.fluxo && value.fluxo.fonteCI.ciData !== contexto.dataOperacao) throw new MvpError(409, 'CI da escala pertence a outra data.');
  if (value.confirmacoes.some(c => c.usoBloqueadoCI && (c.usoBloqueadoCI.linhaId !== c.id || c.usoBloqueadoCI.prefixo !== c.prefixo || c.usoBloqueadoCI.ciData !== contexto.dataOperacao)))
    throw new MvpError(409, 'Confirmacao de uso da CI fora do contexto da linha.');
  const programacao = ('programacao' in value ? value.programacao : undefined)
    ?? (conteudo !== undefined && contexto.garagem === 'VCM' && contexto.escalaTipo === 'SEG_SEX'
      ? legacyVcmWeekdays.map(row => ({ ...row, status: 'PENDENTE' as const })) : undefined);
  const ids = new Set([...(programacao ?? fixedSchedule(contexto)), ...retiredScaleRows(contexto)].map(i => i.id));
  if (value.itens.some(i => !ids.has(i.id)) || value.confirmacoes.some(i => !ids.has(i.id))) throw new MvpError(409, 'Substituicoes fora da programacao fixa. Revisar sem descartar historico.');
  return { ...value, programacao, historicoTrocas: 'historicoTrocas' in value ? value.historicoTrocas : [], fluxo: 'fluxo' in value ? value.fluxo ?? null : null };
}
export type FleetLoader = () => Promise<{ source: string; data: unknown }>;
export type ColorLoader = () => Promise<FleetColorCache | null>;
export const loadColorCache: ColorLoader = async () => {
  try { return await readColorCache(process.env.FLEET_COLORS_CACHE_PATH || path.resolve(__dirname, '../../uploads/.fleet-colors/cache.json')); }
  catch { return null; }
};
export const officialFleet: FleetLoader = async () => (await import('./mssql')).queryVeiculosSelect();
async function ciBlocks(tx: Pick<PrismaClient, 'folhaCI'>, contexto: ReturnType<typeof parseDailyContext>, frota: string[], legacy = false) {
  const ciData = legacy ? addDays(contexto.dataOperacao, 1) : contexto.dataOperacao;
  const folha = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: contexto.garagem, dataFolha: dateValue(ciData) } }, include: { itens: true } });
  return projectCiBlocks(folha, ciData, frota, legacy);
}
function projectCiBlocks(folha: { status: string; itens: ItemFolhaCI[] } | null, ciData: string, frota: string[], legacy = false) {
  if (!folha && legacy) throw new MvpError(503, 'CI de ' + ciData + ' ausente. Nao foi possivel confirmar os bloqueios.');
  const blocks = (folha?.itens ?? []).filter(i => i.categoria === 'BLOQUEADO' && i.statusItem !== 'LIBERADO');
  if (blocks.some(i => !/^\d{1,10}$/.test(i.prefixo))) throw new MvpError(503, 'CI com bloqueado invalido. Alocacoes bloqueadas.');
  return { ciData, ciFinalizada: folha?.status === 'FINALIZADA', ciAvisos: projectScaleCiNotices(folha?.itens ?? [], frota), bloqueados: [...new Set(blocks.map(i => i.prefixo))].filter(p => frota.includes(p)) };
}
function project(contexto: ReturnType<typeof parseDailyContext>, revisao: number, itens: z.infer<typeof itemsSchema>, cards: AllocationCard[],
  frota: string[], source: { ciData: string; bloqueados: string[]; ciAvisos: ScaleCiNotice[] }, cardsOrigem: 'padrao' | 'salvo', omitidosPadrao: number,
  confirmacoes: z.infer<typeof confirmationsSchema>, colorCache: FleetColorCache | null, programacao = fixedSchedule(contexto)) {
  const allocation = allocationProjection(programacao, itens, cards, frota, source.bloqueados);
  const blocked = [...source.bloqueados, ...(cards.find(c => c.id === 'PORTARIA')?.itens.map(i => i.prefixo) ?? [])];
  const replacements = new Map(itens.map(i => [i.id, i.carroSubstituido]));
  const foraMolde = itens.flatMap(item => {
    const old = retiredScaleRows(contexto).find(row => row.id === item.id);
    return old ? [{ ...old, carroSubstituido: item.carroSubstituido }] : [];
  });
  const confirmadas = confirmacoes.filter(c => {
    const fixed = programacao.find(i => i.id === c.id);
    return fixed && c.prefixo === (replacements.get(c.id) ?? fixed.carroProgramado) && frota.includes(c.prefixo)
      && (!blocked.includes(c.prefixo) || Boolean(c.usoBloqueadoCI && source.bloqueados.includes(c.prefixo) && !cards.find(card => card.id === 'PORTARIA')?.itens.some(i => i.prefixo === c.prefixo))) && !allocation.ocupacoes.some(o => o.prefixo === c.prefixo && o.chave !== 'linha:' + c.id);
  }).map(c => c.id);
  return { contexto, revisao, itens, cards, programacao, ciData: source.ciData, ciAvisos: source.ciAvisos, cardsOrigem, omitidosPadrao,
    confirmadas, usosBloqueadosCI: confirmacoes.flatMap(c => c.usoBloqueadoCI ? [c.usoBloqueadoCI] : []), foraMolde, ...allocation, coresFrota: Object.fromEntries(frota.map(prefixo => [prefixo, vehicleColor(colorCache, prefixo)])),
    reservaPorCor: groupReserveColors(allocation.reserva, colorCache) };
}
function cleanCards(contexto: ReturnType<typeof parseDailyContext>, frota: string[], programacao = fixedSchedule(contexto)) {
  return defaultAllocations(contexto.garagem, frota, [], programacao, []).cards
    .map(card => ({ ...card, itens: card.modo === 'lista' ? [] : card.itens.map(item => ({ ...item, prefixo: '' })) }));
}
async function nextScaleStarted(tx: Pick<PrismaClient, 'escalaDiaria'>, contexto: ReturnType<typeof parseDailyContext>) {
  return Boolean(await tx.escalaDiaria.findFirst({ where: { garagem: contexto.garagem, dataOperacao: addDays(contexto.dataOperacao, 1) }, select: { id: true } }));
}
function flowView(lifecycle: ScaleLifecycle | null, exists: boolean, ciFinalizada: boolean, proximaIniciada: boolean) {
  return { status: lifecycle?.status ?? (exists ? 'LEGADO' as const : 'NAO_INICIADA' as const), ciFinalizada, proximaIniciada,
    iniciadaEm: lifecycle?.iniciadaEm ?? null, finalizadaEm: lifecycle?.finalizadaEm ?? null };
}
export async function readEscalaDiaria(db: PrismaClient, value: unknown, userId: number | undefined, loadFleet: FleetLoader = officialFleet, loadColors: ColorLoader = loadColorCache) {
  const contexto = parseDailyContext(value);
  await assertC4Read(db, userId, contexto.garagem);
  const frota = officialGarageFleet(await loadFleet(), contexto.garagem), colorCache = await loadColors();
  // A dica e somente para ordenar leituras CI da mais antiga para a mais nova.
  // O registro oficial e relido dentro da transacao; nunca se projeta a dica.
  const hint = await db.escalaDiaria.findUnique({ where: selector(contexto) });
  const hintState = parseStoredDailyScale(hint?.conteudo, contexto);
  const mayNeedPrevious = !hint || Boolean(hintState.fluxo && hintState.fluxo.status !== 'FINALIZADA');
  return db.$transaction(async tx => {
    const previous = mayNeedPrevious ? await tx.folhaCI.findFirst({ where: { garagem: contexto.garagem, status: 'FINALIZADA',
      dataFolha: { lt: dateValue(contexto.dataOperacao) } }, orderBy: { dataFolha: 'desc' }, include: { itens: true } }) : null;
    // Mesma ordem de leitura dos escritores novos: primeiro CI, depois escala.
    const currentCI = await tx.folhaCI.findUnique({ where: { garagem_dataFolha: { garagem: contexto.garagem, dataFolha: dateValue(contexto.dataOperacao) } }, include: { itens: true } });
    const record = await tx.escalaDiaria.findUnique({ where: selector(contexto) });
    const state = parseStoredDailyScale(record?.conteudo, contexto), legacy = Boolean(record && !state.fluxo);
    const live = legacy ? await ciBlocks(tx, contexto, frota, true) : projectCiBlocks(currentCI, contexto.dataOperacao, frota);
    let source = state.fluxo?.status === 'FINALIZADA' ? state.fluxo.fonteCI : live;
    let ciProvisoria = false;
    if (!legacy && !currentCI && state.fluxo?.status !== 'FINALIZADA') {
      if (!previous) throw new MvpError(503, 'CI da data ausente e nenhuma CI anterior finalizada encontrada. Nao foi possivel confirmar os bloqueios.');
      source = { ...projectCiBlocks(previous, previous.dataFolha.toISOString().slice(0, 10), frota), ciAvisos: [] };
      ciProvisoria = true;
    }
    const programacao = state.programacao ?? (record ? fixedSchedule(contexto) : await dateProgramming(tx, 'ESCALA', contexto));
    const defaults = defaultAllocations(contexto.garagem, frota, source.bloqueados, programacao, state.itens);
    return { ...project(contexto, record?.revisao ?? 0, state.itens, state.cards ?? (legacy ? defaults.cards : cleanCards(contexto, frota, programacao)), frota, source,
      state.cards ? 'salvo' : 'padrao', legacy && !state.cards ? defaults.omitted : 0, state.confirmacoes, colorCache, programacao),
      historicoTrocas: state.historicoTrocas, ciProvisoria, fluxo: flowView(state.fluxo, Boolean(record), live.ciFinalizada, await nextScaleStarted(tx, contexto)) };
  }, { isolationLevel: 'Serializable' });
}
export async function saveEscalaDiaria(db: PrismaClient, userId: number | undefined, value: unknown, loadFleet: FleetLoader = officialFleet, loadColors: ColorLoader = loadColorCache, clock = () => new Date()) {
  const c = commandSchema.parse(value), contexto = parseDailyContext(c.contexto);
  const treating = 'operacao' in c && c.operacao === 'tratar-substituido';
  const operation = 'operacao' in c && !('card' in c) && c.operacao !== 'tratar-substituido' && c.operacao !== 'limpar-linha' && c.operacao !== 'suspender-linha' && c.operacao !== 'reativar-linha' && c.operacao !== 'devolver-fixo' ? c.operacao : 'editar';
  const assertDate = () => {
    if (treating) {
      if (contexto.dataOperacao < operationalContext(clock()).today) throw new MvpError(409, 'Tratamento de datas anteriores permite somente consulta.');
    } else assertScaleDate(contexto.dataOperacao, operation, clock());
  };
  assertDate();
  const userBefore = userId ? await db.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
  if (!canWriteDailyScale(userBefore, contexto.garagem)) throw new MvpError(403, 'Edicao exige ADMIN ou Soltura da propria garagem.');
  const frota = officialGarageFleet(await loadFleet(), contexto.garagem);
  const colorCache = await loadColors();
  const result = await db.$transaction(async tx => {
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
    if (!canWriteDailyScale(user, contexto.garagem)) throw new MvpError(403, 'Permissao de edicao revogada.');
    // Mesmo protocolo dos escritores CI: locks ordenados da folha D, depois escalas.
    await lockManualCI(tx, contexto.garagem, contexto.dataOperacao);
    // Locks por garagem/data abrangem todos os tipos e serializam iniciar D+1 contra reabrir D.
    for (const day of [addDays(contexto.dataOperacao, -1), contexto.dataOperacao, addDays(contexto.dataOperacao, 1)]) {
      await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${contexto.garagem} AND data_operacao=${day}`;
    }
    assertDate();
    const { garagem, escalaTipo, turno, dataOperacao } = contexto;
    await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${garagem} AND escala_tipo=${escalaTipo} AND turno=${turno} AND data_operacao=${dataOperacao}`;
    const old = await tx.escalaDiaria.findUnique({ where: selector(contexto) });
    if ((old?.revisao ?? 0) !== c.revisao) throw new MvpError(409, 'Escala do dia alterada em outro posto. Recarregue e revise antes de salvar.');
    const source = await ciBlocks(tx, contexto, frota), state = parseStoredDailyScale(old?.conteudo, contexto);
    const fixed = state.programacao ?? (old ? fixedSchedule(contexto) : await dateProgramming(tx, 'ESCALA', contexto));
    const nextStarted = await nextScaleStarted(tx, contexto);
    if (treating) {
      if (!state.fluxo || !old) throw new MvpError(409, 'Escala nao iniciada.');
    } else assertScaleOperation(operation, state.fluxo, Boolean(old), source.ciFinalizada, nextStarted);
    const { ciFinalizada: _ciFinalizada, ...sourceSnapshot } = source;
    if ('operacao' in c && !('card' in c) && c.operacao !== 'tratar-substituido' && c.operacao !== 'limpar-linha' && c.operacao !== 'suspender-linha' && c.operacao !== 'reativar-linha' && c.operacao !== 'devolver-fixo') {
      const fluxo: ScaleLifecycle = c.operacao === 'iniciar'
        ? { status: 'EM_PREPARACAO', iniciadaEm: clock().toISOString(), finalizadaEm: null, fonteCI: sourceSnapshot }
        : { ...state.fluxo!, status: c.operacao === 'finalizar' ? 'FINALIZADA' : 'EM_PREPARACAO',
          finalizadaEm: c.operacao === 'finalizar' ? clock().toISOString() : null, fonteCI: sourceSnapshot };
      const itens = c.operacao === 'iniciar' ? [] : state.itens;
      const cards = c.operacao === 'iniciar' ? cleanCards(contexto, frota, fixed) : state.cards!;
      const confirmacoes = c.operacao === 'iniciar' ? [] : state.confirmacoes;
      const historicoTrocas = c.operacao === 'iniciar' ? [] : state.historicoTrocas;
      const payload = savedSchema.parse({ limpezas: 'limpezas' in state ? state.limpezas : undefined, version: 3, itens, cards, confirmacoes, historicoTrocas, programacao: fixed, fluxo });
      // Zero representa ausencia no GET/comando inicial; registros persistidos
      // comecam em 1, conforme CK_escala_diaria_revisao do banco.
      const data = { revisao: c.revisao + 1, conteudo: JSON.stringify(payload), responsavelId: userId! };
      assertDate();
      if (old) await tx.escalaDiaria.update({ where: { id: old.id }, data });
      else await tx.escalaDiaria.create({ data: { ...contexto, ...data } });
      assertDate();
      return { ...project(contexto, data.revisao, itens, cards, frota, source, 'salvo', 0, confirmacoes, colorCache, fixed),
        historicoTrocas, fluxo: flowView(fluxo, true, source.ciFinalizada, nextStarted) };
    }
    const itens = state.itens;
    const historicoTrocas = state.historicoTrocas;
    let confirmacoes = state.confirmacoes;
    const cards = state.cards ?? defaultAllocations(garagem, frota, source.bloqueados, fixed, itens).cards;
    const used = occupations(fixed, itens, cards);
    const portaria = cards.find(card => card.id === 'PORTARIA')?.itens.map(i => i.prefixo).filter(Boolean) ?? [];
    if ('trocaId' in c) {
      treatScaleWithdrawal({ trocaId: c.trocaId, retirada: c.retirada, historico: historicoTrocas, cards, fixed, itens, frota,
        bloqueadosCI: [...new Set([...source.bloqueados, ...(state.fluxo?.fonteCI.bloqueados ?? [])])], usuarioId: userId!, agora: clock() });
    } else if ('id' in c) {
      const original = fixed.find(i => i.id === c.id);
      let sameBase = false;
      try { sameBase = Boolean(original) && JSON.stringify(trafficRowSchema.parse(JSON.parse(c.base))) === JSON.stringify(trafficRowSchema.parse(original)); }
      catch { /* Token inválido não autoriza gravação. */ }
      if (!original || !sameBase) throw new MvpError(409, 'Programacao fixa diferente da versao do servidor. Atualize a pagina e revise.');
      if ('operacao' in c && c.operacao === 'devolver-fixo') {
        const returned = returnFixedToSubstituted({ linhaId: c.id, prefixo: original.carroProgramado,
          substituto: itens.find(i => i.id === c.id)?.carroSubstituido ?? original.carroProgramado,
          historico: historicoTrocas, cards, fixed, itens, frota,
          bloqueadosCI: [...new Set([...source.bloqueados, ...(state.fluxo?.fonteCI.bloqueados ?? [])])], usuarioId: userId!, agora: clock() });
        const limpezas = 'limpezas' in state ? state.limpezas ?? [] : [];
        limpezas.push({ id: randomUUID(), linhaId: c.id, usuarioId: userId!, registradoEm: clock().toISOString(),
          anterior: JSON.stringify({ operacao: 'DEVOLVER_FIXO_SUBSTITUIDOS', origem: returned.origem, pendenteId: returned.pendente.id }) });
        Object.assign(state, { limpezas });
      } else if ('operacao' in c) {
        const index = itens.findIndex(i => i.id === c.id);
        const anterior = { operacao: c.operacao, id: c.id, carroSubstituido: itens[index]?.carroSubstituido ?? null, suspensa: itens[index]?.suspensa ?? false,
          confirmacao: confirmacoes.find(i => i.id === c.id) ?? null };
        if (c.operacao === 'reativar-linha' && !anterior.suspensa) throw new MvpError(409, 'Linha nao esta suspensa.');
        if (c.operacao === 'suspender-linha' && anterior.suspensa) throw new MvpError(409, 'Linha ja suspensa.');
        if (c.operacao === 'limpar-linha' && !original.carroProgramado && !anterior.suspensa && itens[index]?.carroSubstituido === '' && !anterior.confirmacao) throw new MvpError(409, 'Linha ja esta limpa. Recarregue.');
        const desfazimento = c.operacao === 'limpar-linha' ? undoFixedWithdrawal({ linhaId: c.id, prefixo: original.carroProgramado, historico: historicoTrocas, cards, fixed, itens }) : null;
        const limpezas = 'limpezas' in state ? state.limpezas ?? [] : [];
        limpezas.push({ id: randomUUID(), linhaId: c.id, usuarioId: userId!, registradoEm: clock().toISOString(), anterior: JSON.stringify({ ...anterior, desfazimento }) });
        Object.assign(state, { limpezas });
        const next = { id: c.id, carroSubstituido: '', suspensa: c.operacao === 'suspender-linha' };
        if (c.operacao === 'limpar-linha') { if (index >= 0) itens.splice(index, 1); }
        else if (index >= 0) itens[index] = next; else itens.push(next);
        confirmacoes = confirmacoes.filter(i => i.id !== c.id);
      } else {
        if (itens.find(i => i.id === c.id)?.suspensa) throw new MvpError(409, 'Reative a linha antes de confirmar um carro.');
        const effective = c.carroSubstituido || original.carroProgramado;
        const anterior = itens.find(i => i.id === c.id)?.carroSubstituido ?? original.carroProgramado;
        const usoBloqueadoCI = authorizeCiUse({ linhaId: c.id, prefixo: effective, ciData: contexto.dataOperacao, bloqueados: source.bloqueados, confirmar: c.confirmarBloqueadoCI,
          anterior: confirmacoes.find(i => i.id === c.id && i.prefixo === effective)?.usoBloqueadoCI, usuarioId: userId!, agora: clock() });
        validateAllocation(effective, 'linha:' + c.id, frota, portaria, used);
        if (usoBloqueadoCI && c.confirmarBloqueadoCI) {
          const limpezas = 'limpezas' in state ? state.limpezas ?? [] : [];
          limpezas.push({ id: randomUUID(), linhaId: c.id, usuarioId: userId!, registradoEm: clock().toISOString(), anterior: JSON.stringify({ operacao: 'USO_BLOQUEADO_CI', ...usoBloqueadoCI }) });
          Object.assign(state, { limpezas });
        }
        confirmacoes = [...confirmacoes.filter(i => i.id !== c.id), { id: c.id, prefixo: effective, ...(usoBloqueadoCI ? { usoBloqueadoCI } : {}) }];
        const index = itens.findIndex(i => i.id === c.id);
        if (!c.carroSubstituido || c.carroSubstituido === original.carroProgramado) { if (index >= 0) itens.splice(index, 1); }
        else { const next = { id: c.id, carroSubstituido: c.carroSubstituido }; if (index < 0) itens.push(next); else itens[index] = next; }
        const troca = registerScaleWithdrawal({ anterior, substituto: effective, linhaId: c.id, retirada: c.retirada,
          cards, fixed, itens, frota, bloqueadosCI: source.bloqueados, usuarioId: userId!, agora: clock() });
        if (troca) historicoTrocas.push(troca);
      }
    } else {
      const card = cards.find(card => card.id === c.card);
      if (!card) throw new MvpError(400, 'Card desconhecido.');
      if (card.id === 'SUBSTITUIDOS') throw new MvpError(400, 'Use o tratamento da substituicao.');
      if (isColorReserveCard(card.id)) throw new MvpError(400, 'Reserva por cor e automatica; aloque o carro nas linhas ou demais cards.');
      if (card.modo === 'rabicho' && c.operacao === 'adicionar') throw new MvpError(400, 'As linhas e tabelas do Rabicho sao fixas. Defina apenas o carro.');
      const item = card.itens.find(i => i.id === c.itemId);
      if (c.operacao === 'remover') {
        if (!item) throw new MvpError(409, 'Posicao ja removida. Recarregue.');
        if (card.modo === 'lista') card.itens = card.itens.filter(i => i.id !== item.id);
        else item.prefixo = '';
      } else {
        if (c.operacao === 'definir' && !item) throw new MvpError(409, 'Posicao inexistente.');
        if (c.prefixo) validateAllocation(c.prefixo, item ? 'card:' + card.id + ':' + item.id : '', frota,
          [...source.bloqueados, ...portaria.filter(p => !(card.id === 'PORTARIA' && item?.prefixo === p))], used);
        if (c.operacao === 'definir' && item) {
          item.prefixo = c.prefixo;
          // Uma edicao manual passa a ser independente da troca que criou a posicao.
          if (card.id === 'PORTARIA') item.id = randomUUID();
        }
        else if (card.modo === 'lista' && c.prefixo) card.itens.push({ id: randomUUID(), prefixo: c.prefixo });
        else throw new MvpError(400, 'Informe os dados da posicao.');
      }
    }
    const payload = savedSchema.parse({ limpezas: 'limpezas' in state ? state.limpezas : undefined, version: 3, itens, cards, confirmacoes, historicoTrocas, programacao: fixed, fluxo: treating ? state.fluxo! : { ...state.fluxo!, fonteCI: sourceSnapshot } });
    const data = { revisao: c.revisao + 1, conteudo: JSON.stringify(payload), responsavelId: userId! };
    assertDate();
    if (old) await tx.escalaDiaria.update({ where: { id: old.id }, data });
    else await tx.escalaDiaria.create({ data: { ...contexto, ...data } });
    assertDate();
    const presentationSource = treating && state.fluxo?.status === 'FINALIZADA' ? state.fluxo.fonteCI : source;
    return { ...project(contexto, data.revisao, itens, cards, frota, presentationSource, 'salvo', 0, confirmacoes, colorCache, fixed),
      historicoTrocas, fluxo: flowView(payload.fluxo!, true, source.ciFinalizada, nextStarted) };
  }, { isolationLevel: 'Serializable' });
  if (operation !== 'editar' || treating) await notifyC4Updated(contexto.garagem, addDays(contexto.dataOperacao, -1));
  return result;
}
