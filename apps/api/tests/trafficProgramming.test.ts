import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dateProgramming, listTraffic, saveTraffic, trafficCatalog, resolveDateProgramming } from '../src/services/trafficProgramming';
import { trafficCommandSchema, trafficRowsSchema } from '../src/services/trafficSchema';
import { trafficCommandSchema as clientSchema } from '../../web/src/lib/trafficSchema';
import { currentScaleTemplate } from '../src/data/scheduleTemplates';
import { defaultScheduleSelection } from '../../web/src/lib/scheduleSelection';
import { programReleaseRows, finalizedReleaseRows, readReleaseProgramming } from '../src/services/releaseProgramming';
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
  const data: any = { role: 'soltura', garage: 'VCG', daily: null, sheet: null, dispatch: null, rows: [], models: [], versions: [] };
  const locks: string[] = [];
  const db: any = {
    user: { findUnique: async () => ({ role: data.role, garagem: data.garage }) },
    trafegoProgramacao: {
      findUnique: async ({ where }: any) => data.rows.find((r: any) => Object.entries(where.tipo_garagem_escalaTipo_turno_dataOperacao).every(([key, v]) => r[key] === v)) ?? null,
      findMany: async ({ where }: any) => data.rows.filter((r: any) => r.garagem === where.garagem),
      create: async ({ data: value }: any) => { const record = { id: data.rows.length + 1, ...value }; data.rows.push(record); return record; },
      update: async ({ where, data: value }: any) => { const record = data.rows.find((r: any) => r.id === where.id); Object.assign(record, value); return record; },
    },
    trafegoModelo: {
      findUnique: async ({ where }: any) => data.models.find((r: any) => Object.entries(where.tipo_garagem_escalaTipo_turno).every(([key, v]) => r[key] === v)) ?? null,
      findMany: async ({ where }: any) => data.models.filter((r: any) => r.garagem === where.garagem),
      create: async ({ data: value }: any) => { const record = { id: data.models.length + 1, ...value }; data.models.push(record); return record; },
      update: async ({ where, data: value }: any) => { const record = data.models.find((r: any) => r.id === where.id); Object.assign(record, value); return record; },
    },
    trafegoModeloVersao: {
      findFirst: async ({ where }: any) => data.versions.filter((r: any) => r.modeloId === where.modeloId && r.vigenteDesde <= where.vigenteDesde.lte)
        .sort((a: any, b: any) => b.vigenteDesde.localeCompare(a.vigenteDesde) || b.revisao - a.revisao)[0] ?? null,
      findUnique: async ({ where }: any) => data.versions.find((r: any) => r.modeloId === where.modeloId_revisao.modeloId && r.revisao === where.modeloId_revisao.revisao) ?? null,
      create: async ({ data: value }: any) => { const record = { id: data.versions.length + 1, ...value }; data.versions.push(record); return record; },
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
    $transaction: async (fn: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable'); const before = structuredClone(data);
      try { return await fn(db); } catch (e) { Object.assign(data, before); throw e; }
    },
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

const { dataOperacao: _modelDate, ...modelContext } = context;
const modelCommand = { ...command, contexto: modelContext, funcionamento: 'RECORRENTE' } as const;
test('vinculo persiste em excecao/modelo e segue vigencia, sem alterar linhas e horarios', async () => {
  const f = fixture();
  const source = { ...modelCommand, tipo: 'SOLTURA', origemCarros: 'ESCALA' };
  await saveTraffic(f.db, 1, source, now);
  assert.equal((await listTraffic(f.db, 1, 'VCG')).padroes.find(p => p.tipo === 'SOLTURA' && p.contexto.turno === 'MATUTINO')?.origemCarros, 'ESCALA');
  await saveTraffic(f.db, 1, { ...source, revisao: 1, origemCarros: undefined }, () => new Date('2026-11-03T16:00:00Z'));
  assert.equal((await resolveDateProgramming(f.db, 'SOLTURA', { ...context, dataOperacao: '2026-11-02' })).origemCarros, 'ESCALA');
  assert.equal((await resolveDateProgramming(f.db, 'SOLTURA', context)).origemCarros, undefined);
  await saveTraffic(f.db, 1, { ...command, tipo: 'SOLTURA', origemCarros: 'ESCALA' }, now);
  assert.equal((await listTraffic(f.db, 1, 'VCG')).excecoes[0].origemCarros, 'ESCALA');
  const template = await resolveDateProgramming(f.db, 'SOLTURA', context);
  const rows = programReleaseRows(context, [{ ...row, carroProgramado: '4001', saidaGaragem: '09:00' }], [{ id: row.id, carroSubstituido: '4002' }], template.itens, true, false, template.origemCarros === 'ESCALA');
  assert.equal(rows[0].carroProgramado, '4002'); assert.equal(rows[0].saidaGaragem, '04:20');
  assert.equal(rows[0].id, row.id);
  assert.equal(programReleaseRows(context, [], [], template.itens, true, false, true)[0].carroProgramado, '');
  assert.equal(programReleaseRows(context, [row, { ...row, id: 'ambigua' }], [], template.itens, true, true, true)[0].carroProgramado, '');
  assert.equal(programReleaseRows(context, [{ ...row, tabela: '2' }], [], template.itens, true, true, true)[0].carroProgramado, '');
  await assert.rejects(saveTraffic(f.db, 1, { ...modelCommand, origemCarros: 'ESCALA' }, now));
  await assert.rejects(saveTraffic(f.db, 1, { ...source, contexto: { ...modelContext, turno: 'VESPERTINO' }, itens: [{ ...row, carroProgramado: '' }] }, now));
});

test('inicio da Soltura vinculada usa escala finalizada; fotografia prevalece apos mudar vinculo', async () => {
  const f = fixture();
  await saveTraffic(f.db, 1, modelCommand, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 0, operacao: 'iniciar' }, fleet, async () => null, now);
  const linked = { ...command, tipo: 'SOLTURA', origemCarros: 'ESCALA', itens: [{ ...row, carroProgramado: '4999', saidaGaragem: '05:00' }] };
  await saveTraffic(f.db, 1, linked, now);
  assert.equal(await finalizedReleaseRows(f.db, context), null);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 1, id: row.id, carroSubstituido: '', base: fixedScheduleToken(context, row.id, [row]) }, fleet, async () => null, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 2, operacao: 'finalizar' }, fleet, async () => null, now);
  const rows = await finalizedReleaseRows(f.db, context);
  assert.equal(rows?.[0].carroProgramado, '4000'); assert.equal(rows?.[0].saidaGaragem, '05:00');
  f.data.sheet = { status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1, itens: rows, eventos: [] }) };
  f.db.soltura.findMany = async () => [];
  f.data.rows[0].conteudo = JSON.stringify({ version: 1, itens: [{ ...row, carroProgramado: '4999' }] });
  const read = await readReleaseProgramming(f.db, context, 1, fleet, async () => null);
  assert.equal(read.itens[0].carroProgramado, '4000'); assert.equal(read.itens[0].saidaGaragem, '05:00');
});

