import test from 'node:test';
import assert from 'node:assert/strict';
import { appendReleaseExchange, garageDefects } from '../src/services/releaseVehicleExchange';
import { releaseWithdrawals, undoReleaseWithdrawals } from '../src/services/releaseWithdrawals';
import { treatReleaseCar } from '../src/services/releaseTreatment';
import { writeSafeRelease } from '../src/services/solturaAvailability';
import { clearReleaseLine } from '../src/services/releaseLineClear';
import { changeReleaseLifecycle } from '../src/services/releaseLifecycle';
import { releaseLineToken } from '../src/services/lineClearAudit';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';
import { createReserva } from '../src/services/reservaTerminal';
import { readReleaseProgramming } from '../src/services/releaseProgramming';
import { loadReleaseProgramming } from '../../web/src/lib/releaseProgramming';
import { api } from '../../web/src/lib/api';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-11-04' } as const;
const now = () => new Date('2026-11-04T18:00:00Z');
const row = currentReleaseTemplate(context)[0];
const loadFleet = async () => ({ source: 'real', data: ['4000', '4001', '4002', '3098'].map(prefixo => ({ idCarro: prefixo, prefixo, garagem: 'VCG' })) });
function fixture() {
  const state: any = { role: 'soltura', garage: 'VCG', ci: [], fail: false, terminals: [], records: [],
    sheet: { id: 1, status: 'EM_ANDAMENTO', revisao: 1, conteudo: JSON.stringify({ version: 1, eventos: [], itens: [{ ...row, carroProgramado: '' }] }) } };
  const db: any = {
    user: { findUnique: async () => ({ role: state.role, garagem: state.garage }) },
    $queryRaw: async () => [],
    folhaCI: { findUnique: async () => ({ itens: state.ci }) },
    reservaTerminal: { findMany: async () => state.terminals, create: async ({ data }: any) => { state.terminals.push(data); return data; } },
    folhaSoltura: { findUnique: async () => state.sheet, update: async ({ data }: any) => {
      if (state.fail) throw Error('falha folha'); Object.assign(state.sheet, data); return state.sheet;
    } },
    soltura: {
      findMany: async ({ where }: any) => state.records.filter((r: any) => Object.entries(where).every(([k, v]) => r[k] === v)),
      create: async ({ data }: any) => { const record = { id: state.records.length + 1, ...data }; state.records.push(record); return record; },
      update: async ({ where, data }: any) => { const record = state.records.find((r: any) => r.id === where.id); Object.assign(record, data); return record; },
    },
    $transaction: async (fn: any) => { const before = structuredClone(state); try { return await fn(db); }
      catch (e) { Object.assign(state, before); throw e; } },
  };
  const write = (prefixo: string) => writeSafeRelease(db, 7, { ...context, scheduleId: row.id, linha: row.linha, tabela: row.tabela,
    carroRealizado: prefixo, driverCode: '123' }, false, now, () => [], loadFleet);
  const command = (destino: 'RESERVA' | 'BLOQUEAR', motivo = '') => {
    const retirada = releaseWithdrawals(state.records)[0];
    return { contexto: context, revisao: state.sheet.revisao, registroId: retirada.registroId, trocaId: retirada.trocaId, base: retirada.base, destino, motivo };
  };
  return { state, db, write, command };
}

test('programado e origem da primeira substituicao; motorista sozinho nao cria retirada', () => {
  assert.deepEqual(appendReleaseExchange([], '4000', '4000', undefined, 7, now()), []);
  const history = appendReleaseExchange([], '4000', '4001', undefined, 7, now());
  assert.equal(history[0].carroAnterior, '4000'); assert.equal(history[0].destino, 'PENDENTE');
  assert.equal(history[0].origem, 'SOLTURA');
});

