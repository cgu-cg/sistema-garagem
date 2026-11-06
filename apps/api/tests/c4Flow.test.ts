import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { startCycle, finalizeCycle, readContext, saveC4 } from '../src/services/c4Flow';
import { changeCILifecycle } from '../src/services/ciLifecycle';
import { addDays } from '../src/services/c4Temporal';
import { subscribeC4Updates, type C4Updated } from '../src/services/c4Events';
import { operationalContext, dateValue, eventInstant, enabledGarages, nextEvent, civil, mutationMode } from '../src/services/c4Temporal';
import { revision } from '../src/services/mvpTemporal';
import { revision as clientRevision } from '../../web/src/lib/mvpTemporal';
import { ciEntryGarage, vehiclesForGarage } from '../../web/src/lib/c4Vehicles';
import { c4KnownFields, c4EditedText } from '../../web/src/lib/c4ItemFields';
import { savedInspectionEntries, saveInspectionSelection } from '../../web/src/pages/soltura/ciReinforcementEditor';
import Module from 'node:module';
import path from 'node:path';

const day = '2026-10-07', target = '2026-10-08';
const clock = (value = '2026-10-07T12:00:00Z') => () => new Date(value);
function fixture(source = true, empty = false, historical: boolean | '2026-10-08' = false) {
  let tables: Record<string, any[]> = { cicloOperacional: [], folhaCI: [], itemFolhaCI: [], estadoManutencao: [] };
  let serial = 100, mutations = 0, admin = true;
  const queries: { sql: string; values: unknown[] }[] = [];
  const stamp = new Date('2026-10-06T23:00:00Z');
  if (source) {
    tables.folhaCI.push({ id: 10, garagem: 'VCG', dataFolha: dateValue(day), status: 'FINALIZADA', origem: 'IMPORTACAO', tituloColunaAdicional: 'INSPEÇÃO', finalizadaEm: null, createdAt: stamp, updatedAt: stamp });
    if (!empty) for (const [n, categoria, extra] of [
      [1, 'BLOQUEADO', { prefixo: '3083', consorciada: 'VCM', motivo: 'MOTOR', dataBloqueio: dateValue('2026-10-01') }],
      [2, 'PREVENTIVA', { subTipo: 'LUBRIFICACAO' }], [3, 'OFICINA', { subTipo: 'ELEVADOR' }],
      [4, 'REFORCO', { tipoPosicao: 'FIXO', ordemPosicao: 1, horarioReforco: '07:40' }],
      [5, 'REFORCO', { tipoPosicao: 'EXTRA', ordemPosicao: 1, horarioReforco: '07:40' }],
    ] as const) tables.itemFolhaCI.push({ id: 10 + n, folhaId: 10, chaveItem: randomUUID(), categoria, prefixo: '4000', consorciada: null, motivo: null, gravidade: null, statusItem: null, observacoes: null, horaBloqueio: null, responsavel: null, tipoPosicao: null, ordemPosicao: null, createdAt: stamp, updatedAt: stamp, ...extra });
  }
  if (source && historical) {
    const historicalDay = historical === true ? day : historical;
    const filename = historical === true ? 'data-001c4-importacao-historico-2026-10-01-a-07.sql' : 'data-001c4-importacao-historico-2026-10-08.sql';
    const sql = readFileSync(path.resolve(__dirname, '../../../scripts/sql', filename), 'utf8');
    const records = sql.split(/\r?\n/).filter(line => line.startsWith('-- AUDIT-ITEM ')).map(line => JSON.parse(line.slice(14))).filter(item => item.date === historicalDay);
    tables.folhaCI[0].dataFolha = dateValue(historicalDay);
    tables.itemFolhaCI = records.map((item, index) => ({
      id: index + 11, folhaId: 10, chaveItem: item.guid, categoria: item.categoria,
      prefixo: item.prefixo, consorciada: item.consorciada, subTipo: item.sub_tipo,
      tipoPosicao: item.tipo_posicao, ordemPosicao: item.ordem_posicao,
      horarioReforco: item.horario_reforco, motivo: item.motivo, observacoes: item.observacoes,
      dataBloqueio: item.data_bloqueio ? dateValue(item.data_bloqueio) : null,
      horaBloqueio: null, gravidade: null, responsavel: null, statusItem: null,
      dataLiberacao: null, motivoLiberacao: null, responsavelLiberacao: null,
      responsavelRegistroId: null, createdAt: stamp, updatedAt: stamp,
    }));
  }
  const match = (r: any, where: any = {}): boolean => Object.entries(where).every(([k, v]: [string, any]) => {
    if (k === 'garagem_dataFolha' || k === 'garagem_dataOperacional') return match(r, v);
    if (v instanceof Date) return r[k] instanceof Date && r[k].getTime() === v.getTime();
    return r[k] === v;
  });
  let operationalUser: any = null;
  const tx: any = { user: { findUnique: async () => operationalUser || ({ role: admin ? 'ADMIN' : 'COLABORADOR' }) },
    $queryRaw: async (parts: TemplateStringsArray, ...values: unknown[]) => { queries.push({ sql: parts.join('?'), values }); return []; } };
  for (const name of Object.keys(tables)) {
    const include = (row: any, options: any) => row && { ...row, ...(options.include?.itens ? { itens: tables.itemFolhaCI.filter(i => i.folhaId === row.id).map(i => ({ ...i })) } : {}) };
    tx[name] = {
      findUnique: async (o: any) => include(tables[name].find(r => match(r, o.where)), o) || null,
      findMany: async (o: any = {}) => tables[name].filter(r => match(r, o.where)).map(r => include(r, o)),
      create: async ({ data }: any) => { mutations++; const row = { id: ++serial, createdAt: new Date(serial), updatedAt: new Date(serial), ...data }; tables[name].push(row); return { ...row }; },
      update: async ({ where, data }: any) => { mutations++; const row = tables[name].find(r => match(r, where)); assert.ok(row); Object.assign(row, data, { updatedAt: new Date(++serial) }); return { ...row }; },
      delete: async ({ where }: any) => { mutations++; const row = tables[name].find(r => match(r, where)); assert.ok(row); tables[name] = tables[name].filter(r => r !== row); return row; },
    };
  }
  // Simula serializacao/rollback, sem abrir conexao. Locks reais exigem validacao posterior.
  let queue = Promise.resolve();
  const db: any = { ...tx, $transaction: (fn: any, opts: any) => {
    assert.equal(opts.isolationLevel, 'Serializable');
    const result = queue.then(async () => { const before = structuredClone(tables); try { return await fn(tx); } catch (error) { tables = before; throw error; } });
    queue = result.then(() => undefined, () => undefined); return result;
  } };
  return { db, portaria: (events: any[]) => { tx.ciPortariaEvento = { findMany: async () => events }; }, tables: () => structuredClone(tables), writes: () => mutations, queries, identity: (value: any) => { operationalUser = value; }, role: (value: boolean) => { admin = value; } };
}
async function ready() { const f = fixture(); await startCycle(f.db, 'VCG', clock()); return f; }
test('primeira fotografia VCM 05/11 com 1341 permite iniciar e finalizar CI 06/11 sem origem ficticia', async () => {
  const f = fixture(false), now = () => new Date('2026-11-05T16:00:00Z');
  const source = await f.db.folhaCI.create({ data: { garagem: 'VCM', dataFolha: dateValue('2026-11-05'),
    status: 'FINALIZADA', origem: 'IMPORTACAO', cicloPreparacaoId: null, folhaOrigemId: null,
    tituloColunaAdicional: null, finalizadaEm: null, referenciaOrigem: 'IMPLANTACAO VCM informada pelo usuario' } });
  await f.db.itemFolhaCI.create({ data: { folhaId: source.id, chaveItem: randomUUID(), prefixo: '1341',
    categoria: 'BLOQUEADO', consorciada: 'VCM', motivo: null, statusItem: 'BLOQUEADO', dataBloqueio: dateValue('2026-11-05') } });
  const initial = f.tables();
  f.identity({ role: 'manutencao', garagem: 'VCM' });
  const startContext = await readContext(f.db, 'VCM', '2026-11-05', now, 1);
  await changeCILifecycle(f.db, 1, { garagem: 'VCM', data: '2026-11-06', operacao: 'iniciar', baseC4: startContext.baseC4 }, now, ['VCM']);
  const after = f.tables(), next = after.folhaCI.find(i => i.id !== source.id)!;
  assert.equal(next.status, 'EM_PREPARACAO'); assert.equal(next.folhaOrigemId, source.id);
  assert.equal(next.origem, 'NORMAL'); assert.equal(next.dataFolha.toISOString().slice(0,10), '2026-11-06');
  assert.deepEqual(after.itemFolhaCI.filter(i => i.folhaId === next.id).map(i => i.prefixo), ['1341']);
  assert.deepEqual(after.folhaCI.find(i => i.id === source.id), initial.folhaCI[0]);
  assert.deepEqual(after.itemFolhaCI.filter(i => i.folhaId === source.id), initial.itemFolhaCI);
  assert.ok(after.folhaCI.every(i => i.garagem === 'VCM')); assert.equal(after.folhaCI.length, 2);
  const finishContext = await readContext(f.db, 'VCM', '2026-11-05', now, 1);
  await changeCILifecycle(f.db, 1, { garagem: 'VCM', data: '2026-11-06', operacao: 'finalizar', baseC4: finishContext.baseC4 }, now, ['VCM']);
  assert.equal(f.tables().folhaCI.find(i => i.id === next.id).status, 'FINALIZADA');
});
test('bloqueio exclusivo Portaria em CI finalizada nao trava Controle nem e removido por ele', async () => {
  const f = await ready(), folha = f.tables().folhaCI.find(i => i.id !== 10)!;
  const chaveItem = randomUUID();
  await f.db.itemFolhaCI.create({ data: { folhaId: folha.id, chaveItem, prefixo: '4000', categoria: 'BLOQUEADO',
    consorciada: 'VCG', motivo: 'Problema Portaria', statusItem: 'BLOQUEADO', dataBloqueio: dateValue(target) } });
  await f.db.folhaCI.update({ where: { id: folha.id }, data: { status: 'FINALIZADA' } });
  const ciclo = f.tables().cicloOperacional[0];
  await f.db.estadoManutencao.create({ data: { cicloId: ciclo.id, prefixo: '4000', consorciada: 'VCG', bloqueado: false,
    emExecucao: true, liberado: false, observacaoOficina: 'Servico da manutencao', observacaoBloqueio: null } });
  f.portaria([{ folhaId: folha.id, itemChave: chaveItem, tipo: 'BLOQUEIO_CI' }]);
  const c = await command(f, 'manutencao');
  const state = c.items.find(i => i.prefixo === '4000') as any;
  state.observacaoOficina = 'Servico atualizado';
  await saveC4(f.db, 1, c, 'manutencao', clock());
  const after = f.tables();
  assert.equal(after.itemFolhaCI.find(i => i.chaveItem === chaveItem)?.motivo, 'Problema Portaria');
  assert.equal(after.folhaCI.find(i => i.id === folha.id).status, 'FINALIZADA');
  assert.equal(after.estadoManutencao.find(i => i.prefixo === '4000').observacaoOficina, 'Servico atualizado');
  const context = await readContext(f.db, 'VCG', day);
  assert.equal(context.ci.find(i => i.chaveItem === chaveItem)?.bloqueadoPortaria, true);
});
test('origem importada de 08/10 cria preparacao de 09/10 com 77 itens e 28 estados sem alterar historia', async () => {
  const f = fixture(true, false, '2026-10-08'), before = f.tables();
  assert.equal(before.itemFolhaCI.length, 77);
  assert.equal((await startCycle(f.db, 'VCG', clock('2026-10-08T12:00:00Z'))).result, 'NORMAL');
  const after = f.tables();
  assert.deepEqual(after.folhaCI.find(row => row.id === 10), before.folhaCI[0]);
  assert.deepEqual(after.itemFolhaCI.filter(row => row.folhaId === 10), before.itemFolhaCI);
  const preparation = after.folhaCI.find(row => row.id !== 10)!;
  assert.equal(preparation.dataFolha.toISOString().slice(0, 10), '2026-10-09');
  assert.equal(preparation.folhaOrigemId, 10);
  const copied = after.itemFolhaCI.filter(row => row.folhaId === preparation.id);
  assert.equal(copied.length, 77);
  for (const original of before.itemFolhaCI) {
    const copy = copied.find(row => row.chaveItem === original.chaveItem)!;
    for (const key of Object.keys(original).filter(key => !['id', 'folhaId', 'createdAt', 'updatedAt'].includes(key))) assert.deepEqual(copy[key], original[key]);
  }
  assert.equal(after.estadoManutencao.length, 28);
  assert.ok(after.estadoManutencao.every(row => row.bloqueado && !row.emExecucao && !row.liberado));
});
test('flag ausente ou vazia preserva selecao do fluxo legado', async () => {
  const previous = process.env.CI_NOVO_FLUXO_GARAGENS;
  try {
    for (const value of [undefined, '', '   ']) {
      if (value === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS;
      else process.env.CI_NOVO_FLUXO_GARAGENS = value;
      assert.deepEqual(enabledGarages(), []);
      assert.equal(mutationMode(undefined), 'LEGADO');
      assert.equal(mutationMode('VCG'), 'LEGADO');
    }
  } finally {
    if (previous === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS;
    else process.env.CI_NOVO_FLUXO_GARAGENS = previous;
  }
});
test('primeira ativacao em 07/10 copia manifesto importado: 75 itens, 32 bloqueados e historia imutavel', async () => {
  const f = fixture(true, false, true), before = f.tables();
  assert.equal(before.itemFolhaCI.length, 75);
  assert.equal((await startCycle(f.db, 'VCG', clock())).result, 'NORMAL');
  const after = f.tables();
  assert.deepEqual(after.folhaCI.find(row => row.id === 10), before.folhaCI[0]);
  assert.deepEqual(after.itemFolhaCI.filter(row => row.folhaId === 10), before.itemFolhaCI);
  const copied = after.itemFolhaCI.filter(row => row.folhaId !== 10);
  assert.equal(copied.length, 75);
  for (const original of before.itemFolhaCI) {
    const copy = copied.find(row => row.chaveItem === original.chaveItem)!;
    for (const key of Object.keys(original).filter(key => !['id', 'folhaId', 'createdAt', 'updatedAt'].includes(key))) assert.deepEqual(copy[key], original[key]);
  }
  assert.equal(after.estadoManutencao.length, 32);
  assert.ok(after.estadoManutencao.every(row => row.bloqueado && !row.emExecucao && !row.liberado));
});
test('ativacao com lacuna apos 20:00 cria e finaliza apenas preparacao atual vazia', async () => {
  const f = fixture(true, false, true), before = f.tables();
  const previous = process.env.CI_NOVO_FLUXO_GARAGENS;
  try {
    process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
    await startCycle(f.db, 'VCG', clock('2026-10-11T00:30:00Z')); await finalizeCycle(f.db, 'VCG', clock('2026-10-11T00:30:00Z'));
    const after = f.tables();
    assert.equal(after.cicloOperacional.length, 1);
    assert.equal(after.cicloOperacional[0].origem, 'RECUPERACAO');
    assert.equal(after.cicloOperacional[0].dataOperacional.toISOString().slice(0, 10), '2026-10-10');
    assert.equal(after.folhaCI.length, 2);
    const preparation = after.folhaCI.find(row => row.id !== 10)!;
    assert.equal(preparation.dataFolha.toISOString().slice(0, 10), '2026-10-11');
    assert.equal(preparation.status, 'FINALIZADA');
    assert.equal(preparation.folhaOrigemId, null);
    assert.deepEqual(after.itemFolhaCI, before.itemFolhaCI);
    assert.equal(after.estadoManutencao.length, 0);
    await startCycle(f.db, 'VCG', clock('2026-10-11T00:31:00Z')); await finalizeCycle(f.db, 'VCG', clock('2026-10-11T00:31:00Z'));
    assert.deepEqual(f.tables(), after);
  } finally {
    if (previous === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS;
    else process.env.CI_NOVO_FLUXO_GARAGENS = previous;
  }
});
test('destino FINALIZADA preexistente recusa inicializacao sem sobrescrever historia', async () => {
  const f = fixture(true, false, true);
  await f.db.folhaCI.create({ data: { garagem: 'VCG', dataFolha: dateValue(target), status: 'FINALIZADA', origem: 'IMPORTACAO', cicloPreparacaoId: null } });
  const before = f.tables();
  await assert.rejects(startCycle(f.db, 'VCG', clock()), /Estrutura C4 parcial/);
  assert.deepEqual(f.tables(), before);
});
// Fotografias antigas podem conter coexistencia; o setup nao usa novos comandos de transicao.
async function seedLegacyExecution(f: ReturnType<typeof fixture>, data: Record<string, unknown> = {}) {
  await f.db.estadoManutencao.update({ where: { id: f.tables().estadoManutencao[0].id }, data: { emExecucao: true, ...data } });
}
async function command(f: ReturnType<typeof fixture>, kind: 'ci' | 'manutencao') {
  const ctx = await readContext(f.db, 'VCG', day);
  const items = kind === 'ci' ? ctx.ci.filter(i => i.data === target) : ctx.maintenance;
  return { garagem: 'VCG', data: kind === 'ci' ? target : day, base: revision(items), baseC4: ctx.baseC4, items: structuredClone(items), removeBlocked: [] as string[], confirmRelease: false };
}

for (const milliseconds of ['000', '001', '567', '999']) {
  test(`revision preserva .${milliseconds} entre Date, ISO e transporte JSON`, () => {
    const timestamp = `2026-10-07T12:34:56.${milliseconds}Z`;
    const items = [{ id: 'c4-ci-1', updatedAt: new Date(timestamp), prefixo: '4000',
      data: target, garagem: 'VCG', categoriaPlanilha: 'OFICINA', setorOficina: 'MECANICA' }];
    const wire = JSON.parse(JSON.stringify(items));
    for (const calculate of [revision, clientRevision]) {
      assert.equal(JSON.parse(calculate(items))[0][1], timestamp);
      assert.equal(calculate(items), calculate(wire));
    }
    assert.equal(revision(items), clientRevision(wire));
  });
}

test('revision distingue timestamp e conteudo, preservando ordenacao deterministica', () => {
  const first = { id: 'c4-ci-2', updatedAt: new Date('2026-10-07T12:34:56.567Z'), motivo: 'MOTOR' };
  const second = { ...first, id: 'c4-ci-10' };
  for (const calculate of [revision, clientRevision]) {
    assert.notEqual(calculate([first]), calculate([{ ...first, updatedAt: new Date('2026-10-07T12:34:56.568Z') }]));
    assert.notEqual(calculate([first]), calculate([{ ...first, motivo: 'FREIO' }]));
    assert.equal(calculate([first, second]), calculate([second, first]));
    assert.deepEqual(JSON.parse(calculate([first, second])).map((row: unknown[]) => row[0]), ['c4-ci-10', 'c4-ci-2']);
  }
  assert.equal(revision([first, second]), clientRevision(JSON.parse(JSON.stringify([second, first]))));
});

for (const operation of ['prepare', 'save'] as const) {
  test(`C4 ${operation} aceita base do frontend apos JSON e rejeita base obsoleta`, async () => {
    const f = await ready();
    const ctx = JSON.parse(JSON.stringify(await readContext(f.db, 'VCG', day)));
    const items = ctx.ci.filter((i: any) => i.data === target && i.garagem === 'VCG');
    // A fixture cria itens com milissegundos nao zero, como timestamps reais do Prisma.
    assert.ok(items.some((i: any) => new Date(i.updatedAt).getUTCMilliseconds() !== 0));
    const payload = JSON.parse(JSON.stringify({ garagem: 'VCG', data: target, operation,
      baseC4: ctx.baseC4, base: clientRevision(items),
      items: operation === 'prepare' ? [] : items.map((i: any) => ({ ...i, motivo: 'REVISAO ATUALIZADA' })),
      removeBlocked: [] }));
    const before = f.tables();
    await saveC4(f.db, 1, payload, 'ci', clock());
    if (operation === 'prepare') assert.deepEqual(f.tables(), before);
    else assert.ok((await readContext(f.db, 'VCG', day)).ci.filter(i => i.data === target).every(i => i.motivo === 'REVISAO ATUALIZADA'));

    const fresh = JSON.parse(JSON.stringify(await readContext(f.db, 'VCG', day)));
    const staleItems = fresh.ci.filter((i: any) => i.data === target);
    staleItems[0].updatedAt = new Date(new Date(staleItems[0].updatedAt).getTime() - 1).toISOString();
    const committed = f.tables();
    await assert.rejects(saveC4(f.db, 1, { ...payload, baseC4: fresh.baseC4,
      base: clientRevision(staleItems) }, 'ci', clock()), /Conteudo de origem desatualizado/);
    assert.deepEqual(f.tables(), committed);
  });
}

for (const [categoria, extra] of [
  ['PREVENTIVA', { tipoPreventiva: 'LUBRIFICACAO' }],
  ['OFICINA', { setorOficina: 'BILHETAGEM' }],
  ['REFORCO', { tipoPosicao: 'FIXO', ordemPosicao: 12 }],
  ['REFORCO', { tipoPosicao: 'EXTRA', ordemPosicao: 6 }],
] as const) test(`C4 ${categoria}/${JSON.stringify(extra)} preserva campos opcionais e prefixo 23 em save/load`, async () => {
  const f = await ready(), c = await command(f, 'ci');
  const motivo = categoria === 'REFORCO' && 'tipoPosicao' in extra && extra.tipoPosicao === 'FIXO' ? 'INSPECAO' : null;
  (c.items as any[]).push({ id: 'novo-23', prefixo: '23', categoriaPlanilha: categoria, garagem: 'VCG', data: target,
    consorciada: null, motivo, gravidade: null, status: null, ...extra });
  await saveC4(f.db, 1, c, 'ci', clock());
  const ctx = await readContext(f.db, 'VCG', day), i = ctx.ci.find(i => i.data === target && i.prefixo === '23')!;
  assert.ok(i); assert.equal(i.prefixo, '23'); assert.equal(i.consorciada, null);
  assert.equal(i.motivo, motivo); assert.equal(i.gravidade, null); assert.equal(i.status, null);
  if (categoria === 'OFICINA') assert.equal(i.setorOficina, 'BILHETAGEM');
  const before = f.tables(), writes = f.writes();
  await saveC4(f.db, 1, await command(f, 'ci'), 'ci', clock());
  assert.deepEqual(f.tables(), before); assert.equal(f.writes(), writes);
});

for (const value of [null, undefined, 'INVALIDA']) test(`C4 BLOQUEADO consorciada ${value} rejeitado sem escrita`, async () => {
  const f = await ready(), c = await command(f, 'ci'), before = f.tables(), writes = f.writes();
  (c.items as any[])[0].consorciada = value;
  await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()));
  assert.deepEqual(f.tables(), before); assert.equal(f.writes(), writes);
});

test('C4 omissao opcional persiste NULL sem criar ALTA/BLOQUEADO/motivo', async () => {
  const f = await ready(), c = await command(f, 'ci');
  (c.items as any[]).push({ id: 'omisso', prefixo: '23', categoriaPlanilha: 'OFICINA', setorOficina: 'BILHETAGEM', garagem: 'VCG', data: target });
  await saveC4(f.db, 1, c, 'ci', clock());
  const row = f.tables().itemFolhaCI.find(i => i.folhaId !== 10 && i.prefixo === '23');
  for (const k of ['consorciada', 'motivo', 'gravidade', 'statusItem', 'observacoes', 'horaBloqueio', 'responsavel']) assert.equal(row[k], null);
});

for (const value of [null, 'INVALIDA']) test(`Controle BLOQUEADO consorciada ${value} rejeitado sem escrita`, async () => {
  const f = await ready(), c = await command(f, 'manutencao'), before = f.tables(), writes = f.writes();
  (c.items as any[])[0].consorciada = value;
  await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()));
  assert.deepEqual(f.tables(), before); assert.equal(f.writes(), writes);
});

