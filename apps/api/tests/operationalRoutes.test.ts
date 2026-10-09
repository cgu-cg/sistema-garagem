import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import express from 'express';
import { readFileSync } from 'node:fs';
import { removeReserva } from '../src/services/reservaTerminal';

function fixture() {
  const state: any = { user: { role: 'soltura', garagem: 'VCG', groups: [] },
    reserve: { id: 7, garagem: 'VCG', userId: 99 }, deleted: 0, deleteCalls: 0,
    scaleWrites: 0, scaleReads: 0, userReads: 0, revoke: false };
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
  assert.match(page, /<AlterarCarroProgramadoView\s+readOnly=\{!isAdmin\}/);
  const view = readFileSync('apps/web/src/pages/soltura/AlterarCarroProgramadoView.tsx', 'utf8');
  assert.match(view, /<fieldset disabled=\{readOnly\}/);
});
