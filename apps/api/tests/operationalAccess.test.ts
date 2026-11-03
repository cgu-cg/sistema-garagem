import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync } from 'node:fs';
import * as backend from '../src/services/operationalAccess';
import * as frontend from '../../web/src/lib/operationalAccess';
import { canWriteC4 } from '../src/services/c4Authorization';
import { api } from '../../web/src/lib/api';

test('politicas de tela/API concordam para perfis, grupos e garagens', () => {
  for (const role of ['ADMIN', 'manutencao', 'soltura', 'COLABORADOR', 'operacional']) {
    for (const garagem of ['VCG', 'VCM', undefined, 'vcg']) {
      for (const permissions of [[], ['/soltura'], ['/solturas'], ['/home'], ['/soltura-adm'], 'invalid']) {
        const user = { role, garagem, groups: [{ permissions }] };
        for (const fn of ['explicitGarage', 'canDispatch', 'canReadScale', 'canReadOperation', 'canReadReservations'] as const)
          assert.deepEqual(frontend[fn](user), backend[fn](user));
        assert.equal(frontend.operationPageAccess(user, '/soltura'), backend.canDispatch(user));
        assert.equal(frontend.operationPageAccess(user, '/manutencao/ci-manutencao'), backend.canReadOperation(user));
        assert.equal(frontend.operationPageAccess(user, '/escala-carros'), backend.canReadScale(user));
      }
    }
  }
});

test('email nao concede papel ou garagem; grupo de consulta nao concede edicao CI', () => {
  const user = { role: 'COLABORADOR', email: 'soltura_vcg@teste.com' };
  assert.equal(backend.explicitGarage(user), undefined);
  assert.equal(backend.canDispatch(user), false);
  assert.equal(backend.canReadOperation(user), false);
  assert.equal(backend.canDispatch({ ...user, garagem: 'VCG' }), false);
  assert.equal(backend.canDispatch({ ...user, garagem: 'VCG', groups: [{ permissions: '["/soltura"]' }] }), true);
  assert.equal(canWriteC4({ ...user, garagem: 'VCG' }, 'VCG'), false);
  assert.equal(canWriteC4({ role: 'manutencao', garagem: 'VCG' }, 'VCG'), true);
  assert.equal(canWriteC4({ role: 'manutencao', garagem: 'VCM' }, 'VCM'), false);
  assert.equal(canWriteC4({ role: 'ADMIN' }, 'VCM'), true);
});

// Injeta exclusivamente persistencia em memoria; nao importa Prisma/conexao real.
function middlewareFixture() {
  const state: any = { user: { role: 'soltura', garagem: 'VCG', groups: [] }, reserve: { garagem: 'VCM' }, reads: 0, fail: false };
  const db = {
    user: { findUnique: async () => { state.reads++; if (state.fail) throw Error('indisponivel'); return state.user; } },
    reservaTerminal: { findUnique: async () => state.reserve },
  };
  const loader = (Module as any)._load;
  const file = require.resolve('../src/middleware/operationalAccess');
  delete require.cache[file];
  let operationalAccess: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '../utils/prisma') return { __esModule: true, default: db };
      return loader.call(this, request, parent, main);
    };
    operationalAccess = require(file).operationalAccess;
  } finally { (Module as any)._load = loader; delete require.cache[file]; }
  const run = async (action: string, extra: any = {}) => {
    let status = 200, body: any, next = false;
    const req = { userId: 1, userRole: 'ADMIN', method: 'GET', originalUrl: '/api/solturas', query: {}, params: {}, body: {}, ...extra };
    await operationalAccess(action)(req, { status(code: number) { status = code; return this; }, json(value: any) { body = value; } }, () => { next = true; });
    return { status, body, next, req };
  };
  return { state, run };
}