test('consorciada conhecida em item nao bloqueado e preservada sem contaminar outros itens', async () => {
  const f = await ready(), c = await command(f, 'ci');
  const known = (c.items as any[]).find(i => i.categoriaPlanilha === 'PREVENTIVA');
  known.consorciada = 'VCM';
  await saveC4(f.db, 1, c, 'ci', clock());
  const ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.ci.find(i => i.id === known.id)!.consorciada, 'VCM');
  for (const i of ctx.ci.filter(i => i.data === target && i.id !== known.id && i.categoriaPlanilha !== 'BLOQUEADO')) assert.equal(i.consorciada, null);
});

test('03:00 e round-trip preservam NULL de todas as categorias e VCM do bloqueado', async () => {
  const f = await ready();
  const ctx = await readContext(f.db, 'VCG', day);
  for (const i of ctx.ci.filter(i => i.data === target && i.categoriaPlanilha !== 'BLOQUEADO')) {
    assert.equal(i.consorciada, null); assert.equal(i.motivo, null); assert.equal(i.status, null); assert.equal(i.gravidade, null);
  }
  assert.equal(ctx.ci.find(i => i.prefixo === '3083')!.consorciada, 'VCM');
  const before = f.tables(), writes = f.writes();
  await saveC4(f.db, 1, await command(f, 'ci'), 'ci', clock());
  assert.deepEqual(f.tables(), before); assert.equal(f.writes(), writes);
});