test('consulta atualiza somente pendentes de folha aberta e preserva conteudo finalizado sem escrita', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, modelCommand, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 0, operacao: 'iniciar' }, fleet, async () => null, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 1, id: row.id, carroSubstituido: '', base: fixedScheduleToken(context, row.id, [row]) }, fleet, async () => null, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 2, operacao: 'finalizar' }, fleet, async () => null, now);
  f.data.sheet = { status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1,
    itens: [{ ...row, carroProgramado: '4999', saidaGaragem: '05:00' }], eventos: [], escalaVinculadaIds: [row.id] }) };
  let records: any[] = [];
  f.db.soltura.findMany = async () => records;
  const before = f.data.sheet.conteudo;
  let read = await readReleaseProgramming(f.db, context, 1, fleet, async () => null);
  assert.equal(read.itens[0].carroProgramado, '4000'); assert.equal(read.itens[0].saidaGaragem, '05:00');
  assert.equal(f.data.sheet.conteudo, before);
  records = [{ ...context, scheduleId: row.id, status: 'LIBERADO', carroProgramado: '4999', carroRealizado: '4000' }];
  read = await readReleaseProgramming(f.db, context, 1, fleet, async () => null);
  assert.equal(read.itens[0].carroProgramado, '4999');
  records = []; f.data.sheet.status = 'FINALIZADA';
  read = await readReleaseProgramming(f.db, context, 1, fleet, async () => null);
  assert.equal(read.itens[0].carroProgramado, '4999'); assert.equal(f.data.sheet.conteudo, before);
});