test('middleware diferencia sessao, autorizacao, garagem e indisponibilidade sem banco real', async () => {
  const { state, run } = middlewareFixture();
  assert.equal((await run('dispatch', { userId: undefined })).status, 401);
  assert.equal(state.reads, 0);
  state.user = null;
  assert.equal((await run('dispatch')).body.code, 'SESSION_INVALID');
  state.user = { role: 'soltura' };
  assert.equal((await run('dispatch')).body.code, 'GARAGE_REQUIRED');
  state.user = { role: 'COLABORADOR', garagem: 'VCG' };
  assert.equal((await run('dispatch')).body.code, 'ACTION_FORBIDDEN');
  state.fail = true;
  assert.equal((await run('dispatch')).status, 503);
});

test('perfil atual prevalece sobre JWT antigo; grupo explicito permite apenas sua garagem', async () => {
  const { state, run } = middlewareFixture();
  state.user = { role: 'COLABORADOR', garagem: 'VCG', groups: [{ permissions: '["/soltura"]' }] };
  const allowed = await run('dispatch');
  assert.equal(allowed.next, true);
  assert.equal(allowed.req.userRole, 'COLABORADOR');
  assert.equal(allowed.req.query.garagem, 'VCG');
  assert.equal((await run('dispatch', { query: { garagem: 'VCM' } })).body.code, 'GARAGE_FORBIDDEN');
  assert.equal((await run('dispatch', { method: 'POST', body: { garagem: 'VCM' } })).status, 403);
  assert.equal((await run('dispatch', { method: 'POST' })).body.code, 'GARAGE_CONTEXT_REQUIRED');
  assert.equal((await run('admin')).status, 403);
  state.user.groups = [{ permissions: '["/home"]' }];
  assert.equal((await run('dispatch')).status, 403);
});