test('Controle preserva motivo NULL e nao fabrica status ao incluir bloqueio', async () => {
  const f = await ready(), c = await command(f, 'manutencao');
  (c.items as any[]).push({ id: 'novo', prefixo: '1322', consorciada: 'VCM', data: day,
    observacao: null, observacaoBloqueio: null, bloqueado: true, emExecucao: false, liberado: false });
  await saveC4(f.db, 1, c, 'manutencao', clock());
  const ctx = await readContext(f.db, 'VCG', day), i = ctx.ci.find(i => i.data === target && i.prefixo === '1322')!;
  assert.equal(i.motivo, null); assert.equal(i.status ?? null, null);
  assert.equal(ctx.maintenance.find(s => s.prefixo === '1322')!.observacao, null);
  const before = f.tables(); await saveC4(f.db, 1, await command(f, 'manutencao'), 'manutencao', clock());
  assert.deepEqual(f.tables(), before);
});

test('frontend C4 usa somente dados do proprio item e nao fabrica campos ausentes', () => {
  const unknown: any = { prefixo: '23', categoriaPlanilha: 'OFICINA', setorOficina: 'BILHETAGEM', consorciada: null };
  assert.deepEqual(c4KnownFields(unknown), { consorciada: null, hora: null, gravidade: null, responsavel: null, status: null });
  assert.equal(c4KnownFields({ ...unknown, prefixo: '3083', consorciada: 'VCM' }).consorciada, 'VCM');
  assert.equal(c4EditedText('', null), null); assert.equal(c4EditedText('', ''), '');
  assert.equal(c4EditedText('MOTOR', 'MOTOR'), 'MOTOR'); assert.equal(c4EditedText('  FREIO  ', null), 'FREIO');
});

test('timezone explicito e fronteiras 03:00/20:00', () => {
  assert.equal(eventInstant(day, 3).toISOString(), '2026-10-07T07:00:00.000Z');
  assert.equal(eventInstant(day, 20).toISOString(), '2026-10-08T00:00:00.000Z');
  assert.equal(operationalContext(new Date('2026-10-07T06:59:59Z')).open, false);
  assert.equal(operationalContext(new Date('2026-10-07T07:00:00Z')).open, true);
  assert.equal(operationalContext(new Date('2026-10-08T00:00:00Z')).open, false);
  assert.equal(nextEvent(new Date('2026-10-08T00:01:00Z')).toISOString(), '2026-10-08T07:00:00.000Z');
});
test('config vazia desativa tudo, VCM somente explicita', () => {
  assert.deepEqual(enabledGarages(''), []); assert.deepEqual(enabledGarages('VCG'), ['VCG']);
  assert.deepEqual(enabledGarages('VCG,VCM,VCG'), ['VCG', 'VCM']); assert.throws(() => enabledGarages('TODAS'));
});
test('datas invalidas nao recebem fallback historico', () => { assert.throws(() => civil('2026-02-30')); assert.throws(() => civil('')); });
test('03:00 copia integral, novos PKs e identidade logica preservada', async () => {
  const f = await ready(), t = f.tables(); const source = t.itemFolhaCI.filter(i => i.folhaId === 10), copied = t.itemFolhaCI.filter(i => i.folhaId !== 10);
  assert.equal(copied.length, source.length);
  for (const i of source) { const j = copied.find(c => c.chaveItem === i.chaveItem); assert.ok(j); assert.notEqual(j.id, i.id); for (const k of Object.keys(i).filter(k => !['id', 'folhaId', 'createdAt', 'updatedAt'].includes(k))) assert.deepEqual(j[k], i[k]); }
});
test('titulo sem itens e coluna adicional sobrevivem a virada', async () => {
  const f = fixture(true, true);
  await startCycle(f.db, 'VCG', clock()); assert.equal(f.tables().folhaCI[1].tituloColunaAdicional, 'INSPEÇÃO'); assert.equal(f.tables().itemFolhaCI.length, 0);
});
test('reforco FIXO/EXTRA com horario repetido preserva posicoes', async () => {
  const f = await ready(); const items = f.tables().itemFolhaCI.filter(i => i.folhaId !== 10 && i.categoria === 'REFORCO');
  assert.deepEqual(items.map(i => [i.tipoPosicao, i.ordemPosicao, i.horarioReforco]), [['FIXO', 1, '07:40'], ['EXTRA', 1, '07:40']]);
});
test('Controle inicial recebe apenas bloqueados; oficina e liberados vazios', async () => {
  const f = await ready(); assert.equal(f.tables().estadoManutencao.length, 1); const s = f.tables().estadoManutencao[0]; assert.equal(s.bloqueado, true); assert.equal(s.emExecucao, false); assert.equal(s.liberado, false);
});
test('VCM aparece na CI VCG sem conversao de consorciada', async () => {
  const f = await ready(); const ctx = await readContext(f.db, 'VCG', day);
  assert.ok(ctx.ci.some(i => i.data === target && i.prefixo === '3083' && i.consorciada === 'VCM' && i.garagem === 'VCG'));
});
test('03:00 idempotente e criacao unica concorrente', async () => {
  const f = fixture(); await Promise.all([startCycle(f.db, 'VCG', clock()), startCycle(f.db, 'VCG', clock())]);
  assert.equal(f.tables().cicloOperacional.length, 1); assert.equal(f.tables().folhaCI.length, 2);
  const before = f.tables(); assert.equal((await startCycle(f.db, 'VCG', clock())).result, 'ALREADY_DONE'); assert.deepEqual(f.tables(), before);
});
test('20:00 finaliza e repete sem alterar timestamp efetivo', async () => {
  const f = await ready(); assert.equal((await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:00:00Z'))).result, 'FINALIZADA');
  const before = f.tables(); assert.equal((await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:10:00Z'))).result, 'ALREADY_DONE'); assert.deepEqual(f.tables(), before);
});
test('comandos legados respeitam horarios anteriores', async () => {
  const f = fixture(); assert.equal((await startCycle(f.db, 'VCG', clock('2026-10-07T06:59:00Z'))).result, 'NOT_DUE'); assert.equal((await finalizeCycle(f.db, 'VCG', clock())).result, 'NOT_DUE'); assert.equal(f.writes(), 0);
});
test('recovery same-day 20:10 conclui somente evento atual', async () => {
  const f = await ready(), prior = process.env.CI_NOVO_FLUXO_GARAGENS; process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
  try { await startCycle(f.db, 'VCG', clock('2026-10-08T00:10:00Z')); await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:10:00Z')); assert.equal(f.tables().folhaCI[1].status, 'FINALIZADA'); }
  finally { if (prior === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS; else process.env.CI_NOVO_FLUXO_GARAGENS = prior; }
});
test('multi-day cria RECUPERACAO atual vazia sem fabricar historico', async () => {
  const f = fixture(); await startCycle(f.db, 'VCG', clock('2026-10-10T12:00:00Z'));
  const t = f.tables(); assert.equal(t.cicloOperacional.length, 1); assert.equal(t.folhaCI.length, 2); assert.equal(t.folhaCI[1].origem, 'RECUPERACAO'); assert.equal(t.folhaCI[1].folhaOrigemId, null); assert.equal(t.itemFolhaCI.filter(i => i.folhaId !== 10).length, 0);
});
test('VCM nao recebe copia da VCG', async () => { const f = fixture(); await startCycle(f.db, 'VCM', clock()); assert.equal(f.tables().folhaCI[1].origem, 'RECUPERACAO'); assert.equal(f.tables().estadoManutencao.length, 0); });
test('GET ausente e existente nao escreve nem obtem locks de mutacao', async () => {
  const f = fixture(false); assert.equal((await readContext(f.db, 'VCG', day)).folha, null); assert.equal(f.writes(), 0); assert.equal(f.queries.length, 0);
  await startCycle(f.db, 'VCG', clock()); const writes = f.writes(), queries = f.queries.length; await readContext(f.db, 'VCG', day); assert.equal(f.writes(), writes); assert.equal(f.queries.length, queries);
});
test('Controle -> CI atomico aceita VCM fisica e preserva consorciada', async () => {
  const f = await ready(), c = await command(f, 'manutencao'); c.items.push({ id: 'novo', prefixo: '1322', consorciada: 'VCM', data: day, observacao: 'FREIO', bloqueado: true, emExecucao: false, liberado: false } as any);
  await saveC4(f.db, 1, c, 'manutencao', clock()); const ctx = await readContext(f.db, 'VCG', day); assert.ok(ctx.ci.some(i => i.data === target && i.prefixo === '1322' && i.consorciada === 'VCM')); assert.equal(ctx.maintenance.find(s => s.prefixo === '1322')?.bloqueado, true);
});
test('CI -> Controle altera motivo sem alterar outras datas', async () => {
  const f = await ready(), c = await command(f, 'ci'); const source = f.tables().itemFolhaCI.filter(i => i.folhaId === 10); (c.items as any[]).find(i => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'FREIO';
  await saveC4(f.db, 1, c, 'ci', clock()); assert.equal(f.tables().estadoManutencao[0].observacaoBloqueio, 'FREIO'); assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), source);
});
test('coexistencia antiga: remover bloqueio preserva execucao', async () => {
  const f = await ready(); await seedLegacyExecution(f);
  const d = await command(f, 'ci'); d.items = (d.items as any[]).filter(i => i.categoriaPlanilha !== 'BLOQUEADO'); d.removeBlocked = ['3083']; await saveC4(f.db, 1, d, 'ci', clock());
  const s = f.tables().estadoManutencao[0]; assert.equal(s.bloqueado, false); assert.equal(s.emExecucao, true);
});
test('remocao Controle -> CI afeta apenas BLOQUEADO', async () => {
  const f = await ready(), c = await command(f, 'manutencao'); c.items = []; c.removeBlocked = ['3083']; await saveC4(f.db, 1, c, 'manutencao', clock()); assert.equal(f.tables().itemFolhaCI.filter(i => i.folhaId !== 10).length, 4);
});
test('liberacao nao confirmada/cancelada nao persiste nada', async () => {
  const f = await ready(), c = await command(f, 'manutencao'); Object.assign(c.items[0], { bloqueado: false, emExecucao: false, liberado: true }); c.removeBlocked = ['3083']; const before = f.tables();
  await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()), /Confirme/); assert.deepEqual(f.tables(), before);
});
test('liberacao confirmada retira bloqueio e execucao', async () => {
  const f = await ready();
  await seedLegacyExecution(f);
  const c = await command(f, 'manutencao'); Object.assign(c.items[0], { bloqueado: false, emExecucao: false, liberado: true }); c.removeBlocked = ['3083']; c.confirmRelease = true;
  await saveC4(f.db, 1, c, 'manutencao', clock()); const ctx = await readContext(f.db, 'VCG', day); assert.equal(ctx.maintenance[0].liberado, true); assert.equal(ctx.ci.filter(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO').length, 0);
});

for (const execution of [false, true]) test(`baixa confirmada pela CI cria Liberado no Controle; execucao=${execution}`, async () => {
  const f = await ready();
  if (execution) {
    await seedLegacyExecution(f, { observacaoOficina: 'SERVICO' });
  }
  const before = f.tables().itemFolhaCI.filter(i => i.folhaId === 10);
  const c = await command(f, 'ci');
  c.items = (c.items as any[]).filter(i => i.categoriaPlanilha !== 'BLOQUEADO');
  c.removeBlocked = ['3083']; c.confirmRelease = true;
  await saveC4(f.db, 1, JSON.parse(JSON.stringify(c)), 'ci', clock());
  const ctx = await readContext(f.db, 'VCG', day);
  const released = ctx.maintenance.find(i => i.prefixo === '3083')!;
  assert.equal(released.bloqueado, false); assert.equal(released.emExecucao, false); assert.equal(released.liberado, true);
  assert.equal(ctx.ci.filter(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO').length, 0);
  assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), before);
  await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /desatualizado/);
});

test('baixa CI exige intencao explicita de retirada e preserva dados se comando invalido', async () => {
  const f = await ready(), c = await command(f, 'ci'), before = f.tables();
  c.items = (c.items as any[]).filter(i => i.categoriaPlanilha !== 'BLOQUEADO'); c.confirmRelease = true;
  await assert.rejects(saveC4(f.db, 1, c, 'ci', clock())); assert.deepEqual(f.tables(), before);
});

test('somente card BLOQUEADOS VCM usa frota VCM dentro da folha VCG', () => {
  const vehicles = [{ prefixo: '1000', garagemFonte: 1 }, { prefixo: '4000', garagemFonte: 2 }];
  assert.equal(ciEntryGarage('VCG', 'BLOQUEADO', 'VCM'), 'VCM');
  assert.deepEqual(vehiclesForGarage(vehicles, ciEntryGarage('VCG', 'BLOQUEADO', 'VCM') as 'VCM').map(i => i.prefixo), ['1000']);
  for (const [category, subType] of [['BLOQUEADO', 'VCG'], ['BLOQUEADO', 'VSF'], ['OFICINA', 'ELETRICA'], ['PREVENTIVA', 'REVISAO']]) {
    assert.equal(ciEntryGarage('VCG', category, subType), 'VCG');
  }
});
test('BLOQUEADO + LIBERADO e estados duplicados rejeitados', async () => {
  const f = await ready(), c = await command(f, 'manutencao'); (c.items[0] as any).liberado = true; await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()), /Liberado/);
  (c.items[0] as any).liberado = false; c.items.push({ ...c.items[0], id: 'duplicado' } as any); await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()), /duplicado|um estado/);
});
test('segundo BLOQUEADO rejeitado sem deduplicacao', async () => { const f = await ready(), c = await command(f, 'ci'); c.items.push({ ...(c.items as any[])[0], id: 'novo' } as any); await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /Segundo BLOQUEADO/); });
test('CI finalizada imutavel mesmo se relogio voltar para janela', async () => {
  const f = await ready(); await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:00:00Z')); const c = await command(f, 'ci'); const before = f.tables(); await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /indisponivel/); assert.deepEqual(f.tables(), before);
});
test('CI permite apos 20h mas recusa hoje e historico', async () => {
  const f = await ready(), c = await command(f, 'ci'); await saveC4(f.db, 1, c, 'ci', clock('2026-10-08T00:00:00Z'));
  c.data = day; await assert.rejects(saveC4(f.db, 1, { ...c, items: [] }, 'ci', clock()), /consulta/);
});
test('virada da data civil durante transacao provoca rollback integral', async () => {
  const f = await ready(), c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'NOVO'; const before = f.tables(); let calls = 0;
  await assert.rejects(saveC4(f.db, 1, c, 'ci', () => new Date(++calls < 5 ? '2026-10-08T03:59:59Z' : '2026-10-08T04:00:00Z')), /consulta/); assert.deepEqual(f.tables(), before);
});
test('snapshot stale/duplo clique: somente um comando persiste', async () => {
  const f = await ready(), c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'FREIO'; const results = await Promise.allSettled([saveC4(f.db, 1, c, 'ci', clock()), saveC4(f.db, 1, c, 'ci', clock())]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal(results.filter(r => r.status === 'rejected').length, 1);
});

test('dois usuarios com snapshots JSON: conflito preserva vencedor e recarga permite continuar', async () => {
  const f = await ready();
  const first = JSON.parse(JSON.stringify(await command(f, 'ci')));
  const second = JSON.parse(JSON.stringify(await command(f, 'manutencao')));
  first.base = clientRevision(first.items);
  second.base = clientRevision(second.items);
  first.items.find((i: any) => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'USUARIO 1';
  await saveC4(f.db, 1, first, 'ci', clock());
  const committed = f.tables();
  await assert.rejects(saveC4(f.db, 2, second, 'manutencao', clock()), /Snapshot C4 desatualizado/);
  assert.deepEqual(f.tables(), committed);
  const fresh = JSON.parse(JSON.stringify(await command(f, 'manutencao')));
  fresh.base = clientRevision(fresh.items);
  assert.equal(fresh.items[0].observacaoBloqueio, 'USUARIO 1');
  fresh.items[0].emExecucao = true; fresh.items[0].bloqueado = false; fresh.removeBlocked = ['3083'];
  await saveC4(f.db, 2, fresh, 'manutencao', clock());
  const result = await readContext(f.db, 'VCG', day);
  assert.equal(result.maintenance[0].emExecucao, true);
  assert.ok(!result.ci.some(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO'));
});
test('role ADMIN revalidada e locks contem garagem/dia parametrizados', async () => {
  const f = await ready(), c = await command(f, 'ci'); f.role(false); const before = f.tables(); await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /ADMIN/); assert.deepEqual(f.tables(), before);
  assert.ok(f.queries.every(q => q.sql.includes('UPDLOCK, HOLDLOCK') && q.values[0] === 'VCG' && q.values[1] instanceof Date));
});
test('titulo vazio de itens permanece persistido e protegido pela versao', async () => {
  const f = fixture(true, true); await startCycle(f.db, 'VCG', clock()); const c = await command(f, 'ci'); await saveC4(f.db, 1, { ...c, tituloColunaAdicional: 'LUBRIFICAÇÃO' }, 'ci', clock()); assert.equal(f.tables().folhaCI[1].tituloColunaAdicional, 'LUBRIFICAÇÃO'); assert.equal(f.tables().itemFolhaCI.length, 0); await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /desatualizado/);
});
test('data de bloqueio normal ausente/invalida/futura rejeitada', async () => {
  const f = await ready(); for (const value of ['', '2026-02-30', '2026-10-08', '2026-10-09']) { const c = await command(f, 'ci'); (c.items as any[])[0].dataBloqueio = value; await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /Data|Data civil/); }
});
test('sem runtime DDL nem reconciliacao em controllers GET', () => {
  for (const path of ['apps/api/src/services/c4Flow.ts', 'apps/api/src/services/ciLifecycle.ts', 'apps/api/src/controllers/c4.ts', 'apps/api/src/controllers/ciBloqueios.ts', 'apps/api/src/controllers/manutencao.ts']) assert.doesNotMatch(readFileSync(path, 'utf8'), /CREATE\s+TABLE|ALTER\s+TABLE|ensureTable/i);
  const source = readFileSync('apps/api/src/services/mssql.ts', 'utf8'); assert.match(source, /SELECT idCarro, garagem/); assert.match(source, /WHERE ativo=1/);
  const ui = readFileSync('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'utf8'); assert.match(ui, /vehiclesForGarage\(fleetCars, 'VCG'\)/); assert.match(ui, /c4Enabled\('VCG'\) \|\| cons.id !== "VCM"/);
});
test('selecao Garagem 1 usa coluna real e inclui VCM independente do prefixo', () => {
  const vehicles = [{ prefixo: '3083', garagemFonte: 1, consorciada: 'VCM' }, { prefixo: '1322', garagemFonte: 1, consorciada: 'VCM' }, { prefixo: '4178', garagemFonte: 2, consorciada: 'VCG' }];
  assert.deepEqual(vehiclesForGarage(vehicles, 'VCM').map(i => i.prefixo), ['3083', '1322']); assert.equal(vehiclesForGarage(vehicles, 'VCM')[0].consorciada, 'VCM');
});

test('seletor CI VCG usa garagem 2 independentemente de prefixo e consorciada', () => {
  const vehicles = [
    { prefixo: '1342', garagemFonte: 1, consorciada: 'VCM' },
    { prefixo: '2422', garagemFonte: 1, consorciada: 'VSF' },
    ...['VCM', 'VSF', 'JTU', 'VCG'].map((consorciada, n) => ({ prefixo: `${n + 1}001`, garagemFonte: 2, consorciada })),
    { prefixo: '4998', consorciada: 'VCG' },
  ];
  const before = JSON.stringify(vehicles);
  assert.deepEqual(vehiclesForGarage(vehicles, 'VCG').map(i => i.prefixo), ['1001', '2001', '3001', '4001']);
  assert.equal(JSON.stringify(vehicles), before);
});
test('exclusao integral retira coexistencia antiga sem criar liberado e preserva outras datas', async () => {
  const f = await ready(); await seedLegacyExecution(f);
  const before = f.tables();
  const d = await command(f, 'manutencao'); d.items = []; d.removeBlocked = ['3083'];
  await saveC4(f.db, 1, d, 'manutencao', clock());
  assert.equal(f.tables().estadoManutencao.length, 0);
  const targetId = before.folhaCI.find(i => i.dataFolha.getTime() === dateValue(target).getTime())!.id;
  assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId !== targetId), before.itemFolhaCI.filter(i => i.folhaId !== targetId));
  assert.equal(f.tables().itemFolhaCI.filter(i => i.folhaId === targetId && i.categoria === 'BLOQUEADO').length, 0);
});

