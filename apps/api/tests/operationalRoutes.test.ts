import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import express from 'express';
import { readFileSync } from 'node:fs';
import { removeReserva } from '../src/services/reservaTerminal';
import * as dailyService from '../src/services/escalaDiaria';

function fixture() {
  const state: any = { user: { role: 'soltura', garagem: 'VCG', groups: [] },
    reserve: { id: 7, garagem: 'VCG', userId: 99 }, deleted: 0, deleteCalls: 0,
    scaleWrites: 0, scaleReads: 0, userReads: 0, revoke: false, daily: null, dailyWrites: 0, blocks: [] };
  const db: any = {
    user: { findUnique: async () => {
      state.userReads++;
      if (state.revoke && state.userReads > 1) return { role: 'COLABORADOR', garagem: 'VCG' };
      return state.user;
    } },
    reservaTerminal: {
      findUnique: async ({ where }: any) => state.reserve?.id === where.id ? state.reserve : null,
      deleteMany: async ({ where }: any) => {
        state.deleteCalls++;
        assert.deepEqual(where, { id: 7, garagem: state.reserve.garagem });
        state.reserve = null; state.deleted++;
        return { count: 1 };
      },
    },
    escalaCarros: {
      findUnique: async () => { state.scaleReads++; return { id: 1, revisao: 2, itens: [] }; },
      create: async () => { state.scaleWrites++; throw Error('Escrita nao esperada'); },
      update: async () => { state.scaleWrites++; throw Error('Escrita nao esperada'); },
    },
    escalaDiaria: {
      findFirst: async () => null,
      findUnique: async () => state.daily,
      create: async ({ data }: any) => { state.dailyWrites++; state.daily = { id: 1, ...data }; return state.daily; },
      update: async ({ data }: any) => { state.dailyWrites++; state.daily = { ...state.daily, ...data }; return state.daily; },
    },
    folhaCI: { findFirst: async () => null, findUnique: async () => ({ status: 'FINALIZADA', itens: state.blocks.map((prefixo: string) => ({ prefixo, categoria: 'BLOQUEADO' })) }) },
    $queryRaw: async () => [],
    $transaction: async (fn: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable');
      return fn(db);
    },
  };
  const files = ['../src/middleware/operationalAccess', '../src/controllers/reservasTerminais', '../src/controllers/escalaCarros'];
  const oldLoad = (Module as any)._load;
  const previous = files.map(f => [require.resolve(f), require.cache[require.resolve(f)]] as const);
  let access: any, reserves: any, scale: any;
  try {
    previous.forEach(([f]) => delete require.cache[f]);
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '../utils/prisma') return { __esModule: true, default: db };
      if (request === '../services/escalaDiaria') {
        const fleet = async () => ({ source: 'real', data: [{ idCarro: 5001, prefixo: '5001', garagem: 2, garagemNome: 'VCG' }] });
        return { ...dailyService, readEscalaDiaria: (d: any, q: any, id: number) => dailyService.readEscalaDiaria(d, q, id, fleet),
          saveEscalaDiaria: (d: any, id: number, body: any) => dailyService.saveEscalaDiaria(d, id, body, fleet, undefined, () => new Date('2026-10-13T16:00:00Z')) };
      }
      return oldLoad.call(this, request, parent, main);
    };
    access = require(files[0]).operationalAccess;
    reserves = require(files[1]);
    scale = require(files[2]);
  } finally {
    (Module as any)._load = oldLoad;
    previous.forEach(([f, cached]) => { if (cached) require.cache[f] = cached; else delete require.cache[f]; });
  }
  // Router Express real, middleware/controller/servicos reais; sem servidor/socket.
  const router = express.Router();
  router.delete('/solturas/reservas-terminais/:id', access('deleteReservation'), reserves.remove);
  router.get('/escala-carros', access('scale'), scale.list);
  router.post('/escala-carros', access('admin'), scale.save);
  router.get('/escala-carros/diaria', access('scale'), scale.listDaily);
  router.post('/escala-carros/diaria', access('scaleWrite'), scale.saveDaily);
  const run = (method: string, url: string, extra: any = {}) => new Promise<any>((resolve, reject) => {
    const req: any = { method, url, originalUrl: `/api${url}`, userId: 1, userRole: 'ADMIN',
      headers: {}, query: {}, body: {}, ...extra };
    const res: any = { statusCode: 200, status(code: number) { this.statusCode = code; return this; },
      json(body: any) { resolve({ status: this.statusCode, body }); } };
    router.handle(req, res, (error: any) => error ? reject(error) : reject(Error('Rota nao encontrada')));
  });
  return { state, db, run, reserves };
}