test('vigencia conserva dias anteriores, escolhe ultima revisao no dia e respeita excecao', async () => {
  for (const tipo of ['ESCALA', 'SOLTURA'] as const) {
    const f = fixture(), source = { ...modelCommand, tipo };
    const at = (date: string) => () => new Date(`${date}T16:00:00Z`);
    const read = (date: string) => resolveDateProgramming(f.db, tipo, { ...context, dataOperacao: date });
    await saveTraffic(f.db, 1, source, at('2026-11-02'));
    await saveTraffic(f.db, 1, { ...source, revisao: 1, itens: [{ ...row, linha: 'NOVA' }] }, at('2026-11-03'));
    await saveTraffic(f.db, 1, { ...source, revisao: 2, itens: [{ ...row, linha: 'ULTIMA' }] }, at('2026-11-03'));
    assert.equal((await read('2026-11-01')).recorrente, false);
    assert.equal((await read('2026-11-02')).itens[0].linha, '999');
    assert.equal((await read('2026-11-03')).itens[0].linha, 'ULTIMA');
    assert.equal((await read('2026-11-10')).itens[0].linha, 'ULTIMA');
    assert.equal(f.data.versions.length, 3);
    assert.equal(JSON.parse(f.data.versions[1].conteudo).itens[0].linha, 'NOVA');
    await saveTraffic(f.db, 1, { ...command, tipo, itens: [{ ...row, linha: 'EXCECAO' }] }, at('2026-11-03'));
    assert.equal((await read(context.dataOperacao)).itens[0].linha, 'EXCECAO');
    await assert.rejects(saveTraffic(f.db, 1, { ...source, revisao: 2 }, at('2026-11-04')));
    assert.equal(f.data.versions.length, 3);
  }
});