test('retirada parcial de bloqueio continua preservando execucao sem liberacao confirmada', async () => {
  const f = await ready(); await seedLegacyExecution(f);
  const d = await command(f, 'manutencao');
  (d.items as any[]).forEach(i => { i.bloqueado = false; i.emExecucao = false; i.liberado = false; });
  d.removeBlocked = ['3083']; const before = f.tables();
  await assert.rejects(saveC4(f.db, 1, d, 'manutencao', clock()), /preserva execucao/);
  assert.deepEqual(f.tables(), before);
});

test('posicao EXTRA positiva esparsa aceita, FIXO13 rejeitado', async () => {
  const f = await ready(), c = await command(f, 'ci'); const extra = (c.items as any[]).find(i => i.tipoPosicao === 'EXTRA'); extra.ordemPosicao = 1000; await saveC4(f.db, 1, c, 'ci', clock());
  const d = await command(f, 'ci'); (d.items as any[]).find(i => i.tipoPosicao === 'FIXO').ordemPosicao = 13; await assert.rejects(saveC4(f.db, 1, d, 'ci', clock()), /Posicao/);
});
test('mudanca de data original torna conteudo stale verificavel no cliente', async () => {
  const f = await ready(), c = await command(f, 'ci'); const before = c.base; (c.items as any[])[0].dataBloqueio = '2026-10-02'; assert.notEqual(revision(c.items), before);
});
test('falha apos gravar CI desfaz CI e Controle juntos', async () => {
  const f = await ready(), c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'NOVO'; const before = f.tables();
  f.db.estadoManutencao.update = async () => { throw new Error('falha simulada'); };
  await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /falha simulada/); assert.deepEqual(f.tables(), before);
});
test('editar observacao em coexistencia antiga preserva fotografia e motivo do bloqueio', async () => {
  const f = await ready(); await seedLegacyExecution(f); const c = await command(f, 'manutencao'); const before = f.tables().itemFolhaCI;
  Object.assign(c.items[0], { emExecucao: true, observacaoOficina: 'SERVICO NA OFICINA' }); await saveC4(f.db, 1, c, 'manutencao', clock());
  assert.deepEqual(f.tables().itemFolhaCI, before); assert.equal(f.tables().estadoManutencao[0].observacaoBloqueio, 'MOTOR'); assert.equal(f.tables().estadoManutencao[0].observacaoOficina, 'SERVICO NA OFICINA');
});
test('finalizacao concorrente impede comando posterior com snapshot stale', async () => {
  const f = await ready(), c = await command(f, 'ci'); const result = await Promise.allSettled([finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:00:00Z')), saveC4(f.db, 1, c, 'ci', clock())]);
  assert.equal(result[0].status, 'fulfilled'); assert.equal(result[1].status, 'rejected'); assert.equal(f.tables().folhaCI[1].status, 'FINALIZADA');
});
test('snapshot C4 precisa de versao do cabecalho mesmo quando vazio', async () => {
  const f = fixture(true, true); await startCycle(f.db, 'VCG', clock()); const c = await command(f, 'ci'); await assert.rejects(saveC4(f.db, 1, { ...c, baseC4: '' }, 'ci', clock()), /desatualizado/);
});
test('Garagem distinta no payload rejeitada sem contaminar outra folha', async () => {
  const f = await ready(), c = await command(f, 'ci'); const before = f.tables(); (c.items as any[])[0].garagem = 'VCM'; await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /fora da folha/); assert.deepEqual(f.tables(), before);
});
test('roteamento ativado nunca cai no legado nem interpreta VCM como escritor VCG', () => {
  assert.equal(mutationMode('VCG', ['VCG']), 'C4'); assert.throws(() => mutationMode('VCM', ['VCG']), /nao habilitado/); assert.throws(() => mutationMode(undefined, ['VCG']), /explicitamente/);
  assert.equal(mutationMode('VCG', []), 'LEGADO'); assert.throws(() => mutationMode('VCM', [])); assert.equal(mutationMode('VCM', ['VCM']), 'C4');
});

test('recovery 03:20 copia somente a folha atual e estrutura parcial recusa reparo', async () => {
  const f = fixture(); await startCycle(f.db, 'VCG', clock('2026-10-07T07:20:00Z'));
  assert.equal(f.tables().folhaCI[1].origem, 'NORMAL');
  assert.equal(dateValue(target).getTime(), f.tables().folhaCI[1].dataFolha.getTime());
  await f.db.folhaCI.delete({ where: { id: f.tables().folhaCI[1].id } });
  const before = f.tables(), writes = f.writes();
  await assert.rejects(startCycle(f.db, 'VCG', clock()), /parcial/);
  assert.deepEqual(f.tables(), before); assert.equal(f.writes(), writes);
});

test('release concorrente com inclusao usa snapshot comum: apenas um comando vence', async () => {
  const f = await ready(), release = await command(f, 'manutencao'), inclusion = await command(f, 'ci');
  const state = (release.items as any[])[0]; state.bloqueado = false; state.liberado = true;
  release.removeBlocked = ['3083']; release.confirmRelease = true;
  (inclusion.items as any[]).push({ ...(inclusion.items as any[])[0], id: 'novo', prefixo: '1322' });
  const results = await Promise.allSettled([saveC4(f.db, 1, release, 'manutencao', clock()), saveC4(f.db, 1, inclusion, 'ci', clock())]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].liberado, true); assert.equal(ctx.ci.filter(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO').length, 0);
});

test('manager CI preserva TODAS no legado e erro C4 sem fallback', async () => {
  const loader = (Module as any)._load;
  const calls: { url: string; params: any }[] = [];
  let mode = 'LEGADO', fail = false;
  const api = {
    get: async (url: string, options: any) => {
      calls.push({ url, params: options?.params });
      if (url === '/c4/contexto') {
        if (fail) throw new Error('C4 indisponivel');
        return { mode, garagem: options.params.garagem, day: options.params.data, baseC4: 'snapshot-test', garages: mode === 'C4' ? ['VCG', 'VCM'] : [], ci: [], maintenance: [] };
      }
      return [];
    },
    listCiBloqueios: async (params: any) => { calls.push({ url: '/ci-bloqueios', params }); return []; },
  };
  let ci: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '@/lib/api' || (request === './api' && parent.filename.endsWith(path.join('lib', 'c4.ts')))) return { api };
      return loader.call(this, request.startsWith('@/') ? path.resolve('apps/web/src', request.slice(2) + '.ts') : request, parent, main);
    };
    ci = require('../../web/src/pages/soltura/ciManager');
  } finally { (Module as any)._load = loader; }
  const previousWindow = (globalThis as any).window, previousStorage = (globalThis as any).localStorage, previousEvent = (globalThis as any).CustomEvent;
  Object.assign(globalThis, { window: { dispatchEvent: () => true }, localStorage: { setItem: () => undefined }, CustomEvent: class { constructor(public name: string, public options: unknown) {} } });
  try {
    await ci.fetchCIBloqueiosFromApi({ garagem: 'TODAS' });
    assert.equal(require('../../web/src/lib/c4').c4Configured(), false);
    assert.equal(calls.find(c => c.url === '/ci-bloqueios')!.params.garagem, undefined);
    calls.length = 0; mode = 'C4';
    await ci.fetchCIBloqueiosFromApi({ garagem: 'VCM', data: addDays(day, 1) });
    assert.equal(require('../../web/src/lib/c4').c4Configured(), true);
    assert.deepEqual(calls, [{ url: '/c4/contexto', params: { garagem: 'VCM', data: day } }]);
    calls.length = 0; fail = true;
    await assert.rejects(ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' }), /indisponivel/);
    assert.equal(calls.length, 1); assert.equal(calls[0].url, '/c4/contexto');
  } finally { Object.assign(globalThis, { window: previousWindow, localStorage: previousStorage, CustomEvent: previousEvent }); }
});

