import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateProgramming, listTraffic, saveTraffic, trafficCatalog } from '../src/services/trafficProgramming';
import { trafficCommandSchema, trafficRowsSchema } from '../src/services/trafficSchema';
import { trafficCommandSchema as clientSchema } from '../../web/src/lib/trafficSchema';
import { currentScaleTemplate } from '../src/data/scheduleTemplates';
import { defaultScheduleSelection } from '../../web/src/lib/scheduleSelection';
import { programReleaseRows, finalizedReleaseRows } from '../src/services/releaseProgramming';
import { saveEscalaDiaria, readEscalaDiaria } from '../src/services/escalaDiaria';
import { fixedScheduleToken, fixedScheduleRows } from '../../web/src/lib/dailySchedule';
import { validateDailyEscala } from '../../web/src/lib/sharedEscala';
import { operationPageAccess } from '../src/services/operationalAccess';
import { createSolturaSchema } from '../src/utils/schemas';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-11-09' } as const;
const row = { id: 'trafego-9a367235-3370-4e41-81f2-317513ef8ee6', linha: '999', tabela: '1', carroProgramado: '4000', saidaGaragem: '04:20', status: 'PENDENTE' as const };
const command = { tipo: 'ESCALA', nome: 'Segunda com base de sábado', contexto: context, revisao: 0, itens: [row] } as const;
const now = () => new Date('2026-11-02T16:00:00Z');
function fixture() {
  const data: any = { role: 'soltura', garage: 'VCG', daily: null, sheet: null, dispatch: null, rows: [] };
  const locks: string[] = [];
  const db: any = {
    user: { findUnique: async () => ({ role: data.role, garagem: data.garage }) },
    trafegoProgramacao: {
      findUnique: async ({ where }: any) => data.rows.find((r: any) => Object.entries(where.tipo_garagem_escalaTipo_turno_dataOperacao).every(([key, v]) => r[key] === v)) ?? null,
      findMany: async ({ where }: any) => data.rows.filter((r: any) => r.garagem === where.garagem),
      create: async ({ data: value }: any) => { const record = { id: data.rows.length + 1, ...value }; data.rows.push(record); return record; },
      update: async ({ where, data: value }: any) => { const record = data.rows.find((r: any) => r.id === where.id); Object.assign(record, value); return record; },
    },
    escalaDiaria: {
      findUnique: async () => data.daily, findFirst: async () => null,
      create: async ({ data: value }: any) => { data.daily = { id: 1, ...value }; return data.daily; },
      update: async ({ data: value }: any) => Object.assign(data.daily, value),
    },
    folhaSoltura: { findUnique: async () => data.sheet },
    soltura: { findFirst: async () => data.dispatch },
    folhaCI: { findFirst: async () => null, findUnique: async () => ({ status: 'FINALIZADA', itens: [] }) },
    $queryRaw: async (sql: TemplateStringsArray) => { locks.push(sql.join('?')); return []; },
    $transaction: async (fn: any, options: any) => { assert.equal(options.isolationLevel, 'Serializable'); return fn(db); },
  };
  return { db, data, locks };
}
const fleet = async () => ({ source: 'real', data: [{ idCarro: 4000, prefixo: '4000', garagem: 2, garagemNome: 'VCG' }] });

test('permissão de Tráfego exige ADMIN ou Soltura com garagem, inclusive nos aliases', async () => {
  for (const role of ['ADMIN', 'soltura', 'COLABORADOR', 'manutencao']) {
    const f = fixture(); f.data.role = role;
    const permitted = role === 'ADMIN' || role === 'soltura';
    assert.equal(operationPageAccess({ role, garagem: 'VCG' }, '/trafego/alterar-escalas-solturas'), permitted);
    assert.equal(operationPageAccess({ role, garagem: 'VCG' }, '/soltura/alterar-folha'), permitted);
    if (permitted) await saveTraffic(f.db, 1, command, now);
    else { await assert.rejects(saveTraffic(f.db, 1, command, now), (e: any) => e.status === 403); assert.equal(f.data.rows.length, 0); }
  }
  const f = fixture(); f.data.garage = 'VCM';
  await assert.rejects(saveTraffic(f.db, 1, command, now), (e: any) => e.status === 403);
  await assert.rejects(listTraffic(f.db, 1, 'VCG'), (e: any) => e.status === 403);
});