test('vespertino primeiro carro nao retira ninguem; nova troca bloqueia reutilizacao ate tratar', async () => {
  const f = fixture(); await f.write('4000');
  assert.deepEqual(releaseWithdrawals(f.state.records), []);
  await f.write('4001'); const retirada = releaseWithdrawals(f.state.records)[0];
  assert.equal(retirada.prefixo, '4000'); assert.equal(retirada.destino, 'PENDENTE');
  assert.equal(retirada.base, releaseLineToken(f.state.records[0]));
  await assert.rejects(f.write('4000'), /CARRO_AGUARDANDO_TRATATIVA/);
  await treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet);
  assert.deepEqual(releaseWithdrawals(f.state.records), []);
  await f.write('4000');
  assert.equal(releaseWithdrawals(f.state.records)[0].prefixo, '4001');
});

test('tratativa bloqueia com motivo, desbloqueia explicitamente e preserva historico e motorista', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  const original = JSON.parse(f.state.records[0].historicoTrocas)[0];
  await assert.rejects(treatReleaseCar(f.db, 7, f.command('BLOQUEAR'), now, loadFleet), /motivo/);
  await treatReleaseCar(f.db, 7, f.command('BLOQUEAR', 'MOTOR'), now, loadFleet);
  assert.equal(releaseWithdrawals(f.state.records)[0].destino, 'BLOQUEAR');
  assert.equal(garageDefects(f.state.records)[0].descricao, 'MOTOR');
  await assert.rejects(f.write('4000'), /DEFEITO_GARAGEM/);
  await treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet);
  const event = JSON.parse(f.state.records[0].historicoTrocas)[0];
  assert.equal(event.id, original.id); assert.equal(event.usuarioId, original.usuarioId);
  assert.equal(event.tratativas.length, 2); assert.equal(event.destino, 'RESERVA');
  assert.equal(f.state.records[0].driverCode, '123'); assert.equal(f.state.records[0].carroRealizado, '4001');
  assert.deepEqual(garageDefects(f.state.records), []);
});

test('permissao, folha finalizada, revisao e token sao revalidados sem gravacao parcial', async () => {
  for (const mutate of [(f: any) => { f.state.role = 'manutencao'; }, (f: any) => { f.state.garage = 'VCM'; },
    (f: any) => { f.state.sheet.status = 'FINALIZADA'; }, (f: any) => { f.state.sheet.revisao++; },
    (f: any) => { f.state.records[0].driverCode = '999'; }]) {
    const f = fixture(); await f.write('4000'); await f.write('4001'); const command = f.command('RESERVA');
    mutate(f); const before = structuredClone(f.state);
    await assert.rejects(treatReleaseCar(f.db, 7, command, now, loadFleet)); assert.deepEqual(f.state, before);
  }
});

test('desbloqueio nao remove bloqueio CI ou outra retirada; falha de persistencia reverte historico', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  f.state.ci = [{ prefixo: '4000', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' }];
  await assert.rejects(treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet), /CI/);
  f.state.ci = []; f.state.fail = true; const before = structuredClone(f.state);
  await assert.rejects(treatReleaseCar(f.db, 7, f.command('BLOQUEAR', 'MOTOR'), now, loadFleet), /falha folha/);
  assert.deepEqual(f.state, before);
  f.state.fail = false;
  const other = { ...f.state.records[0], id: 99, turno: 'MATUTINO', scheduleId: 'outro', carroRealizado: '4002' };
  f.state.records.push(other);
  await assert.rejects(treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet), /independente/);
});

test('limpar desfaz toda sequencia da linha mas conserva os eventos e nao toca defeito legado', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  await treatReleaseCar(f.db, 7, f.command('BLOQUEAR', 'MOTOR'), now, loadFleet);
  await f.write('4002');
  await clearReleaseLine(f.db, 7, { contexto: context, scheduleId: row.id, revisao: f.state.sheet.revisao, base: releaseLineToken(f.state.records[0]) }, now);
  assert.equal(f.state.records[0].carroRealizado, null); assert.equal(f.state.records[0].driverCode, null);
  assert.deepEqual(releaseWithdrawals(f.state.records), []);
  const history = JSON.parse(f.state.records[0].historicoTrocas);
  assert.equal(history.length, 2); assert.ok(history.every((event: any) => event.destino === 'DESFEITO'));
  assert.deepEqual(garageDefects(f.state.records), []);
  await f.write('4000'); assert.equal(JSON.parse(f.state.records[0].historicoTrocas).length, 2);
  const legacy = [{ carroAnterior: '3098', motivo: 'Defeito Garagem' }];
  assert.deepEqual(undoReleaseWithdrawals(legacy, new Set(), 7, now()), legacy);
  assert.equal(garageDefects([{ historicoTrocas: legacy }])[0].prefixo, '3098');
});