test('controllers recusam escopo invalido e override legado que atingiria garagem C4', async () => {
  const loader = (Module as any)._load, prior = process.env.CI_NOVO_FLUXO_GARAGENS;
  let legacyReads = 0;
  const legacy = { findMany: async () => { legacyReads++; return []; } };
  const db = { ciBloqueio: legacy, manutencaoCarro: legacy,
    user: { findUnique: async () => ({ role: 'COLABORADOR', garagem: 'VCG', email: '' }) },
    $transaction: async () => { throw new Error('C4 indisponivel'); } };
  let ci: any, maintenance: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '../utils/prisma') return { __esModule: true, default: db };
      return loader.call(this, request, parent, main);
    };
    ci = require('../src/controllers/ciBloqueios'); maintenance = require('../src/controllers/manutencao');
  } finally { (Module as any)._load = loader; }
  try {
    process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
    for (const controller of [ci, maintenance]) for (const scope of ['vcg', 'VCM', 'VCG']) {
      const res: any = { code: 200, status(code: number) { this.code = code; return this; }, json(value: unknown) { this.body = value; return this; } };
      await controller.list({ query: { garagem: scope, data: day }, userId: 1 }, res);
      assert.equal(res.code, scope === 'VCG' ? 500 : 400);
      assert.equal(legacyReads, 0);
    }
    process.env.CI_NOVO_FLUXO_GARAGENS = '';
    const res: any = { code: 200, status(code: number) { this.code = code; return this; }, json() { return this; } };
    await maintenance.list({ query: { data: day }, userId: 1 }, res);
    assert.equal(res.code, 200); assert.equal(legacyReads, 1);
  } finally { if (prior === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS; else process.env.CI_NOVO_FLUXO_GARAGENS = prior; }
});


test('NULL de oficina nao e preenchido pelo motivo conhecido do bloqueio coexistente', async () => {
  const f = await ready(); await seedLegacyExecution(f); const c = await command(f, 'manutencao');
  const state = (c.items as any[])[0];
  state.emExecucao = true; state.observacaoOficina = null;
  assert.equal(state.observacao, 'MOTOR');
  await saveC4(f.db, 1, c, 'manutencao', clock());
  const ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].observacaoBloqueio, 'MOTOR');
  assert.equal(ctx.maintenance[0].observacaoOficina, null);
  const before = f.tables();
  await saveC4(f.db, 1, await command(f, 'manutencao'), 'manutencao', clock());
  assert.deepEqual(f.tables(), before);
});

for (const kind of ['ci', 'manutencao'] as const) test('oficina VCG pode gravar ' + kind + ' sem ADMIN e historico intacto', async () => {
 const f = await ready(); f.identity({ role: 'manutencao', garagem: 'VCG' });
 const history = f.tables().itemFolhaCI.filter(i => i.folhaId === 10);
 const c = await command(f, kind);
 if(kind === 'ci') (c.items as any[])[0].motivo = 'REGISTRO REAL OFICINA';
 else (c.items as any[])[0].observacaoBloqueio = 'REGISTRO REAL OFICINA';
 await saveC4(f.db, 1, c, kind, clock());
 assert.ok(f.tables().itemFolhaCI.some(i => i.folhaId !== 10 && i.motivo === 'REGISTRO REAL OFICINA'));
 assert.ok(f.tables().estadoManutencao.some(i => i.observacaoBloqueio === 'REGISTRO REAL OFICINA'));

 assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), history);
 for (const identity of [{role:'manutencao', garagem:'VCM'}, {role:'manutencao', email:'manutencao_vcg@teste.com'}, {role:'COLABORADOR', garagem:'VCG'}, {role:'soltura', garagem:'VCG'}]) {
  f.identity(identity); const before=f.tables(); await assert.rejects(saveC4(f.db,1,c,kind,clock()), /ADMIN/); assert.deepEqual(f.tables(),before);
 }
 f.identity({role:'manutencao',garagem:'VCG'});
 await assert.rejects(saveC4(f.db,1,c,kind,clock('2026-10-08T04:00:00Z')), /consulta|somente hoje|Janela/);
 await finalizeCycle(f.db,'VCG',clock('2026-10-08T00:00:00Z'));
 await assert.rejects(saveC4(f.db,1,c,kind,clock()), /preparacao|desatualizado/);
});
test('autorizacao C4 frontend/backend equivalente e leitura isolada', async () => {
 const server=require('../src/services/c4Authorization'); const client=require('../../web/src/lib/c4Authorization');
 for(const role of ['ADMIN','manutencao','COLABORADOR','soltura']) for(const garagem of ['VCG','VCM',null]) for(const scope of ['VCG','VCM']) {
  assert.equal(client.canWriteC4({role,garagem},scope),server.canWriteC4({role,garagem},scope));
 }
 const db:any={user:{findUnique:async()=>({role:'manutencao',garagem:'VCG'})}};
 await server.assertC4Read(db,1,'VCG'); await assert.rejects(server.assertC4Read(db,1,'VCM'), /garagem/); await assert.rejects(server.assertC4Read(db,undefined,'VCG'), /garagem/);
});

test('manutencao VCM edita CI VCM sem permitir escrita pelo usuario VCG', async () => {
 const f = fixture();
 await f.db.folhaCI.update({ where: { id: 10 }, data: { garagem: 'VCM' } });
 await startCycle(f.db, 'VCM', clock());
 f.identity({ role: 'manutencao', garagem: 'VCM' });
 const ctx = await readContext(f.db, 'VCM', day, clock(), 1);
 const items = structuredClone(ctx.ci.filter(i => i.data === target));
 const c = { garagem: 'VCM', data: target, base: revision(items), baseC4: ctx.baseC4, items, removeBlocked: [], confirmRelease: false };
 items[0].motivo = 'Defeito informado pela manutencao VCM';
 await saveC4(f.db, 1, c, 'ci', clock());
 assert.ok(f.tables().itemFolhaCI.some(i => i.folhaId !== 10 && i.motivo === items[0].motivo));
 f.identity({ role: 'manutencao', garagem: 'VCG' });
 const before = f.tables();
 await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), (e: any) => e.status === 403);
 assert.deepEqual(f.tables(), before);
});

test('administracao de usuarios exige role ADMIN sem permissao de grupo alternativa', () => {
 const source=require('node:fs').readFileSync(path.resolve('apps/api/src/routes/index.ts'),'utf8');
 const routes=source.split('\n').filter(line=>line.includes('"/users'));
 assert.equal(routes.length,4); assert.ok(routes.every(line=>line.includes('requireRole("ADMIN")')));
});

test('C4 18h30 e 19h59 permitem gravacao; scheduler aguarda 20h; legado permanece fechado', async () => {
 for(const time of ['2026-10-07T07:00:00Z','2026-10-07T22:30:00Z','2026-10-07T23:59:59Z']) {
  const f=await ready(); const c=await command(f,'ci'); (c.items as any[])[0].motivo='HORA '+time;
  await saveC4(f.db,1,c,'ci',clock(time));
  assert.equal((await finalizeCycle(f.db,'VCG',clock(time))).result,'NOT_DUE');
  assert.equal(f.tables().folhaCI[1].status,'EM_PREPARACAO');
 }
 assert.equal(nextEvent(new Date('2026-10-07T22:30:00Z')).toISOString(),'2026-10-08T00:00:00.000Z');
 assert.equal(require('../src/services/mvpTemporal').operationalContext(new Date('2026-10-07T22:30:00Z')).open,false);
 assert.equal(operationalContext(new Date('2026-10-07T22:30:00Z')).open,true);
});

test('data inicial C4 e sempre amanha no calendario Campo Grande', () => {
 const {initialCIDate}=require('../../web/src/lib/ciInitialDate');
 for(const [instant,date] of [
 ['2026-10-09T06:59:00Z','2026-10-10'],['2026-10-09T07:00:00Z','2026-10-10'],
 ['2026-10-09T23:59:00Z','2026-10-10'],['2026-10-10T00:00:00Z','2026-10-10'],
 ['2026-10-10T03:59:00Z','2026-10-10'],['2026-10-10T04:00:00Z','2026-10-11'],
 ['2026-10-10T06:59:00Z','2026-10-11'],['2026-10-10T07:00:00Z','2026-10-11'],
 ['2026-10-31T07:00:00Z','2026-11-01'],['2026-12-31T07:00:00Z','2027-01-01'],
 ['2026-12-25T07:00:00Z','2026-12-26'],['2026-10-11T07:00:00Z','2026-10-12']]) {
 assert.equal(initialCIDate(new Date(instant)),date);
 assert.equal(initialCIDate(new Date(instant)),date);
 }
});

test('selecao manual CI nao e controlada pelo clock nem por persistencia local', () => {
 const source=readFileSync(path.resolve('apps/web/src/pages/soltura/index.tsx'),'utf8');
 assert.ok(source.includes('}, [isCIView, garagem, ciC4Enabled]);'));
 assert.ok(source.includes('ciDateContext.current = null;'));
 assert.ok(source.includes('setDataOperacao={chooseCIDate}'));
 assert.ok(!source.includes('updateDataOperacao(initialCIDate())'));
 const {operationalContext:frontend}=require('../../web/src/lib/mvpTemporal');
 assert.equal(frontend(new Date('2026-10-09T23:59:00Z'),72000).open,true);
 assert.equal(frontend(new Date('2026-10-10T00:00:00Z'),72000).open,false);
 assert.equal(frontend(new Date('2026-10-09T22:30:00Z')).open,false);
});

test('finalizada pela versao anterior as 18h30 nao reabre as 19h', async () => {
 const f=await ready(); const row=f.tables().folhaCI[1];
 await f.db.folhaCI.update({where:{id:row.id},data:{status:'FINALIZADA',finalizadaEm:new Date('2026-10-07T22:30:00Z')}});
 const before=f.tables(); const c=await command(f,'ci');
 await assert.rejects(saveC4(f.db,1,c,'ci',clock('2026-10-07T23:00:00Z')), /preparacao/);
 assert.equal((await startCycle(f.db,'VCG',clock('2026-10-07T23:00:00Z'))).result,'ALREADY_DONE');
 assert.deepEqual(f.tables(),before);
});

test('frontend CI C4 usa data civil; janelas da manutencao e legado nao mudam', () => {
 const RealDate=Date; const {canMutate}=require('../../web/src/lib/mvpTemporal');
 try {
  for(const [instant,open] of [['2026-10-09T06:59:00Z',true],['2026-10-09T07:00:00Z',true],['2026-10-09T22:30:00Z',true],['2026-10-09T23:59:59Z',true],['2026-10-10T00:00:00Z',true]]) {
   globalThis.Date=class extends RealDate { constructor(value?:any){super(value===undefined?instant:value);} } as DateConstructor;
   assert.equal(canMutate('2026-10-10','ci',true),open);
   assert.equal(canMutate('2026-10-09','manutencao',true), !['2026-10-09T06:59:00Z','2026-10-10T00:00:00Z'].includes(instant));
   if(instant==='2026-10-09T22:30:00Z') assert.equal(canMutate('2026-10-10','ci'),false);
  }
 } finally {globalThis.Date=RealDate;}
 const source=readFileSync(path.resolve('apps/web/src/pages/soltura/CiManutencaoView.tsx'),'utf8');
 assert.ok(source.includes('c4Mutable(target, scope)'));
});