test('cópia de sábado vale só para a segunda escolhida, sem modificar JSON nem outro contexto', async () => {
  const f = fixture(), saturday = currentScaleTemplate({ ...context, escalaTipo: 'SABADO', turno: 'PADRAO' });
  const before = JSON.stringify(saturday);
  await saveTraffic(f.db, 1, { ...command, itens: saturday }, now);
  assert.equal(defaultScheduleSelection(context.dataOperacao).dayType, 'SEG_SEX');
  assert.equal((await dateProgramming(f.db, 'ESCALA', context)).length, 108);
  assert.equal((await dateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-10' })).length, 202);
  assert.equal((await dateProgramming(f.db, 'SOLTURA', context)).length, 202);
  assert.equal(JSON.stringify(saturday), before);
});

test('revisão impede sobrescrita e permite salvar campos e novas viagens', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, command, now);
  await assert.rejects(saveTraffic(f.db, 1, command, now), (e: any) => e.status === 409);
  const saved = await saveTraffic(f.db, 1, { ...command, revisao: 1, nome: 'Revisada', itens: [{ ...row, linha: '998', saidaGaragem: '05:00' }, { ...row, id: 'nova', tabela: '2' }] }, now);
  assert.equal(saved.revisao, 2);
  assert.equal((await dateProgramming(f.db, 'ESCALA', context))[0].linha, '998');
  assert.equal((await listTraffic(f.db, 1, 'VCG')).excecoes[0].itens.length, 2);
  assert.ok(f.locks[0].includes('escala_diaria'));
  assert.ok(f.locks[1].includes('soltura_folha'));
  assert.ok(f.locks[2].includes('trafego_programacao'));
});

test('operação iniciada, despacho legado e datas anteriores impedem alteração', async () => {
  const f = fixture(); f.data.daily = { id: 1 };
  await assert.rejects(saveTraffic(f.db, 1, command, now), (e: any) => e.status === 409);
  for (const source of ['sheet', 'dispatch']) {
    const f = fixture(); f.data[source] = { id: 1 };
    await assert.rejects(saveTraffic(f.db, 1, { ...command, tipo: 'SOLTURA' }, now), (e: any) => e.status === 409);
    assert.equal(f.data.rows.length, 0);
  }
  await assert.rejects(saveTraffic(fixture().db, 1, { ...command, contexto: { ...context, dataOperacao: '2026-11-02' } }, now), (e: any) => e.status === 409);
  await saveTraffic(fixture().db, 1, { ...command, tipo: 'SOLTURA', contexto: { ...context, dataOperacao: '2026-11-02' } }, now);
});

test('início da Escala fotografa a exceção e cliente aceita IDs novos e token de edição', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, command, now);
  const started = await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 0, operacao: 'iniciar' }, fleet, async () => null, now);
  assert.deepEqual(started.programacao, [row]);
  assert.equal(validateDailyEscala(started, context).programacao?.[0].id, row.id);
  assert.equal(fixedScheduleRows(context, started.programacao)[0].linha, '999');
  assert.equal(fixedScheduleToken(context, row.id, started.programacao), JSON.stringify(row));
  const confirmed = await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 1, id: row.id,
    carroSubstituido: '', base: fixedScheduleToken(context, row.id, started.programacao) }, fleet, async () => null, now);
  assert.deepEqual(confirmed.confirmadas, [row.id]);
  f.data.rows[0].conteudo = JSON.stringify({ version: 1, itens: [{ ...row, linha: 'MUDOU' }] });
  const read = await readEscalaDiaria(f.db, context, 1, fleet, async () => null);
  assert.equal(read.programacao[0].linha, '999');
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 2, operacao: 'finalizar' }, fleet, async () => null, now);
  assert.equal((await finalizedReleaseRows(f.db, context))?.length, 202);
});

test('Soltura seleciona novas linhas por data e mantém vespertino sem carro programado', async () => {
  const f = fixture(); const evening = { ...context, turno: 'VESPERTINO' as const };
  await saveTraffic(f.db, 1, { ...command, tipo: 'SOLTURA', contexto: evening, itens: [{ ...row, carroProgramado: '' }] }, now);
  assert.equal((await finalizedReleaseRows(f.db, evening))?.[0].linha, '999');
  assert.equal(programReleaseRows(evening, [], [], [row], true)[0].carroProgramado, '');
  assert.equal(programReleaseRows(context, [], [], [row], true)[0].carroProgramado, '4000');
  const special = { ...row, tipo: 'FRETAMENTO', tabela: '' };
  assert.ok(createSolturaSchema.safeParse({ ...context, scheduleId: special.id, linha: special.linha, tabela: '' }).success);
});

test('schemas espelhados validam campos, datas, turno, IDs duplicados e catálogos atuais', () => {
  assert.equal(readFileSync('apps/api/src/services/trafficSchema.ts', 'utf8').replace(/\r\n/g, '\n'), readFileSync('apps/web/src/lib/trafficSchema.ts', 'utf8').replace(/\r\n/g, '\n'));
  for (const value of [command, { ...command, itens: [] }, { ...command, itens: [row, row] }, { ...command, contexto: { ...context, dataOperacao: '2026-02-30' } }, { ...command, itens: [{ ...row, saidaGaragem: '29:00' }] }])
    assert.equal(clientSchema.safeParse(value).success, trafficCommandSchema.safeParse(value).success);
  assert.ok(!trafficCommandSchema.safeParse({ ...command, tipo: 'SOLTURA', contexto: { ...context, turno: 'VESPERTINO' } }).success);
  for (const garage of ['VCG', 'VCM'] as const) for (const model of trafficCatalog(garage)) assert.ok(trafficRowsSchema.safeParse(model.itens).success, model.chave);
});