for (const url of ['/solturas/reservas-terminais/7', '/SOLTURAS/RESERVAS-TERMINAIS/7', '/SoLtUrAs/ReSeRvAs-TeRmInAiS/7']) {
  test(`DELETE ${url}: mesma garagem permite outro autor; outra garagem nunca exclui`, async () => {
    const { state, run } = fixture();
    state.reserve.garagem = 'VCM';
    assert.equal((await run('DELETE', url)).status, 403);
    assert.equal(state.deleteCalls, 0);
    assert.equal(state.deleted, 0);
    state.reserve.garagem = 'VCG';
    assert.equal((await run('DELETE', url)).status, 200);
    assert.equal(state.deleted, 1);
  });
}

test('exclusao VCM tambem recusa VCG; ADMIN atual pode excluir entre garagens', async () => {
  const { state, run } = fixture();
  state.user.garagem = 'VCM';
  assert.equal((await run('DELETE', '/solturas/reservas-terminais/7')).status, 403);
  assert.equal(state.deleteCalls, 0);
  state.user = { role: 'ADMIN' };
  assert.equal((await run('DELETE', '/solturas/reservas-terminais/7')).status, 200);
});

test('controller direto e servico nao oferecem exclusao alternativa sem autorizacao', async () => {
  const { state, db, reserves } = fixture();
  state.user = { role: 'COLABORADOR', garagem: 'VCG' };
  let status: number | undefined;
  const res: any = { status(code: number) { status = code; return this; }, json() {} };
  await reserves.remove({ userId: 1, params: { id: '7' } }, res);
  assert.equal(status, 403);
  await assert.rejects(removeReserva(db, 1, 7), (e: any) => e.status === 403);
  assert.equal(state.deleteCalls, 0);
});

test('revogacao entre middleware e transacao e revalidada antes da exclusao', async () => {
  const { state, run } = fixture();
  state.revoke = true;
  assert.equal((await run('DELETE', '/solturas/reservas-terminais/7')).status, 403);
  assert.equal(state.deleteCalls, 0);
});

for (const role of ['COLABORADOR', 'soltura']) {
  test(`Escala ${role}: consulta chega ao servico; publicacao nao executa escrita`, async () => {
    const { state, run } = fixture();
    state.user = { role, garagem: 'VCG' };
    const query = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' };
    const read = await run('GET', '/escala-carros', { query });
    assert.equal(read.status, 200);
    assert.equal(read.body.revisao, 2);
    assert.equal(state.scaleReads, 1);
    assert.equal((await run('POST', '/escala-carros', { body: { contexto: query, revisao: 2, itens: [] } })).status, 403);
    assert.equal(state.scaleWrites, 0);
    assert.equal((await run('GET', '/escala-carros', { query: { ...query, garagem: 'VCM' } })).status, 403);
  });
}

test('rota de producao vincula exclusao a acao explicita; view recebe modo somente leitura', () => {
  const routes = readFileSync('apps/api/src/routes/index.ts', 'utf8');
  assert.match(routes, /router\.delete\("\/solturas\/reservas-terminais\/:id", authenticate, operationalAccess\('deleteReservation'\), reservasTerminaisController.remove\)/);
  const page = readFileSync('apps/web/src/pages/soltura/index.tsx', 'utf8');
  assert.match(page, /readOnly=\{!canEditDailyScale \|\| !dailyReady\}/);
  const view = readFileSync('apps/web/src/pages/soltura/AlterarCarroProgramadoView.tsx', 'utf8');
  assert.match(view, /disabled=\{readOnly \|\| saving\}/);
});
test('Soltura VCG grava card diario da propria garagem; outra garagem e bloqueado sao recusados', async () => {
  const { state, run } = fixture(); state.user = { role: 'soltura', garagem: 'VCG', groups: [] };
  const contexto = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-14' };
  const body = { contexto, revisao: 0, card: 'LIMPEZA', operacao: 'adicionar', prefixo: '5001' };
  assert.equal((await run('POST', '/escala-carros/diaria', { body: { ...body, contexto: { ...contexto, garagem: 'VCM' } } })).status, 403);
  state.blocks = ['5001'];
  assert.equal((await run('POST', '/escala-carros/diaria', { body })).status, 409);
  assert.equal(state.dailyWrites, 0);
  state.blocks = [];
  assert.equal((await run('POST', '/escala-carros/diaria', { body: { contexto, revisao: 0, operacao: 'iniciar' } })).status, 200);
  assert.equal((await run('POST', '/escala-carros/diaria', { body })).status, 200);
  assert.equal(state.dailyWrites, 2);
});

test('rotas diarias preservam leitura por garagem e recusam escrita sem contexto autorizado', async () => {
  const { state, run } = fixture();
  state.user = { role: 'soltura', garagem: 'VCG', groups: [] };
  const query = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-14' };
  const read = await run('GET', '/escala-carros/diaria', { query });
  assert.equal(read.status, 200); assert.deepEqual(read.body.itens, []);
  assert.equal((await run('GET', '/escala-carros/diaria', { query: { ...query, garagem: 'VCM' } })).status, 403);
  assert.equal((await run('POST', '/escala-carros/diaria', { body: {} })).status, 403);
});