test('navegacao CI preserva escolha manual, isola outras datas e recalcula na entrada', () => {
 const {ciSelectionDate}=require('../../web/src/lib/ciInitialDate');
 const at=(iso:string)=>new Date(iso);
 let selected:string|null=null;
 const dispatchDate='2026-10-08';
 selected=ciSelectionDate(selected,true,at('2026-10-09T23:59:00Z'));
 assert.equal(selected,'2026-10-10');
 for(const instant of ['2026-10-10T00:00:00Z','2026-10-10T04:00:00Z','2026-10-10T07:00:00Z']) {
  assert.equal(ciSelectionDate(selected,true,at(instant)),'2026-10-10');
 }
 selected='2026-10-01';
 assert.equal(ciSelectionDate(selected,true,at('2026-10-10T07:00:00Z')),'2026-10-01');
 assert.equal(dispatchDate,'2026-10-08');
 // Saida da CI e recarga descartam somente a preferencia dessa tela.
 selected=null;
 assert.equal(ciSelectionDate(selected,true,at('2026-10-10T06:59:00Z')),'2026-10-11');
 assert.equal(ciSelectionDate(selected,true,at('2026-10-10T07:00:00Z')),'2026-10-11');
 assert.equal(ciSelectionDate(null,false,at('2026-10-10T03:59:00Z')),'2026-10-09');
});

test('janela frontend e especifica por garagem sem estender legado', () => {
 const client=require('../../web/src/lib/c4');
 const instant=new Date('2026-10-09T23:00:00Z');
 const day='2026-10-09';
 const previousVCG=client.c4Context('VCG',day), previousVCM=client.c4Context('VCM',day);
 try {
  for(const enabled of ['VCG','VCM']) {
   for(const garagem of ['VCG','VCM']) client.storeC4Context({garagem,mode:garagem===enabled?'C4':'LEGADO'},day);
   assert.equal(client.c4OperationalContext(enabled,instant).open,true);
   assert.equal(client.c4OperationalContext(enabled==='VCG'?'VCM':'VCG',instant).open,false);
   assert.equal(client.c4OperationalContext(enabled,new Date('2026-10-10T00:00:00Z')).open,false);
  }
 } finally {
  client.storeC4Context(previousVCG??{garagem:'VCG',mode:'LEGADO'},day);
  client.storeC4Context(previousVCM??{garagem:'VCM',mode:'LEGADO'},day);
 }
});


test('inicializacao CI reinicia por garagem, preserva manual e responde ao contexto carregado', () => {
 const source=readFileSync(path.resolve('apps/web/src/pages/soltura/index.tsx'),'utf8');
 // Executa o proprio callback da tela sem montar API, DOM ou banco.
 const body=source.match(/const ciC4Enabled =[^\n]+;\s*useEffect\(\(\) => \{([\s\S]*?)\}, \[isCIView, garagem, ciC4Enabled\]\);/)?.[1];
 assert.ok(body);
 const effect=new Function('isCIView','garagem','ciC4Enabled','ciDateContext','ciDateManual','setCIDate','ciSelectionDate','getHojeLocal',body!);
 const context={current:null as null|{garagem:string;c4:boolean}}, manual={current:false};
 let selected:string|null=null;
 const run=(garage:string,c4:boolean,active=true)=>effect(active,garage,c4,context,manual,(date:string|null)=>{selected=date;},()=> '2026-10-10',()=> '2026-10-09');
 run('VCG',true); assert.equal(selected,'2026-10-10');
 selected='2026-10-01'; manual.current=true;
 run('VCG',true); assert.equal(selected,'2026-10-01');
 run('VCM',false); assert.equal(selected,'2026-10-09'); assert.equal(manual.current,false);
 run('VCG',true); assert.equal(selected,'2026-10-10');
 run('VCG',true,false); assert.equal(selected,null);
 run('VCG',false); assert.equal(selected,'2026-10-09');
 run('VCG',true); assert.equal(selected,'2026-10-10');
 selected='2026-10-02'; manual.current=true;
 run('VCG',false); assert.equal(selected,'2026-10-02');
 run('VCG',true); assert.equal(selected,'2026-10-02');
 assert.ok(source.includes('ciDateContext.current?.garagem === garagem && ciDate'));
});


test('CI preserva modo conhecido durante ausencia de contexto na meia-noite', () => {
 const source=readFileSync(path.resolve('apps/web/src/pages/soltura/index.tsx'),'utf8');
 const expression=source.match(/const ciC4Enabled = ([^;]+);/)?.[1];
 assert.ok(expression);
 const resolve=new Function('ciMode','ciDateContext','garagem','return '+expression);
 const previous={current:{garagem:'VCG',c4:true}};
 assert.equal(resolve(undefined,previous,'VCG'),true);
 assert.equal(resolve('LEGADO',previous,'VCG'),false);
 assert.equal(resolve(undefined,previous,'VCM'),false);
 assert.equal(resolve('C4',previous,'VCM'),true);
});


test('realtime: save CI e Controle notificam somente apos commit e com payload minimo', async () => {
  const f = await ready(); let committed = false;
  const original = f.db.$transaction;
  f.db.$transaction = async (...args: any[]) => { committed = false; const result = await original(...args); committed = true; return result; };
  const events: C4Updated[] = [];
  const stop = subscribeC4Updates(event => { assert.equal(committed, true); events.push(event); });
  try {
    const c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'ALTERADO';
    await saveC4(f.db, 1, c, 'ci', clock());
    assert.deepEqual(events, [{ garagem: 'VCG', dataOperacional: day, dataFolha: target }]);
    const m = await command(f, 'manutencao'); Object.assign(m.items[0], { emExecucao: true, bloqueado: false }); m.removeBlocked = ['3083'];
    await saveC4(f.db, 1, m, 'manutencao', clock()); assert.equal(events.length, 2);
  } finally { stop(); }
});

test('realtime: save sem mudanca e prepare nao notificam', async () => {
  const f = await ready(), events: C4Updated[] = [];
  // O fake nao aplica defaults NULL do SQL; estabelecer a representacao persistida antes do no-op.
  await saveC4(f.db, 1, await command(f, 'manutencao'), 'manutencao', clock());
  const stop = subscribeC4Updates(event => { events.push(event); });
  try {
    for (const kind of ['ci', 'manutencao'] as const) {
      await saveC4(f.db, 1, await command(f, kind), kind, clock());
      assert.equal(events.length, 0, kind);
    }
    const c = await command(f, 'ci'); await saveC4(f.db, 1, { ...c, operation: 'prepare', items: [] }, 'ci', clock());
    assert.equal(events.length, 0);
  } finally { stop(); }
});

test('realtime: conflito 409 e rollback apos escrita nao notificam', async () => {
  const f = await ready(), events: C4Updated[] = [];
  const stop = subscribeC4Updates(event => { events.push(event); });
  try {
    const c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'ALTERADO';
    await assert.rejects(saveC4(f.db, 1, { ...c, baseC4: 'stale' }, 'ci', clock()), error => (error as any).status === 409);
    const before = f.tables(), original = f.db.$transaction;
    f.db.$transaction = (fn: any, options: any) => original(async (tx: any) => { await fn(tx); throw Error('COMMIT_FAILED'); }, options);
    await assert.rejects(saveC4(f.db, 1, c, 'ci', clock()), /COMMIT_FAILED/);
    assert.deepEqual(f.tables(), before); assert.equal(events.length, 0);
  } finally { stop(); }
});

test('realtime: inicio e finalizacao notificam uma vez; NOT_DUE e ALREADY_DONE nao notificam', async () => {
  const f = fixture(), events: C4Updated[] = [];
  const stop = subscribeC4Updates(event => { events.push(event); });
  try {
    await startCycle(f.db, 'VCG', clock('2026-10-07T06:00:00Z')); assert.equal(events.length, 0);
    await startCycle(f.db, 'VCG', clock()); assert.equal(events.length, 1);
    await startCycle(f.db, 'VCG', clock()); assert.equal(events.length, 1);
    await finalizeCycle(f.db, 'VCG', clock()); assert.equal(events.length, 1);
    await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:00:00Z')); assert.equal(events.length, 2);
    await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:00:00Z')); assert.equal(events.length, 2);
  } finally { stop(); }
});

test('realtime: emissor indisponivel nao transforma commit em erro', async t => {
  const f = await ready(), c = await command(f, 'ci'); (c.items as any[])[0].motivo = 'SALVO';
  t.mock.method(console, 'warn', () => undefined);
  const stop = subscribeC4Updates(async () => { throw Error('TRANSPORT_FAILED'); });
  try { await saveC4(f.db, 1, c, 'ci', clock()); }
  finally { stop(); }
  assert.equal((await readContext(f.db, 'VCG', day)).ci.find(i => i.id === (c.items as any[])[0].id)!.motivo, 'SALVO');
});

test('realtime: comandos legados idempotentes notificam somente alteracoes efetivas', async () => {
  const f = fixture(), events: C4Updated[] = [], previous = process.env.CI_NOVO_FLUXO_GARAGENS;
  process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
  const stop = subscribeC4Updates(event => { events.push(event); });
  try {
    await startCycle(f.db, 'VCG', clock('2026-10-08T00:30:00Z')); await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:30:00Z'));
    assert.equal(events.length, 2); assert.equal(f.tables().folhaCI[1].status, 'FINALIZADA');
    await startCycle(f.db, 'VCG', clock('2026-10-08T00:31:00Z')); await finalizeCycle(f.db, 'VCG', clock('2026-10-08T00:31:00Z'));
    assert.equal(events.length, 2);
  } finally {
    stop(); if (previous === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS; else process.env.CI_NOVO_FLUXO_GARAGENS = previous;
  }
});

test('19/10: entrar em manutencao retira bloqueio da CI D+1 e bloquear novamente tira da execucao', async () => {
  const f = await ready(), before = f.tables();
  const c = await command(f, 'manutencao');
  Object.assign(c.items[0], { bloqueado: false, emExecucao: true, liberado: false }); c.removeBlocked = ['3083'];
  await saveC4(f.db, 1, c, 'manutencao', clock());
  let ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].bloqueado, false); assert.equal(ctx.maintenance[0].emExecucao, true);
  assert.ok(!ctx.ci.some(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO' && i.prefixo === '3083'));
  assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), before.itemFolhaCI.filter(i => i.folhaId === 10));
  const reblock = await command(f, 'manutencao'); Object.assign(reblock.items[0], { bloqueado: true, emExecucao: false, liberado: false, observacaoBloqueio: 'FREIO' });
  await saveC4(f.db, 1, reblock, 'manutencao', clock());
  ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].bloqueado, true); assert.equal(ctx.maintenance[0].emExecucao, false);
  assert.equal(ctx.ci.filter(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO' && i.prefixo === '3083').length, 1);
});

test('19/10: API recusa nova coexistencia e desfaz falha ao remover bloqueio na CI', async () => {
  const f = await ready(), c = await command(f, 'manutencao'), before = f.tables();
  Object.assign(c.items[0], { emExecucao: true });
  await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()), /somente um estado/);
  assert.deepEqual(f.tables(), before);
  Object.assign(c.items[0], { bloqueado: false }); c.removeBlocked = ['3083'];
  f.db.itemFolhaCI.delete = async () => { throw Error('falha ao retirar bloqueio'); };
  await assert.rejects(saveC4(f.db, 1, c, 'manutencao', clock()), /falha ao retirar/);
  assert.deepEqual(f.tables(), before);
});

test('19/10: liberar e depois bloquear sai de liberados e recria bloqueio na CI', async () => {
  const f = await ready(), c = await command(f, 'manutencao');
  Object.assign(c.items[0], { bloqueado: false, emExecucao: false, liberado: true }); c.removeBlocked = ['3083']; c.confirmRelease = true;
  await saveC4(f.db, 1, c, 'manutencao', clock());
  const block = await command(f, 'manutencao'); Object.assign(block.items[0], { bloqueado: true, emExecucao: false, liberado: false });
  await saveC4(f.db, 1, block, 'manutencao', clock());
  const ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].liberado, false); assert.equal(ctx.maintenance[0].bloqueado, true);
  assert.ok(ctx.ci.some(i => i.data === target && i.categoriaPlanilha === 'BLOQUEADO' && i.prefixo === '3083'));
});