test('primeira edicao preserva modelo legado apenas desde a ultima data conhecida no fuso operacional', async () => {
  const f = fixture();
  f.data.models.push({ id: 1, ...modelContext, tipo: 'ESCALA', nome: 'Legado', revisao: 7,
    responsavelId: 8, updatedAt: new Date('2026-11-03T02:00:00Z'), conteudo: JSON.stringify({ version: 1, itens: [row] }) });
  assert.equal((await resolveDateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-01' })).recorrente, false);
  assert.equal((await dateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-02' }))[0].linha, '999');
  await saveTraffic(f.db, 1, { ...modelCommand, revisao: 7, itens: [{ ...row, linha: 'NOVA' }] }, () => new Date('2026-11-03T16:00:00Z'));
  assert.equal(f.data.versions[0].vigenteDesde, '2026-11-02');
  assert.equal(f.data.versions[0].responsavelId, 8);
  assert.equal((await dateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-02' }))[0].linha, '999');
  assert.equal((await dateProgramming(f.db, 'ESCALA', context))[0].linha, 'NOVA');
});

test('falha de historico e virada de dia desfazem modelo e versao juntos', async () => {
  const f = fixture();
  await saveTraffic(f.db, 1, modelCommand, now);
  const before = structuredClone(f.data);
  f.db.trafegoModeloVersao.create = async () => { throw new Error('falha simulada'); };
  await assert.rejects(saveTraffic(f.db, 1, { ...modelCommand, revisao: 1 }, now));
  assert.deepEqual(f.data, before);
  const g = fixture(); let calls = 0;
  await assert.rejects(saveTraffic(g.db, 1, modelCommand, () => new Date(++calls === 1 ? '2026-11-03T03:59:59Z' : '2026-11-03T04:00:01Z')), (e: any) => e.status === 409);
  assert.equal(g.data.models.length, 0); assert.equal(g.data.versions.length, 0);
});

test('folhas finalizadas conservam conteudo apos nova vigencia, inclusive em consulta passada', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, modelCommand, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 0, operacao: 'iniciar' }, fleet, async () => null, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 1, id: row.id,
    carroSubstituido: '', base: fixedScheduleToken(context, row.id, [row]) }, fleet, async () => null, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 2, operacao: 'finalizar' }, fleet, async () => null, now);
  const scaleContent = f.data.daily.conteudo;
  await saveTraffic(f.db, 1, { ...modelCommand, revisao: 1, itens: [{ ...row, linha: 'NOVA' }] }, () => new Date('2026-11-10T16:00:00Z'));
  assert.equal((await readEscalaDiaria(f.db, context, 1, fleet, async () => null)).programacao[0].linha, '999');
  assert.equal(f.data.daily.conteudo, scaleContent);
  const evening = { ...context, turno: 'VESPERTINO' as const };
  const { dataOperacao: _date, ...base } = evening;
  const release = { ...modelCommand, tipo: 'SOLTURA', contexto: base, itens: [{ ...row, carroProgramado: '' }] };
  f.db.soltura.findMany = async () => [];
  await saveTraffic(f.db, 1, release, now);
  f.data.sheet = { status: 'FINALIZADA', conteudo: JSON.stringify({ version: 1, itens: release.itens, eventos: [] }) };
  const releaseContent = f.data.sheet.conteudo;
  await saveTraffic(f.db, 1, { ...release, revisao: 1, itens: [{ ...row, linha: 'NOVA', carroProgramado: '' }] }, () => new Date('2026-11-10T16:00:00Z'));
  const read = await readReleaseProgramming(f.db, evening, 1, fleet, async () => null);
  assert.equal(read.itens[0].linha, '999'); assert.equal(f.data.sheet.conteudo, releaseContent);
});

test('prioridade: data específica, recorrente salvo, JSON; isolamento por tipo, turno e garagem', async () => {
  const f = fixture();
  assert.equal((await dateProgramming(f.db, 'ESCALA', context)).length, 202);
  await saveTraffic(f.db, 1, modelCommand, now);
  assert.equal((await dateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-10' }))[0].linha, '999');
  const resolved = await resolveDateProgramming(f.db, 'ESCALA', context);
  assert.equal(resolved.recorrente, true); assert.equal(resolved.excecao, false);
  await saveTraffic(f.db, 1, { ...command, itens: [{ ...row, linha: 'ESPECIAL' }] }, now);
  assert.equal((await dateProgramming(f.db, 'ESCALA', context))[0].linha, 'ESPECIAL');
  assert.equal((await dateProgramming(f.db, 'SOLTURA', context)).length, 202);
  assert.notEqual((await dateProgramming(f.db, 'ESCALA', { ...context, garagem: 'VCM' }))[0].linha, '999');
  assert.equal((await listTraffic(f.db, 1, 'VCG')).padroes[0].revisao, 1);
});

test('modelo recorrente mantém revisão, exige perfil/garagem e não grava data fictícia', async () => {
  const f = fixture();
  await saveTraffic(f.db, 1, modelCommand, now);
  await assert.rejects(saveTraffic(f.db, 1, modelCommand, now), (e: any) => e.status === 409);
  await saveTraffic(f.db, 1, { ...modelCommand, revisao: 1, nome: 'Novo nome' }, now);
  assert.equal(f.data.models[0].revisao, 2); assert.equal(f.data.rows.length, 0);
  assert.equal('dataOperacao' in f.data.models[0], false);
  f.data.role = 'COLABORADOR';
  await assert.rejects(saveTraffic(f.db, 1, { ...modelCommand, revisao: 2 }, now), (e: any) => e.status === 403);
  f.data.role = 'soltura'; f.data.garage = 'VCM';
  await assert.rejects(saveTraffic(f.db, 1, { ...modelCommand, revisao: 2 }, now), (e: any) => e.status === 403);
});

test('mudança de data atualiza o mesmo cadastro e libera a data antiga para o recorrente', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, modelCommand, now); await saveTraffic(f.db, 1, command, now);
  const destination = { ...context, dataOperacao: '2026-11-10' };
  await saveTraffic(f.db, 1, { ...command, revisao: 1, origem: context, contexto: destination, itens: [{ ...row, linha: 'MOVIDA' }] }, now);
  assert.equal(f.data.rows.length, 1); assert.equal(f.data.rows[0].id, 1); assert.equal(f.data.rows[0].revisao, 2);
  assert.equal((await dateProgramming(f.db, 'ESCALA', context))[0].linha, '999');
  assert.equal((await dateProgramming(f.db, 'ESCALA', destination))[0].linha, 'MOVIDA');
});

test('mudança de data rejeita colisão, revisão antiga e origem/destino já iniciados', async () => {
  const f = fixture(); const destination = { ...context, dataOperacao: '2026-11-10' };
  await saveTraffic(f.db, 1, command, now); await saveTraffic(f.db, 1, { ...command, contexto: destination }, now);
  const move = { ...command, revisao: 1, origem: context, contexto: destination };
  await assert.rejects(saveTraffic(f.db, 1, move, now), (e: any) => e.status === 409 && /destino/.test(e.message));
  assert.equal(f.data.rows.length, 2);
  f.data.rows.pop();
  await assert.rejects(saveTraffic(f.db, 1, { ...move, revisao: 0 }, now), (e: any) => e.status === 409);
  for (const started of [context.dataOperacao, destination.dataOperacao]) {
    f.db.escalaDiaria.findUnique = async ({ where }: any) => where.garagem_escalaTipo_turno_dataOperacao.dataOperacao === started ? { id: 99 } : null;
    await assert.rejects(saveTraffic(f.db, 1, move, now), (e: any) => e.status === 409 && /iniciada/.test(e.message));
  }
  assert.equal(f.data.rows[0].dataOperacao, context.dataOperacao);
});

test('alterar recorrente não muda linhas de uma Escala já iniciada', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, modelCommand, now);
  await saveEscalaDiaria(f.db, 1, { contexto: context, revisao: 0, operacao: 'iniciar' }, fleet, async () => null, now);
  await saveTraffic(f.db, 1, { ...modelCommand, revisao: 1, itens: [{ ...row, linha: 'FUTURA' }] }, now);
  const read = await readEscalaDiaria(f.db, context, 1, fleet, async () => null);
  assert.equal(read.programacao[0].linha, '999');
  assert.equal((await dateProgramming(f.db, 'ESCALA', { ...context, dataOperacao: '2026-11-10' }))[0].linha, 'FUTURA');
});

