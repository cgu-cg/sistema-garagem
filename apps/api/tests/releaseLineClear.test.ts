import test from 'node:test';
import assert from 'node:assert/strict';
import { clearReleaseLine } from '../src/services/releaseLineClear';
import { releaseLineToken } from '../src/services/lineClearAudit';
import { completedReleaseRows } from '../src/services/releaseLifecycle';
import { releaseReportRows } from '../src/services/releaseLifecycle';
import { readReleaseLifecycle, parseReleaseSheet } from '../src/services/releaseLifecycle';
import { readReleaseProgramming } from '../src/services/releaseProgramming';
import { loadReleaseLifecycle } from '../../web/src/lib/releaseLifecycle';
import { loadReleaseProgramming } from '../../web/src/lib/releaseProgramming';
import { api } from '../../web/src/lib/api';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-11-03' } as const;
const now = () => new Date('2026-11-03T18:00:00Z');

test('limpar permite reler estado e programacao pelo contrato real do cliente sem perder a auditoria', async () => {
  const f = fixture(); await clearReleaseLine(f.db, 7, f.command(), now);
  const contents = f.state.sheet.conteudo;
  const get = api.get;
  try {
    api.get = (async (path: string) => path === '/solturas/estado' ? readReleaseLifecycle(f.db, context, 7)
      : readReleaseProgramming(f.db, context, 7, async () => ({ source: 'real', data: [{ prefixo: '4000', idCarro: '4000', garagem: 'VCG' }] }), async () => null)) as typeof api.get;
    const state = await loadReleaseLifecycle(context);
    const programming = await loadReleaseProgramming(context);
    assert.equal(state.status, 'EM_ANDAMENTO'); assert.equal(state.revisao, 2);
    assert.equal(programming.itens[0].suspensa, false);
    assert.equal(programming.itens[0].carroProgramado, '');
    assert.equal(programming.itens[0].status, 'PENDENTE');
    assert.equal(parseReleaseSheet(contents).limpezas?.length, 1);
    assert.equal(f.state.sheet.conteudo, contents, 'Consulta não reescreve a folha');
  } finally { api.get = get; }
});

test('metadados invalidos nao sao persistidos e erro de folha salva identifica o campo sem expor dados', async () => {
  const f = fixture(), before = structuredClone(f.state);
  await assert.rejects(clearReleaseLine(f.db, -1, f.command(), now), /limpezas.0.usuarioId/);
  assert.deepEqual(f.state, before);
  const invalid = JSON.parse(f.state.sheet.conteudo);
  invalid.limpezas = [{ id: 'invalido', linhaId: 'r1', usuarioId: 7, registradoEm: now().toISOString(), anterior: 'DADO_INTERNO_PRIVADO' }];
  assert.throws(() => parseReleaseSheet(JSON.stringify(invalid)), error => error instanceof Error && /limpezas.0.id/.test(error.message) && !error.message.includes('DADO_INTERNO_PRIVADO'));
});
test('suspender limpa dados, resolve a viagem sem liberar e reativar volta a exigir despacho', async () => {
  const f = fixture();
  await clearReleaseLine(f.db, 7, { ...f.command(), operacao: 'suspender-linha' }, now);
  let sheet = JSON.parse(f.state.sheet.conteudo);
  assert.equal(sheet.itens[0].suspensa, true);
  assert.equal(f.state.line.carroRealizado, null); assert.equal(f.state.line.driverCode, null);
  assert.equal(completedReleaseRows(sheet.itens, [f.state.line]), true);
  assert.equal(releaseReportRows(sheet.itens, [f.state.line])[0].status, 'SUSPENSA');
  await clearReleaseLine(f.db, 7, { ...f.command(), operacao: 'reativar-linha' }, now);
  sheet = JSON.parse(f.state.sheet.conteudo);
  assert.equal(sheet.itens[0].suspensa, false);
  assert.equal(sheet.limpezas.length, 2);
  assert.equal(completedReleaseRows(sheet.itens, [f.state.line]), false);
});