test('19/10: novo bloqueio incluido pela CI encerra execucao no Controle', async () => {
  const f = await ready(), c = await command(f, 'manutencao');
  Object.assign(c.items[0], { bloqueado: false, emExecucao: true, liberado: false }); c.removeBlocked = ['3083'];
  await saveC4(f.db, 1, c, 'manutencao', clock());
  const ci = await command(f, 'ci');
  (ci.items as any[]).push({ id: 'novo-bloqueio', prefixo: '3083', consorciada: 'VCM', garagem: 'VCG', data: target, categoriaPlanilha: 'BLOQUEADO', dataBloqueio: day, motivo: 'MOTOR' });
  await saveC4(f.db, 1, ci, 'ci', clock());
  const ctx = await readContext(f.db, 'VCG', day);
  assert.equal(ctx.maintenance[0].bloqueado, true); assert.equal(ctx.maintenance[0].emExecucao, false);
});

const manualContext = (f: ReturnType<typeof fixture>, date = target, now = clock()) => readContext(f.db, 'VCG', addDays(date, -1), now);
async function manual(f: ReturnType<typeof fixture>, date: string, operacao: 'iniciar' | 'finalizar' | 'reabrir' | 'regularizar', now = clock()) {
 const c = await manualContext(f, date, now);
 return changeCILifecycle(f.db, 1, { garagem: 'VCG', data: date, operacao, baseC4: c.baseC4 }, now, ['VCG']);
}
async function manualSave(f: ReturnType<typeof fixture>, kind: 'ci' | 'manutencao', date: string, edit: (items: any[]) => void, now = clock()) {
 const c = await manualContext(f, kind === 'ci' ? date : addDays(date, 1), now);
 const original = kind === 'ci' ? c.ci.filter(i => i.data === date) : c.maintenance;
 const items = structuredClone(original); edit(items);
 return saveC4(f.db, 1, { garagem: 'VCG', data: date, baseC4: c.baseC4, base: revision(original), items }, kind, now);
}
test('manual: inicia copiando toda CI anterior, sem materializar manutencao em GET', async () => {
 const f = fixture(), before = f.tables();
 await manual(f, target, 'iniciar');
 const copied = f.tables().itemFolhaCI.filter(i => i.folhaId !== 10);
 assert.equal(copied.length, before.itemFolhaCI.length);
 for (const old of before.itemFolhaCI) assert.ok(copied.some(i => i.chaveItem === old.chaveItem && i.categoria === old.categoria && i.prefixo === old.prefixo));
 assert.equal(f.tables().estadoManutencao.length, 0);
 const writes = f.writes(), c = await manualContext(f);
 assert.equal(c.maintenance.length, 1); assert.equal(c.mutable, true); assert.equal(c.ciMutable, true);
 assert.equal(f.writes(), writes);
});
test('manual: proxima exige anterior finalizada e nao altera manutencao de hoje', async () => {
 const f = fixture(); await manual(f, target, 'iniciar');
 const before = f.tables(); await assert.rejects(manual(f, '2026-10-09', 'iniciar'), /Finalize/); assert.deepEqual(f.tables(), before);
 await manual(f, target, 'finalizar'); await manual(f, '2026-10-09', 'iniciar');
 const today = await manualContext(f);
 await manualSave(f, 'ci', '2026-10-09', items => { items.find(i => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'FUTURO'; });
 assert.deepEqual((await manualContext(f)).maintenance, today.maintenance);
 assert.equal(f.tables().estadoManutencao.length, 0);
});
test('manual: reabre e finaliza novamente antes da proxima; depois recusa reabertura', async () => {
 const f = fixture(); await manual(f, target, 'iniciar'); await manual(f, target, 'finalizar');
 await manual(f, target, 'reabrir'); await manualSave(f, 'ci', target, items => { items.find(i => i.categoriaPlanilha === 'PREVENTIVA').os = 'REVISTO'; });
 await manual(f, target, 'finalizar'); await manual(f, '2026-10-09', 'iniciar');
 const before = f.tables(); await assert.rejects(manual(f, target, 'reabrir'), /proxima/); assert.deepEqual(f.tables(), before);
});
test('manual: hoje e historico nao podem iniciar ou reabrir', async () => {
 const f = fixture();
 for (const date of [day, '2026-10-06']) for (const operacao of ['iniciar', 'reabrir'] as const) await assert.rejects(manual(f, date, operacao), /consulta/);
 assert.equal(f.writes(), 0);
});
test('manual: primeiro comando materializa bloqueados na manutencao e mantem dados novos', async () => {
 const f = fixture(); await manual(f, target, 'iniciar');
 await manualSave(f, 'manutencao', day, items => { items.push({ id: 'new', prefixo: '4200', consorciada: 'VCG', data: day, bloqueado: false, emExecucao: true, liberado: false, observacaoOficina: 'FREIO' }); });
 const c = await manualContext(f); assert.equal(c.maintenance.length, 2); assert.ok(c.maintenance.every(i => !i.id.includes('--')));
 assert.ok(c.maintenance.find(i => i.prefixo === '3083')?.bloqueado);
 assert.equal(c.maintenance.find(i => i.prefixo === '4200')?.observacaoOficina, 'FREIO');
});
test('manual: CI de amanha sincroniza; CI finalizada impede apenas alteracoes de bloqueios', async () => {
 const f = fixture(); await manual(f, target, 'iniciar');
 await manualSave(f, 'ci', target, items => { items.find(i => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'MOTOR NOVO'; });
 assert.equal((await manualContext(f)).maintenance[0].observacaoBloqueio, 'MOTOR NOVO');
 await manual(f, target, 'finalizar');
 const before = f.tables(); await assert.rejects(manualSave(f, 'manutencao', day, items => { items[0].observacaoBloqueio = 'ALTERADO'; }), /Reabra/); assert.deepEqual(f.tables(), before);
 await manualSave(f, 'manutencao', day, items => { items.push({ id: 'office', prefixo: '4201', consorciada: 'VCG', data: day, bloqueado: false, emExecucao: true, liberado: false, observacaoOficina: 'FREIO' }); });
 assert.equal((await manualContext(f)).maintenance.length, 2);
});
test('manual: dupla finalizacao com mesma revisao tem apenas um vencedor', async () => {
 const f = fixture(); await manual(f, target, 'iniciar'); const c = await manualContext(f);
 const cmd = { garagem: 'VCG', data: target, operacao: 'finalizar', baseC4: c.baseC4 };
 const results = await Promise.allSettled([changeCILifecycle(f.db, 1, cmd, clock(), ['VCG']), changeCILifecycle(f.db, 1, cmd, clock(), ['VCG'])]);
 assert.equal(results.filter(i => i.status === 'fulfilled').length, 1);
});
test('manual: iniciar proxima e reabrir origem nao podem vencer simultaneamente', async () => {
 const f = fixture(); await manual(f, target, 'iniciar'); await manual(f, target, 'finalizar');
 const results = await Promise.allSettled([manual(f, '2026-10-09', 'iniciar'), manual(f, target, 'reabrir')]);
 assert.equal(results.filter(i => i.status === 'fulfilled').length, 1);
});
test('manual: permissoes e garagem habilitada sao verificadas no backend', async () => {
 const f = fixture(); const c = await manualContext(f); const cmd = { garagem: 'VCG', data: target, operacao: 'iniciar', baseC4: c.baseC4 };
 f.role(false); await assert.rejects(changeCILifecycle(f.db, 1, cmd, clock(), ['VCG']), (e: any) => e.status === 403);
 f.role(true); await assert.rejects(changeCILifecycle(f.db, 1, cmd, clock(), []), (e: any) => e.status === 409);
 assert.equal(f.writes(), 0);
});

test('manual: erro na primeira alteracao reverte inicializacao da manutencao', async () => {
 const f = fixture(); await manual(f, target, 'iniciar'); const before = f.tables();
 await assert.rejects(manualSave(f, 'ci', target, items => { items.splice(items.findIndex(i => i.categoriaPlanilha === 'BLOQUEADO'), 1); }), /intencao explicita/);
 assert.deepEqual(f.tables(), before);
});
test('manual: iniciar sem origem finalizada nao cria ciclo nem folha vazia', async () => {
 const f = fixture(false), before = f.tables();
 await assert.rejects(manual(f, target, 'iniciar'), /Finalize/); assert.deepEqual(f.tables(), before);
});
test('manual: ao virar o dia, somente o primeiro comando materializa manutencao futura', async () => {
 const f = fixture(); await manual(f, target, 'iniciar'); await manual(f, target, 'finalizar'); await manual(f, '2026-10-09', 'iniciar');
 await manualSave(f, 'ci', '2026-10-09', items => { items.find(i => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'PLANEJADO'; });
 const now = clock('2026-10-08T12:00:00Z'), writes = f.writes();
 const c = await manualContext(f, '2026-10-09', now); assert.equal(c.maintenance[0].observacaoBloqueio, 'PLANEJADO'); assert.equal(f.writes(), writes);
 await manualSave(f, 'manutencao', '2026-10-08', () => {}, now);
 const after = await manualContext(f, '2026-10-09', now); assert.ok(after.maintenance[0].id.startsWith('c4-m-')); assert.ok(!after.maintenance[0].id.includes('--'));
 const todayCycle = f.tables().cicloOperacional.find(i => i.dataOperacional.toISOString().slice(0,10) === day);
 assert.equal(f.tables().estadoManutencao.filter(i => i.cicloId === todayCycle.id).length, 0);
});

for (const later of ['2026-10-08T12:00:00Z', '2026-10-09T12:00:00Z']) {
 test(`manual: finaliza pendente hoje ou historica em ${later} sem editar itens e libera a proxima`, async () => {
  const f = fixture(); await manual(f, target, 'iniciar');
  const before = f.tables(); const laterClock = () => new Date(later);
  await manual(f, target, 'finalizar', laterClock);
  assert.deepEqual(f.tables().itemFolhaCI, before.itemFolhaCI);
  assert.deepEqual(f.tables().estadoManutencao, before.estadoManutencao);
  const folha = f.tables().folhaCI.find(i => i.status === 'FINALIZADA' && i.id !== 10);
  assert.ok(folha); assert.equal(folha.finalizadaEm.toISOString(), new Date(later).toISOString());
  const finalized = f.tables();
  await assert.rejects(manual(f, target, 'reabrir', laterClock), /consulta/);
  await assert.rejects(manual(f, target, 'finalizar', laterClock), /preparacao/);
  assert.deepEqual(f.tables(), finalized);
  if (later.startsWith('2026-10-08')) {
    await manual(f, addDays(target, 1), 'iniciar', laterClock);
    assert.ok(f.tables().folhaCI.some(i => i.folhaOrigemId === folha.id));
  } else {
    await assert.rejects(manual(f, '2026-10-10', 'iniciar', laterClock), /anterior/);
  }
 });
}

 test('reforco com horario exige motivo em inclusao e edicao, sem perder registros antigos incompletos', async () => {
 for(const motivo of [null,'','   ']) {
 const f=await ready(),ctx=await readContext(f.db,'VCG',day),before=f.tables();
 const items=structuredClone(ctx.ci.filter(i=>i.data===target));
 items.push({...items.find(i=>i.categoriaPlanilha==='REFORCO')!,id:'new-ref',prefixo:'5000',tipoPosicao:'FIXO',ordemPosicao:12,motivo});
 await assert.rejects(saveC4(f.db,1,{garagem:'VCG',data:target,baseC4:ctx.baseC4,base:revision(ctx.ci.filter(i=>i.data===target)),items},'ci',clock()),(e:any)=>e.status===400&&/motivo/.test(e.message));
 assert.deepEqual(f.tables(),before);
 }
 const f=await ready(),ctx=await readContext(f.db,'VCG',day),items=structuredClone(ctx.ci.filter(i=>i.data===target)),before=f.tables();
 const ref=items.find(i=>i.categoriaPlanilha==='REFORCO'&&i.tipoPosicao==='FIXO')!;
 ref.os='Observacao editada';
 await assert.rejects(saveC4(f.db,1,{garagem:'VCG',data:target,baseC4:ctx.baseC4,base:revision(ctx.ci.filter(i=>i.data===target)),items},'ci',clock()),(e:any)=>e.status===400);
 assert.deepEqual(f.tables(),before);
 });
 test('reforco completo salva sem observacao e demais setores preservam motivo antigo ausente', async () => {
 const f=await ready(),ctx=await readContext(f.db,'VCG',day),items=structuredClone(ctx.ci.filter(i=>i.data===target));
 items.push({...items.find(i=>i.categoriaPlanilha==='REFORCO')!,id:'new-ref',prefixo:'5000',tipoPosicao:'FIXO',ordemPosicao:12,motivo:'INSPECAO',os:null});
 await saveC4(f.db,1,{garagem:'VCG',data:target,baseC4:ctx.baseC4,base:revision(ctx.ci.filter(i=>i.data===target)),items},'ci',clock());
 const saved=f.tables().itemFolhaCI.filter(i=>i.folhaId!==10&&i.categoria==='REFORCO');
 assert.ok(saved.some(i=>i.prefixo==='5000'&&i.motivo==='INSPECAO'&&i.observacoes===null));
 assert.ok(saved.some(i=>i.tipoPosicao==='FIXO'&&i.ordemPosicao===1&&i.motivo===null));
 const fresh=await readContext(f.db,'VCG',day),next=structuredClone(fresh.ci.filter(i=>i.data===target));
 next.find(i=>i.categoriaPlanilha==='OFICINA')!.os='Ajuste oficina';
 await saveC4(f.db,1,{garagem:'VCG',data:target,baseC4:fresh.baseC4,base:revision(fresh.ci.filter(i=>i.data===target)),items:next},'ci',clock());
 assert.ok(f.tables().itemFolhaCI.some(i=>i.folhaId!==10&&i.tipoPosicao==='FIXO'&&i.ordemPosicao===1&&i.motivo===null));
 });

 test('reforco nao aceita retirar motivo de registro completo nem prefixo vazio', async () => {
 const f=await ready(),c=await command(f,'ci');
 const ref=c.items.find((i:any)=>i.categoriaPlanilha==='REFORCO'&&i.tipoPosicao==='FIXO') as any;
 ref.motivo='INSPECAO'; await saveC4(f.db,1,c,'ci',clock());
 for(const patch of [{motivo:''},{motivo:'   '},{prefixo:''}]) {
 const next=await command(f,'ci'),before=f.tables();
 Object.assign(next.items.find((i:any)=>i.categoriaPlanilha==='REFORCO'&&i.tipoPosicao==='FIXO')!,patch);
 await assert.rejects(saveC4(f.db,1,next,'ci',clock())); assert.deepEqual(f.tables(),before);
 }
 });

const regularizationClock = clock('2026-10-10T15:20:00Z');

test('regularizacao: recompõe dias em sequencia com copia integral e horarios reais', async () => {
 const f = fixture(), source = f.tables();
 await assert.rejects(manual(f, '2026-10-09', 'regularizar', regularizationClock), /anterior/);
 assert.deepEqual(f.tables(), source);
 for (const date of [target, '2026-10-09', '2026-10-10']) {
  await manual(f, date, 'regularizar', regularizationClock);
  const current = f.tables().folhaCI.find(i => i.dataFolha.getTime() === dateValue(date).getTime());
  assert.equal(current.regularizacaoIniciadaPorId, 1);
  assert.equal(current.regularizacaoIniciadaEm.toISOString(), regularizationClock().toISOString());
  assert.equal(current.inicializadaEm.toISOString(), regularizationClock().toISOString());
  assert.equal(f.tables().itemFolhaCI.filter(i => i.folhaId === current.id).length, source.itemFolhaCI.length);
  await manualSave(f, 'ci', date, items => { items.find(i => i.categoriaPlanilha === 'PREVENTIVA').os = `REVISAO ${date}`; }, regularizationClock);
  await manual(f, date, 'finalizar', regularizationClock);
 }
 await manual(f, '2026-10-11', 'iniciar', regularizationClock);
 assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), source.itemFolhaCI);
 assert.deepEqual(f.tables().estadoManutencao, []);
 assert.equal(f.tables().folhaCI.find(i => i.dataFolha.getTime() === dateValue('2026-10-11').getTime()).regularizacaoIniciadaEm, undefined);
});

test('regularizacao: folha aberta preserva itens e inicio original; finalizador separado do iniciador', async () => {
 const f = fixture(); await manual(f, target, 'iniciar');
 const before = f.tables();
 await manual(f, target, 'regularizar', regularizationClock);
 const after = f.tables(), sheet = after.folhaCI.find(i => i.id !== 10);
 assert.deepEqual(after.itemFolhaCI, before.itemFolhaCI);
 assert.deepEqual(sheet.inicializadaEm, before.folhaCI.find(i => i.id === sheet.id).inicializadaEm);
 assert.equal(sheet.regularizacaoIniciadaPorId, 1);
 assert.equal(sheet.regularizacaoIniciadaEm.toISOString(), regularizationClock().toISOString());
 const context = await readContext(f.db, 'VCG', day, regularizationClock, 1);
 await changeCILifecycle(f.db, 2, { garagem: 'VCG', data: target, operacao: 'finalizar', baseC4: context.baseC4 }, regularizationClock, ['VCG']);
 const finalized = f.tables().folhaCI.find(i => i.id === sheet.id);
 assert.equal(finalized.finalizadaPorId, 2);
 assert.equal(finalized.regularizacaoIniciadaPorId, 1);
 assert.equal(finalized.finalizadaEm.toISOString(), regularizationClock().toISOString());
 await assert.rejects(manual(f, target, 'regularizar', regularizationClock), /finalizada/);
 await assert.rejects(manual(f, target, 'reabrir', regularizationClock), /consulta/);
});

test('regularizacao: nao altera estados de manutencao persistidos nem fotos finalizadas', async () => {
 const f = await ready();
 const before = f.tables();
 await manual(f, target, 'regularizar', regularizationClock);
 await manualSave(f, 'ci', target, items => { items.find(i => i.categoriaPlanilha === 'BLOQUEADO').motivo = 'HISTORICO REVISADO'; }, regularizationClock);
 assert.deepEqual(f.tables().estadoManutencao, before.estadoManutencao);
 assert.deepEqual(f.tables().folhaCI.find(i => i.id === 10), before.folhaCI.find(i => i.id === 10));
 assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), before.itemFolhaCI.filter(i => i.folhaId === 10));
});