test('limpar recusa carro retirado em uso ou reserva terminal e reverte tudo', async () => {
  for (const terminal of [false, true]) {
    const f = fixture(); await f.write('4000'); await f.write('4001');
    if (terminal) f.state.terminals.push({ carro: '4000' });
    else f.state.records.push({ ...f.state.records[0], id: 99, scheduleId: 'outro', carroRealizado: '4000', historicoTrocas: '[]' });
    const before = structuredClone(f.state);
    await assert.rejects(clearReleaseLine(f.db, 7, { contexto: context, scheduleId: row.id,
      revisao: f.state.sheet.revisao, base: releaseLineToken(f.state.records[0]) }, now), /uso/);
    assert.deepEqual(f.state, before);
  }
});

test('finalizacao exige tratativa; origem de outro turno e legado continuam protegidos', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  await assert.rejects(changeReleaseLifecycle(f.db, 7, { contexto: context, revisao: f.state.sheet.revisao, operacao: 'finalizar' }, now, async () => ({} as any)), /Substituidos/);
  const command = f.command('RESERVA');
  await assert.rejects(treatReleaseCar(f.db, 7, { ...command, contexto: { ...context, turno: 'MATUTINO' } }, now, loadFleet));
  f.state.records[0].historicoTrocas = JSON.stringify([{ carroAnterior: '3098', motivo: 'Defeito Garagem', descricaoDefeito: 'RADIADOR' }]);
  const legacy = releaseWithdrawals(f.state.records)[0]; assert.equal(legacy.legado, true);
  await treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet);
  assert.deepEqual(garageDefects(f.state.records), []);
});

test('reserva terminal recusa pendente e bloqueado inclusive legado; permite apos tratamento', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  const reserve = { carro: '4000', garagem: 'VCG', tipo: 'AZUL', terminal: 'NOVA BAHIA' };
  await assert.rejects(createReserva(f.db, 7, reserve, now), /pendente/);
  await treatReleaseCar(f.db, 7, f.command('BLOQUEAR', 'MOTOR'), now, loadFleet);
  await assert.rejects(createReserva(f.db, 7, reserve, now), /bloqueado/);
  await treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet);
  await createReserva(f.db, 7, reserve, now); assert.equal(f.state.terminals.length, 1);
  f.state.records[0].historicoTrocas = JSON.stringify([{ carroAnterior: '3098', motivo: 'Defeito Garagem' }]);
  await assert.rejects(createReserva(f.db, 7, { ...reserve, carro: '3098' }, now), /bloqueado/);
  f.state.role = 'manutencao';
  await assert.rejects(createReserva(f.db, 7, reserve, now), /permissao/);
});

test('contrato real do cliente recebe cards ativos sem colocar retirados na reserva', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  const get = api.get;
  try {
    api.get = (async () => readReleaseProgramming(f.db, context, 7, loadFleet, async () => null)) as typeof api.get;
    const pending = await loadReleaseProgramming(context);
    assert.equal(pending.disponibilidade!.substituidos![0].prefixo, '4000');
    assert.ok(!pending.disponibilidade!.reserva.includes('4000'));
    await treatReleaseCar(f.db, 7, f.command('BLOQUEAR', 'MOTOR'), now, loadFleet);
    const blocked = await loadReleaseProgramming(context);
    assert.deepEqual(blocked.disponibilidade!.substituidos, []);
    assert.equal(blocked.disponibilidade!.bloqueadosPortaria![0].motivo, 'MOTOR');
    await treatReleaseCar(f.db, 7, f.command('RESERVA'), now, loadFleet);
    const reserve = await loadReleaseProgramming(context);
    assert.ok(reserve.disponibilidade!.reserva.includes('4000'));
  } finally { api.get = get; }
});