test('suspender viagem nunca despachada, revisar estado/revisao e proteger finalizadas', async () => {
  const f = fixture(); f.db.soltura.findMany = async () => [];
  await clearReleaseLine(f.db, 7, { ...f.command(), base: undefined, operacao: 'suspender-linha' }, now);
  assert.equal(completedReleaseRows(JSON.parse(f.state.sheet.conteudo).itens, []), true);
  await assert.rejects(clearReleaseLine(f.db, 7, { ...f.command(), operacao: 'suspender-linha' }, now), /Estado/);
  f.state.sheet.status = 'FINALIZADA'; const before = structuredClone(f.state);
  await assert.rejects(clearReleaseLine(f.db, 7, { ...f.command(), operacao: 'reativar-linha' }, now), /finalizada/);
  assert.deepEqual(f.state, before);
});
function fixture() {
  const state: any = { role: 'soltura', garage: 'VCG', fail: false,
    line: { id: 1, ...context, scheduleId: 'r1', linha: '302', tabela: '1', carroProgramado: null,
      carroRealizado: '4000', busId: 5, driverCode: '123', driverName: 'Motorista', horaLiberacao: '14:00',
      historicoTrocas: '[]', status: 'LIBERADO', notes: 'anterior' },
    sheet: { id: 1, status: 'EM_ANDAMENTO', revisao: 1, conteudo: JSON.stringify({ version: 1,
      itens: [{ id: 'r1', linha: '302', tabela: '1', saidaGaragem: '14:00', carroProgramado: '' }], eventos: [] }) } };
  const db: any = { user: { findUnique: async () => ({ role: state.role, garagem: state.garage }) },
    $queryRaw: async () => [],
    folhaSoltura: { findUnique: async () => state.sheet, update: async ({ data }: any) => {
      if (state.fail) throw Error('falha folha'); Object.assign(state.sheet, data); return state.sheet;
    } },
    soltura: { findMany: async ({ where }: any) => Object.entries(where).every(([k, v]) => state.line[k] === v) ? [state.line] : [],
      update: async ({ data }: any) => Object.assign(state.line, data) },
    $transaction: async (fn: any) => { const before = structuredClone(state); try { return await fn(db); }
      catch (e) { Object.assign(state, before); throw e; } },
    get folhaCI() { throw Error('vespertino não depende da CI'); },
  };
  const command = () => ({ contexto: context, scheduleId: 'r1', revisao: state.sheet.revisao, base: releaseLineToken(state.line) });
  return { state, db, command };
}

test('limpar retira carro/MOTO e confirmacao, preservando registro anterior auditado e a viagem', async () => {
  const f = fixture(); const before = structuredClone(f.state.line);
  await clearReleaseLine(f.db, 7, f.command(), now);
  assert.equal(f.state.line.status, 'PENDENTE'); assert.equal(f.state.line.carroRealizado, null);
  assert.equal(f.state.line.driverCode, null); assert.equal(f.state.line.horaLiberacao, null);
  assert.equal(f.state.line.busId, null); assert.equal(f.state.line.scheduleId, 'r1');
  assert.equal(f.state.line.historicoTrocas, before.historicoTrocas);
  const sheet = JSON.parse(f.state.sheet.conteudo);
  assert.deepEqual(JSON.parse(sheet.limpezas[0].anterior), before);
  assert.equal(sheet.limpezas[0].usuarioId, 7); assert.equal(f.state.sheet.revisao, 2);
  assert.equal(completedReleaseRows(sheet.itens, [f.state.line]), false);
  await assert.rejects(clearReleaseLine(f.db, 7, f.command(), now), /liberação/);
});

test('limpeza rejeita folha finalizada, outra data/garagem, falta de permissao e base obsoleta', async () => {
  for (const mutate of [(f: any) => { f.state.sheet.status = 'FINALIZADA'; },
    (f: any) => { f.state.role = 'manutencao'; }, (f: any) => { f.state.garage = 'VCM'; }]) {
    const f = fixture(); mutate(f); const before = structuredClone(f.state);
    await assert.rejects(clearReleaseLine(f.db, 7, f.command(), now)); assert.deepEqual(f.state, before);
  }
  const f = fixture(), command = f.command(); f.state.line.driverCode = '999';
  await assert.rejects(clearReleaseLine(f.db, 7, command, now), /outro posto/);
  await assert.rejects(clearReleaseLine(f.db, 7, { ...f.command(), revisao: 0 }, now), /outro posto/);
  await assert.rejects(clearReleaseLine(f.db, 7, f.command(), () => new Date('2026-11-04T18:00:00Z')), /dia/);
  await assert.rejects(clearReleaseLine(f.db, 7, { ...f.command(), contexto: { ...context, garagem: 'VCM' } }, now), /VCG/);
});

test('falha na folha ou virada de data desfaz a retirada do carro e motorista', async () => {
  const f = fixture(); f.state.fail = true; const before = structuredClone(f.state);
  await assert.rejects(clearReleaseLine(f.db, 7, f.command(), now), /falha/); assert.deepEqual(f.state, before);
  const g = fixture(), original = structuredClone(g.state); let calls = 0;
  await assert.rejects(clearReleaseLine(g.db, 7, g.command(), () => new Date(++calls < 3 ? '2026-11-04T03:59:59Z' : '2026-11-04T04:00:00Z')));
  assert.deepEqual(g.state, original);
});