test('modelo recorrente da Soltura herda carro vazio da Escala, e valor preenchido prevalece', () => {
  const scale = [{ ...row, carroProgramado: '4001' }];
  assert.equal(programReleaseRows(context, scale, [], [{ ...row, carroProgramado: '' }], false, true)[0].carroProgramado, '4001');
  assert.equal(programReleaseRows(context, scale, [], [row], false, true)[0].carroProgramado, '4000');
  assert.equal(programReleaseRows(context, scale, [], [{ ...row, carroProgramado: '' }], true, true)[0].carroProgramado, '');
});

test('Soltura iniciada conserva linhas e disponibilidade da fotografia após editar recorrente', async () => {
  const f = fixture(), evening = { ...context, turno: 'VESPERTINO' as const };
  const { dataOperacao: _date, ...base } = evening;
  const source = { ...modelCommand, tipo: 'SOLTURA', contexto: base, itens: [{ ...row, carroProgramado: '' }] };
  f.db.soltura.findMany = async () => [];
  await saveTraffic(f.db, 1, source, now);
  assert.equal((await readReleaseProgramming(f.db, evening, 1, fleet, async () => null)).itens[0].linha, '999');
  f.data.sheet = { status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1, itens: source.itens, eventos: [] }) };
  await saveTraffic(f.db, 1, { ...source, revisao: 1, itens: [{ ...row, linha: 'NOVA', carroProgramado: '' }] }, now);
  const read = await readReleaseProgramming(f.db, evening, 1, fleet, async () => null);
  assert.equal(read.itens[0].linha, '999'); assert.equal(read.programacao[0].linha, '999');
  assert.deepEqual(read.disponibilidade.reserva, ['4000']);
});

test('virada para a data de origem durante a mudança desfaz a atualização inteira', async () => {
  const f = fixture(); await saveTraffic(f.db, 1, command, now);
  let calls = 0;
  await assert.rejects(saveTraffic(f.db, 1, { ...command, origem: context, revisao: 1,
    contexto: { ...context, dataOperacao: '2026-11-10' } }, () => new Date(++calls < 4 ? '2026-11-08T20:00:00Z' : '2026-11-09T04:00:01Z')), (e: any) => e.status === 409);
  assert.equal(f.data.rows[0].dataOperacao, context.dataOperacao); assert.equal(f.data.rows[0].revisao, 1);
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