test('retirada repetida nao cria duas pendencias insolúveis para o mesmo carro', async () => {
  const f = fixture(); await f.write('4000');
  f.state.records.push({ ...f.state.records[0], id: 99, scheduleId: 'outro', carroRealizado: '4002',
    historicoTrocas: JSON.stringify(appendReleaseExchange([], '4000', '4002', undefined, 7, now())) });
  const before = structuredClone(f.state);
  await assert.rejects(f.write('4001'), /JA_PENDENTE_OU_BLOQUEADO/);
  assert.deepEqual(f.state, before);
});

test('Seg-Sex, Sabado e Dom-Fer tratam na propria folha e revalidam CI/Escala finalizadas', async () => {
  for (const escalaTipo of ['SEG_SEX', 'SABADO', 'DOM_FER'] as const) {
    const f = fixture(); await f.write('4000'); await f.write('4001');
    const selected = { ...context, escalaTipo, turno: escalaTipo === 'SEG_SEX' ? 'MATUTINO' : 'PADRAO' };
    Object.assign(f.state.records[0], { escalaTipo, turno: selected.turno });
    let ciStatus = 'FINALIZADA', scaleStatus = 'FINALIZADA';
    f.db.folhaCI.findUnique = async () => ({ status: ciStatus, itens: [] });
    f.db.escalaDiaria = { findUnique: async () => ({ conteudo: JSON.stringify({ version: 3, itens: [], cards: [], confirmacoes: [],
      fluxo: { status: scaleStatus, iniciadaEm: now().toISOString(), finalizadaEm: scaleStatus === 'FINALIZADA' ? now().toISOString() : null,
        fonteCI: { ciData: context.dataOperacao, bloqueados: [], ciAvisos: [] } } }) }) };
    const command = { ...f.command('RESERVA'), contexto: selected };
    ciStatus = 'EM_PREPARACAO'; await assert.rejects(treatReleaseCar(f.db, 7, command, now, loadFleet), /CI/);
    ciStatus = 'FINALIZADA'; scaleStatus = 'EM_PREPARACAO';
    await assert.rejects(treatReleaseCar(f.db, 7, command, now, loadFleet), /Escala/);
    scaleStatus = 'FINALIZADA'; await treatReleaseCar(f.db, 7, command, now, loadFleet);
    assert.deepEqual(releaseWithdrawals(f.state.records), []);
  }
});

test('consulta da folha mostra so seu turno, data e garagem sem liberar bloqueio de outro turno', async () => {
  const f = fixture(); await f.write('4000'); await f.write('4001');
  const add = (id: number, overrides: object, prefixo: string) => f.state.records.push({ ...f.state.records[0], id, ...overrides,
    historicoTrocas: JSON.stringify([{ carroAnterior: prefixo, motivo: 'Defeito Garagem' }]) });
  add(90, { turno: 'MATUTINO' }, '3098');
  add(91, { dataOperacao: '2026-11-03' }, '4002');
  add(92, { garagem: 'VCM' }, '4002');
  const before = structuredClone(f.state);
  const result = await readReleaseProgramming(f.db, context, 7, loadFleet, async () => null);
  assert.deepEqual(result.disponibilidade.substituidos.map(r => r.prefixo), ['4000']);
  assert.deepEqual(result.disponibilidade.bloqueadosPortaria, []);
  assert.deepEqual(result.disponibilidade.defeitosGaragem.map(r => r.prefixo), ['3098']);
  assert.ok(!result.disponibilidade.reserva.includes('3098'));
  assert.ok(result.disponibilidade.reserva.includes('4002'));
  assert.deepEqual(f.state, before, 'GET nao altera historico nem reclassifica registros');
});
