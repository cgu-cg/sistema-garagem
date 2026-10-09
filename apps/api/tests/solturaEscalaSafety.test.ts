import test from 'node:test';
import assert from 'node:assert/strict';
import { refuseUnconfirmedRelease } from '../src/services/solturaSafety';
import { readEscala, saveEscala, escalaCommandSchema } from '../src/services/escalaCarros';
import { confirmedWrite } from '../../web/src/lib/confirmedWrite';
import Module from 'node:module';

const contexto = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' };
const item = { id: '1', linha: '10', tabela: '1', carroProgramado: '4000', saidaGaragem: '06:00', status: 'PENDENTE' };
function fixture() {
  let record: any = null, items: any[] = [], fail = false;
  const options: any[] = [], queries: string[] = [];
  const db: any = {
    user: { findUnique: async () => ({ role: 'ADMIN' }) },
    $queryRaw: async (sql: TemplateStringsArray) => { queries.push(sql.join('?')); return []; },
    escalaCarros: {
      findUnique: async () => record ? { ...record, itens: items } : null,
      create: async ({ data }: any) => record = { id: 1, ...data },
      update: async ({ data }: any) => record = { ...record, ...data },
    },
    itemEscalaCarros: {
      deleteMany: async () => { items = []; },
      create: async ({ data }: any) => { if (fail) throw new Error('Falha de persistencia'); items.push(data); },
    },
    $transaction: async (fn: any, option: any) => {
      options.push(option); const backup = structuredClone({ record, items });
      try { return await fn(db); } catch (e) { record = backup.record; items = backup.items; throw e; }
    },
  };
  return { db, options, queries, fail: () => { fail = true; } };
}
test('contencao recusa soltura sem confirmar disponibilidade', () => {
  let status = 0, body: any;
  refuseUnconfirmedRelease({ status: code => { status = code; return { json: value => { body = value; } }; } });
  assert.equal(status, 409); assert.equal(body.code, 'DISPONIBILIDADE_NAO_CONFIRMADA');
});
test('endpoints individual e lote recusam payload adulterado sem consultar ou escrever banco', async () => {
  const loader = (Module as any)._load;
  let controller: any, dbCalls = 0;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '../utils/prisma') return { __esModule: true, default: new Proxy({}, { get() { dbCalls++; throw new Error('Banco proibido'); } }) };
      return loader.call(this, request, parent, main);
    };
    controller = require('../src/controllers/soltura');
  } finally { (Module as any)._load = loader; }
  for (const garagem of ['VCG', 'VCM']) for (const command of ['create', 'syncBatch']) {
    let code = 0;
    const res = { status(n: number) { code = n; return this; }, json(body: any) { assert.ok(['LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL', 'FONTE_VCM_NAO_COMPROVADA'].includes(body.code)); } };
    await controller[command]({ body: { garagem, dataOperacao: '2026-10-08', linha: '10', tabela: '1', carroRealizado: '4000', disponivel: true, bloqueado: false, items: [{ scheduleId: '1', linha: '10', tabela: '1', carroRealizado: '4000' }] } }, res);
    assert.equal(code, 409);
  }
  assert.equal(dbCalls, 0);
});
test('frontend nao aplica sucesso enquanto API esta pendente ou falha', async () => {
  let apply = 0, resolve!: (value: number) => void;
  const pending = confirmedWrite(() => new Promise<number>(r => { resolve = r; }), () => { apply++; });
  assert.equal(apply, 0); resolve(1); await pending; assert.equal(apply, 1);
  await assert.rejects(confirmedWrite(async () => { throw new Error('API'); }, () => { apply++; }));
  assert.equal(apply, 1);
});
test('escala inexistente e somente leitura, dois postos recebem mesma revisao', async () => {
  const f = fixture();
  assert.deepEqual((await readEscala(f.db, contexto, 1)).itens, []);
  assert.equal(f.queries.length, 0);
  await saveEscala(f.db, 1, { contexto, revisao: 0, itens: [item] });
  const a = await readEscala(f.db, contexto, 1), b = await readEscala(f.db, contexto, 1);
  assert.deepEqual(a, b); assert.equal(a.revisao, 1); assert.equal(a.itens[0].carroProgramado, '4000');
  assert.match(f.queries[0], /UPDLOCK,HOLDLOCK/);
  assert.ok(f.options.every(o => o.isolationLevel === 'Serializable'));
});
test('revisao obsoleta retorna 409 sem perda da publicacao vencedora', async () => {
  const f = fixture();
  await saveEscala(f.db, 1, { contexto, revisao: 0, itens: [item] });
  await assert.rejects(saveEscala(f.db, 1, { contexto, revisao: 0, itens: [] }), (e: any) => e.status === 409);
  assert.equal((await readEscala(f.db, contexto, 1)).itens.length, 1);
});
test('falha no lote de escala restaura cabecalho, revisao e itens', async () => {
  const f = fixture();
  await saveEscala(f.db, 1, { contexto, revisao: 0, itens: [item] });
  f.fail(); await assert.rejects(saveEscala(f.db, 1, { contexto, revisao: 1, itens: [{ ...item, carroProgramado: '4001' }] }));
  const result = await readEscala(f.db, contexto, 1);
  assert.equal(result.revisao, 1); assert.equal(result.itens[0].carroProgramado, '4000');
});
test('escala recusa nao ADMIN, duplicidade, contexto invalido e campos de soltura', async () => {
  const f = fixture(); f.db.user.findUnique = async () => ({ role: 'COLABORADOR' });
  await assert.rejects(saveEscala(f.db, 1, { contexto, revisao: 0, itens: [item] }), (e: any) => e.status === 403);
  assert.equal(f.queries.length, 0);
  for (const itens of [[item, item], [{ ...item, carroRealizado: '4000' }]])
    assert.equal(escalaCommandSchema.safeParse({ contexto, revisao: 0, itens }).success, false);
  assert.equal(escalaCommandSchema.safeParse({ contexto: { ...contexto, turno: 'PADRAO' }, revisao: 0, itens: [] }).success, false);
});
test('programacao preserva marcadores e carro repetido em viagens distintas', () => {
  assert.equal(escalaCommandSchema.safeParse({ contexto, revisao: 0, itens: [
    { ...item, carroProgramado: '4220R' },
    { ...item, id: '2', carroProgramado: '4220R' },
  ] }).success, true);
});

test('cache local LIBERADO nao sobrepoe bloqueio oficial e nao depende de 09/09', () => {
  const ci = require('../../web/src/pages/soltura/ciManager');
  const c4 = require('../../web/src/lib/c4');
  const garage = ci.getCurrentCIGarage();
  c4.storeC4Context({ mode: 'LEGADO', garagem: garage, garages: [] }, '2026-10-08');
  const previous = (globalThis as any).localStorage;
  (globalThis as any).localStorage = { getItem: () => JSON.stringify([{ prefixo: '4000', liberado: true }]) };
  try {
    const blocked = { prefixo: '4000', status: 'BLOQUEADO', categoriaPlanilha: 'BLOQUEADO' };
    assert.equal(ci.checkCarroBloqueado('4000', [blocked], '2026-10-08'), blocked);
  } finally { (globalThis as any).localStorage = previous; }
});


test('consulta da escala respeita usuario e garagem antes de ler programacao', async () => {
  const f = fixture();
  f.db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCM' });
  await assert.rejects(readEscala(f.db, contexto, 1), (e: any) => e.status === 403);
  await assert.rejects(readEscala(f.db, contexto, undefined), (e: any) => e.status === 403);
  f.db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCG' });
  assert.equal((await readEscala(f.db, contexto, 1)).revisao, 0);
});