for (const role of ['manutencao', 'COLABORADOR', 'OPERADOR']) {
 test(`regularizacao: ${role} nao inicia, edita ou finaliza por API`, async () => {
  const f = fixture(); f.identity({ role, garagem: 'VCG' });
  const before = f.tables();
  await assert.rejects(manual(f, target, 'regularizar', regularizationClock), (e: any) => e.status === 403);
  assert.deepEqual(f.tables(), before);
  f.identity({ role: 'ADMIN' }); await manual(f, target, 'regularizar', regularizationClock);
  const regularized = f.tables(); f.identity({ role, garagem: 'VCG' });
  await assert.rejects(manualSave(f, 'ci', target, items => { items.find(i => i.categoriaPlanilha === 'PREVENTIVA').os = 'NEGADO'; }, regularizationClock), (e: any) => e.status === 403);
  await assert.rejects(manual(f, target, 'finalizar', regularizationClock), (e: any) => e.status === 403);
  assert.deepEqual(f.tables(), regularized);
  const ctx = await readContext(f.db, 'VCG', day, regularizationClock, 1);
  assert.equal(ctx.ciMutable, false);
 });
}

test('regularizacao: manutencao continua podendo finalizar pendente normal sem edicao retroativa', async () => {
 const f = fixture(); await manual(f, target, 'iniciar');
 f.identity({ role: 'manutencao', garagem: 'VCG' });
 await assert.rejects(manualSave(f, 'ci', target, () => {}, regularizationClock), /consulta/);
 await manual(f, target, 'finalizar', regularizationClock);
 assert.equal(f.tables().folhaCI.find(i => i.id !== 10).status, 'FINALIZADA');
});

test('regularizacao: permissoes de leitura e edicao expostas apenas a ADMIN', async () => {
 const f = fixture(); await manual(f, target, 'regularizar', regularizationClock);
 const writes = f.writes();
 const admin = await readContext(f.db, 'VCG', day, regularizationClock, 1);
 assert.equal(admin.ciMutable, true);
 assert.equal((await readContext(f.db, 'VCG', day, regularizationClock)).ciMutable, false);
 await manual(f, target, 'finalizar', regularizationClock);
 assert.equal((await readContext(f.db, 'VCG', day, regularizationClock, 1)).ciMutable, false);
 assert.equal(f.writes(), writes + 1);
});

test('regularizacao: rejeita futuro, repeticao, origem ausente e snapshot obsoleto sem escrita', async () => {
 const f = fixture(), before = f.tables();
 await assert.rejects(manual(f, '2026-10-11', 'regularizar', regularizationClock), /hoje ou anterior/);
 await assert.rejects(manual(f, '2026-10-05', 'regularizar', regularizationClock), /anterior/);
 assert.deepEqual(f.tables(), before);
 const stale = await manualContext(f, target, regularizationClock);
 await manual(f, target, 'regularizar', regularizationClock);
 const regularized = f.tables();
 await assert.rejects(changeCILifecycle(f.db, 1, { garagem: 'VCG', data: target, operacao: 'regularizar', baseC4: stale.baseC4 }, regularizationClock, ['VCG']), /outro posto/);
 await assert.rejects(manual(f, target, 'regularizar', regularizationClock), /ja esta/);
 assert.deepEqual(f.tables(), regularized);
});

test('regularizacao: chamadas concorrentes iniciam uma unica folha auditada', async () => {
 const f = fixture(); const ctx = await manualContext(f, target, regularizationClock);
 const payload = { garagem: 'VCG', data: target, operacao: 'regularizar', baseC4: ctx.baseC4 };
 const results = await Promise.allSettled([1, 2].map(userId => changeCILifecycle(f.db, userId, payload, regularizationClock, ['VCG'])));
 assert.equal(results.filter(i => i.status === 'fulfilled').length, 1);
 assert.equal(f.tables().folhaCI.filter(i => i.dataFolha.getTime() === dateValue(target).getTime()).length, 1);
});

test('regularizacao: UI conserva leitura sem capacidade oficial e apos finalizacao', () => {
 const loader = (Module as any)._load;
 try {
  (Module as any)._load = function(id: string, ...args: unknown[]) {
   if (id === './api') return { api: {} };
   return loader.call(this, id, ...args);
  };
  const client = require('../../web/src/lib/c4');
  const selectedDay = '2000-01-02', contextDay = '2000-01-01';
  for (const [ciMutable, status, regularizacaoIniciadaEm, expected] of [
   [false, 'EM_PREPARACAO', '2026-10-26T15:00:00Z', false],
   [true, 'EM_PREPARACAO', '2026-10-26T15:00:00Z', true],
   [true, 'FINALIZADA', '2026-10-26T15:00:00Z', false],
   [true, 'EM_PREPARACAO', null, false],
  ]) {
   client.storeC4Context({ mode: 'C4', garagem: 'VCG', ciMutable,
    folhas: [{ id: 1, dataFolha: selectedDay, status, regularizacaoIniciadaEm }] }, contextDay);
   assert.equal(Boolean(client.c4Mutable(selectedDay, 'VCG')), expected);
  }
 } finally { (Module as any)._load = loader; }
});

test('popup inspecao: lote de seis salva e recarrega pelo sync existente preservando outros setores', async () => {
 const f = await ready(), ctx = await readContext(f.db, 'VCG', day, clock());
 const original = ctx.ci.filter(i => i.data === target), before = f.tables();
 const context = { date: target, garage: 'VCG' as const, c4: true, serviceTitle: 'INSPEÇÃO', fixedSlots: [], legacyVehicle: () => ({ garagem: 'VCG' as const }) };
 const existing = savedInspectionEntries(ctx.ci, context);
 const selected = [...existing.map(({ key, prefixo }) => ({ key, prefixo })), ...Array.from({ length: 5 }, (_, n) => ({ key: `new-${4500+n}`, prefixo: String(4500+n) }))];
 const next = saveInspectionSelection(ctx.ci, context, selected).filter(i => i.data === target);
 await saveC4(f.db, 1, { garagem: 'VCG', data: target, baseC4: ctx.baseC4, base: revision(original), items: next }, 'ci', clock());
 const loaded = await readContext(f.db, 'VCG', day, clock());
 assert.equal(savedInspectionEntries(loaded.ci, context).length, 6);
 assert.deepEqual(f.tables().itemFolhaCI.filter(i => i.folhaId === 10), before.itemFolhaCI.filter(i => i.folhaId === 10));
 assert.deepEqual(f.tables().estadoManutencao, before.estadoManutencao);
 assert.equal(loaded.ci.filter(i => i.data === target && i.categoriaPlanilha !== 'REFORCO').length, original.filter(i => i.categoriaPlanilha !== 'REFORCO').length);
});

test('popup inspecao: conflito rejeita lote inteiro e preserva vencedor sem inclusoes parciais', async () => {
 const f = await ready(), ctx = await readContext(f.db, 'VCG', day, clock());
 const original = ctx.ci.filter(i => i.data === target);
 const context = { date: target, garage: 'VCG' as const, c4: true, serviceTitle: 'INSPEÇÃO', fixedSlots: [], legacyVehicle: () => ({ garagem: 'VCG' as const }) };
 const next = saveInspectionSelection(ctx.ci, context, [{ key: 'new-4500', prefixo: '4500' }, { key: 'new-4501', prefixo: '4501' }]).filter(i => i.data === target);
 await manualSave(f, 'ci', target, items => { items.find(i => i.categoriaPlanilha === 'OFICINA').os = 'OUTRO USUARIO'; });
 const winner = f.tables();
 await assert.rejects(saveC4(f.db, 1, { garagem: 'VCG', data: target, baseC4: ctx.baseC4, base: revision(original), items: next }, 'ci', clock()), /desatualizado/);
 assert.deepEqual(f.tables(), winner);
 assert.ok(!f.tables().itemFolhaCI.some(i => i.prefixo === '4500' || i.prefixo === '4501'));
});