test('ciclo da soltura valida garagem aninhada sem aceitar garagem externa ao contexto', async () => {
  const { state, run } = middlewareFixture();
  const post = (body: unknown) => run('releaseLifecycle', { method: 'POST', body });
  assert.equal((await post({ contexto: { garagem: 'VCG' } })).next, true);
  assert.equal((await post({ contexto: { garagem: 'VCM' }, garagem: 'VCG' })).body.code, 'GARAGE_FORBIDDEN');
  assert.equal((await post({ garagem: 'VCG' })).body.code, 'GARAGE_CONTEXT_REQUIRED');
  state.user = { role: 'COLABORADOR', garagem: 'VCG' };
  assert.equal((await post({ contexto: { garagem: 'VCG' } })).body.code, 'ACTION_FORBIDDEN');
  state.user = { role: 'ADMIN' };
  assert.equal((await post({ contexto: { garagem: 'VCG' } })).next, true);
  assert.equal((await post({})).body.code, 'GARAGE_CONTEXT_REQUIRED');
  assert.match(readFileSync('apps/api/src/routes/index.ts', 'utf8'), /router\.post\('\/solturas\/estado', authenticate, operationalAccess\('releaseLifecycle'\)/);
});

test('rota de limpar, suspender e reativar recebe garagem do contexto e preserva autorizacao', async () => {
  const routes = readFileSync('apps/api/src/routes/index.ts', 'utf8');
  const action = routes.match(/router\.post\('\/solturas\/limpar-linha', authenticate, operationalAccess\('([^']+)'\), solturaController.clearLine\)/)?.[1];
  assert.ok(action, 'Rota real deve ter autorizacao explicita');
  const { state, run } = middlewareFixture();
  for (const operacao of ['limpar-linha', 'suspender-linha', 'reativar-linha']) {
    const body = { contexto: { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-11-03' }, scheduleId: 'linha-1', revisao: 1, operacao };
    assert.equal((await run(action, { method: 'POST', body })).next, true);
    assert.equal((await run(action, { method: 'POST', body: { ...body, contexto: { ...body.contexto, garagem: 'VCM' }, garagem: 'VCG' } })).body.code, 'GARAGE_FORBIDDEN');
    assert.equal((await run(action, { method: 'POST', body: { garagem: 'VCG' } })).body.code, 'GARAGE_CONTEXT_REQUIRED');
  }
  state.user = { role: 'COLABORADOR', garagem: 'VCG' };
  assert.equal((await run(action, { method: 'POST', body: { contexto: { garagem: 'VCG' } } })).body.code, 'ACTION_FORBIDDEN');
  state.user = { role: 'ADMIN' };
  assert.equal((await run(action, { method: 'POST', body: {} })).body.code, 'GARAGE_CONTEXT_REQUIRED');
  assert.equal((await run(action, { method: 'POST', body: { contexto: { garagem: 'VCG' } } })).next, true);
});

test('consulta e reservas preservam isolamento; ADMIN conserva acesso entre garagens', async () => {
  const { state, run } = middlewareFixture();
  state.user = { role: 'manutencao', garagem: 'VCM' };
  assert.equal((await run('read', { query: { garagem: 'VCM' } })).next, true);
  assert.equal((await run('read', { query: { garagem: 'VCG' } })).status, 403);
  assert.equal((await run('scale')).status, 403);
  assert.equal((await run('reservations')).status, 403);
  state.user = { role: 'COLABORADOR', garagem: 'VCM' };
  assert.equal((await run('reservations')).next, true);
  state.user = { role: 'soltura', garagem: 'VCG' };
  const removal = { method: 'DELETE', originalUrl: '/api/solturas/reservas-terminais/7', params: { id: '7' } };
  // Garagem do registro e revalidada pelo servico transacional chamado pelo controller.
  assert.equal((await run('deleteReservation', removal)).next, true);
  state.user = { role: 'COLABORADOR', garagem: 'VCG' };
  assert.equal((await run('deleteReservation', removal)).status, 403);
  state.user = { role: 'ADMIN' };
  assert.equal((await run('dispatch', { query: { garagem: 'VCM' } })).next, true);
});

test('rotas operacionais passam pelo controle atual antes dos controllers', () => {
  const routes = readFileSync('apps/api/src/routes/index.ts', 'utf8').split('\n');
  for (const line of routes.filter(l => /^router\./.test(l) && /['"]\/(solturas|ci-bloqueios|manutencao|c4\/contexto)/.test(l)))
    assert.match(line, /authenticate, operationalAccess\(/);
});

test('cliente distingue autenticacao, autorizacao e impedimento operacional sem rede', async () => {
  const previousFetch = globalThis.fetch;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
    for (const [status, category, code] of [[401, 'AUTHENTICATION', 'SESSION_INVALID'],
      [403, 'AUTHORIZATION', 'GARAGE_FORBIDDEN'], [409, 'OPERATIONAL', 'CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA']] as const) {
      globalThis.fetch = async () => new Response(JSON.stringify({ code, error: 'Mensagem da API' }), { status });
      await assert.rejects(api.get('/solturas'), (error: any) => {
        assert.equal(error.status, status);
        assert.equal(error.category, category);
        assert.equal(error.code, code);
        assert.match(error.message, /Mensagem da API/);
        return true;
      });
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('interface nao oferece despacho para perfil sem acesso, VCM, legado ou CI em preparacao', () => {
  const user = { role: 'soltura', garagem: 'VCG' };
  assert.equal(frontend.canOfferRelease(user, 'VCG', true, 'FINALIZADA'), true);
  assert.equal(frontend.canOfferRelease(user, 'VCM', true, 'FINALIZADA'), false);
  assert.equal(frontend.canOfferRelease({ ...user, garagem: 'VCM' }, 'VCG', true, 'FINALIZADA'), false);
  assert.equal(frontend.canOfferRelease(user, 'VCG', false, 'FINALIZADA'), false);
  assert.equal(frontend.canOfferRelease(user, 'VCG', true, 'EM_PREPARACAO'), false);
  assert.equal(frontend.canOfferRelease(user, 'VCG', true), false);
  assert.equal(frontend.canOfferRelease({ role: 'COLABORADOR', garagem: 'VCG' }, 'VCG', true, 'FINALIZADA'), false);
});
