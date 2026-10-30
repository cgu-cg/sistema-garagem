import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { createReadCoordinator, ReadInterrupted } from '../../web/src/lib/readCoordination';

const day = '2026-10-07', tomorrow = '2026-10-08';
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
const sourceCI = readFileSync('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'utf8');
// O Controle independente tem cobertura em maintenanceOffline/maintenanceBoard; C4 protege somente a CI.

test('recargas dos callbacks React com managers e eventos reais, API simulada', async t => {
  const RealDate = Date;
  const previous = { Date, window: (globalThis as any).window, localStorage: (globalThis as any).localStorage, CustomEvent: (globalThis as any).CustomEvent };
  class FixedDate extends RealDate { constructor(value?: any) { super(value === undefined ? '2026-10-07T12:00:00Z' : value); } }
  const events = new EventTarget();
  Object.assign(globalThis, { Date: FixedDate, window: events, localStorage: { setItem() {}, getItem() { return null; } },
    CustomEvent: class extends Event { detail: unknown; constructor(name: string, options: any) { super(name); this.detail = options.detail; } } });
  let version = 1, deferred = false, fail = false, conflict = false;
  const requests: { resolve: (value: any) => void; reject: (error: Error) => void; value: any }[] = [];
  const calls: any[] = [], posts: any[] = [];
  const context = (scope: string, date: string) => ({ mode: 'C4', garagem: scope, day: date, garages: ['VCG', 'VCM'], baseC4: `token-${version}`, mutable: true,
    ci: [{ id: 'c4-ci-1', prefixo: '4000', updatedAt: '2026-10-07T11:00:00.567Z', garagem: scope, data: tomorrow, categoriaPlanilha: 'OFICINA', setorOficina: 'MECANICA' }],
    maintenance: [{ id: 'c4-m-1', prefixo: '4000', updatedAt: '2026-10-07T11:00:00.567Z', data: date, consorciada: 'VCG', bloqueado: false, emExecucao: true, liberado: false, observacao: 'MOTOR' }] });
  const api = {
    get: async (url: string, options: any) => {
      calls.push({ url, ...options.params });
      const value = context(options.params.garagem, options.params.data);
      if (fail) throw new Error('Rede indisponivel');
      return deferred ? new Promise((resolve, reject) => requests.push({ resolve, reject, value })) : value;
    },
    post: async (_url: string, body: any) => {
      posts.push(body);
      if (conflict) throw Object.assign(new Error('Snapshot C4 desatualizado'), { status: 409 });
      version++;
      return { records: context(body.garagem, day).maintenance, baseC4: `token-${version}` };
    },
  };
  const loader = (Module as any)._load;
  let ci: any, temporal: any, c4: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '@/lib/api' || (request === './api' && parent.filename.endsWith(path.join('lib', 'c4.ts')))) return { api };
      return loader.call(this, request.startsWith('@/') ? path.resolve('apps/web/src', request.slice(2) + '.ts') : request, parent, main);
    };
    ci = require('../../web/src/pages/soltura/ciManager');
    temporal = require('../../web/src/lib/mvpTemporal');
    c4 = require('../../web/src/lib/c4');
  } finally { (Module as any)._load = loader; }

  function harness(kind: 'ci' | 'manutencao', scope = 'VCG', date = kind === 'ci' ? tomorrow : day) {
    const key = kind === 'ci' ? scope + '|' + date : date + '|' + scope;
    const reload = createReadCoordinator(temporal.readTicket); reload.setContext(key);
    const state = { ready: false, items: [] as any[], messages: [] as string[] };
    const env: Record<string, any> = {
      reload, dataOperacao: date, activeGaragem: scope, activeGaragemScope: scope, c4Scope: scope,
      activeContextRef: { current: key },
      setReady: (value: boolean) => { state.ready = value; }, setItems: (value: any[]) => { state.items = value; },
      setCiList: (value: any[]) => { state.items = value; }, setAdminGaragemFiltro() {}, setActiveGaragem() {},
      fetchCIBloqueiosFromApi: ci.fetchCIBloqueiosFromApi, subscribeCIUpdates: ci.subscribeCIUpdates,
      getMutationState: temporal.getMutationState, confirmRefresh: temporal.confirmRefresh, requireRefresh: temporal.requireRefresh,
      operationalContext: temporal.operationalContext, getTodayString: () => day, c4Enabled: c4.c4Enabled,
      STORAGE_KEY_MANUTENCAO_PREFIX: 'cache', toast: { success: (s: string) => state.messages.push('success:' + s), error: (s: string) => state.messages.push('error:' + s) },
    };
    const source = sourceCI;
    const handler = kind === 'ci' ? 'handleRefreshData' : 'handleResetSeed';
    const body = source.match(new RegExp(`const ${handler} = async \\(\\) => \\{([\\s\\S]*?)\\n  \\};`))?.[1];
    assert.ok(body);
    const refresh: () => Promise<void> = new Function(...Object.keys(env), 'return async()=>{' + body + '}')(...Object.values(env));
    let cleanup = () => {};
    return { state, reload, refresh,
      mount() {
        const effect = kind === 'ci'
          ? source.match(/useEffect\(\(\) => \{(\s*let active = true;[\s\S]*?)\}, \[activeGaragemScope, dataOperacao, setCiList\]\);/)?.[1]
          : source.match(/useEffect\(\(\) => \{(\s*let isMounted = true;[\s\S]*?)\}, \[dataOperacao, activeGaragem\]\);/)?.[1];
        assert.ok(effect);
        cleanup = new Function(...Object.keys(env), effect)(...Object.values(env));
      },
      destroy() { cleanup(); reload.dispose(); },
    };
  }
  const settle = () => { for (const r of requests.splice(0)) r.resolve(r.value); };
  try {
    await t.test('consulta iniciada durante gravacao e classificada como interrupcao por mutacao', async () => {
      temporal.beginMutation();
      try {
        const interrupted = (error: any) => error instanceof ReadInterrupted && error.reason === 'MUTATION';
        await assert.rejects(ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' }), interrupted);
        assert.equal(temporal.getMutationState().refreshRequired, false);
      } finally { temporal.endMutation(); }
    });
    for (const kind of ['ci'] as const) {
      await t.test(`${kind}: duas atualizacoes sobrepostas terminam sem erro ou bloqueio`, async () => {
        const h = harness(kind); deferred = true; calls.length = 0;
        const first = h.refresh(), second = h.refresh(); settle();
        await Promise.all([first, second]);
        assert.equal(calls.length, 1); assert.equal(h.state.ready, true);
        assert.equal(h.state.messages.filter(m => m.startsWith('error:')).length, 0);
        assert.equal(h.state.messages.length, 1);
        assert.equal(temporal.getMutationState().refreshRequired, false);
        deferred = false; h.destroy();
      });
      await t.test(`${kind}: falha substituida e interrupcao tipada nao bloqueiam a leitura vencedora`, async () => {
        const h = harness(kind), wait: { resolve?: (v: any) => void; reject?: (e: any) => void } = {};
        const old = h.reload.run(() => new Promise((_resolve, reject) => { wait.reject = reject; }), () => assert.fail(), () => assert.fail());
        await h.refresh(); wait.reject!(new Error('Falha antiga')); await old;
        await h.reload.run(() => Promise.reject(new ReadInterrupted('SUPERSEDED', 'Substituida')), () => assert.fail(), () => assert.fail());
        assert.equal(h.state.ready, true); assert.equal(temporal.getMutationState().refreshRequired, false);
        h.destroy();
      });
      await t.test(`${kind}: falha real bloqueia, recarga oficial recupera`, async () => {
        const h = harness(kind); fail = true; await h.refresh(); fail = false;
        assert.equal(h.state.ready, false); assert.equal(temporal.getMutationState().refreshRequired, true);
        assert.equal(h.state.messages.length, 1);
        await h.refresh(); assert.equal(h.state.ready, true); assert.equal(temporal.getMutationState().refreshRequired, false);
        h.destroy();
      });
      for (const change of ['data', 'garagem', 'desmontagem']) await t.test(`${kind}: resposta e erro antigos ignorados apos ${change}`, async () => {
        for (const outcome of ['success', 'error']) {
          const h = harness(kind); deferred = true;
          const pending = h.refresh();
          if (change === 'desmontagem') h.destroy();
          else h.reload.setContext(change === 'data' ? 'outra-data' : 'outra-garagem');
          if (outcome === 'success') settle();
          else { for (const r of requests.splice(0)) r.reject(new Error('Falha do contexto anterior')); }
          await pending;
          assert.deepEqual(h.state.items, []); assert.deepEqual(h.state.messages, []);
          assert.equal(temporal.getMutationState().refreshRequired, false);
          deferred = false; h.destroy();
        }
      });
      for (const change of ['data', 'garagem']) await t.test(`${kind}: novo contexto vence resposta antiga fora de ordem (${change})`, async () => {
        const old = harness(kind); deferred = true;
        const pending = old.refresh(); old.destroy();
        const fresh = harness(kind, change === 'garagem' ? 'VCM' : 'VCG', change === 'data' ? '2026-10-09' : undefined);
        const latest = fresh.refresh();
        // CI pode compartilhar a leitura de todas as folhas ao trocar apenas a selecao.
        for (const r of requests.splice(0).reverse()) { r.resolve(r.value); await tick(); }
        await Promise.all([pending, latest]);
        assert.equal(fresh.state.ready, true); assert.equal(fresh.state.messages.length, 1);
        assert.deepEqual(old.state.items, []); assert.deepEqual(old.state.messages, []);
        deferred = false; fresh.destroy();
      });
      await t.test(`${kind}: mutacao invalida consulta pendente sem flags ou mensagens tardias`, async () => {
        const h = harness(kind); deferred = true;
        const pending = h.refresh(); temporal.beginMutation(); settle(); await pending; temporal.endMutation();
        assert.deepEqual(h.state.items, []); assert.deepEqual(h.state.messages, []);
        assert.equal(temporal.getMutationState().refreshRequired, false);
        deferred = false; await h.refresh(); assert.equal(h.state.ready, true); h.destroy();
      });
      await t.test(`${kind}: 409 e POST salvo/GET falho mantem protecao e recuperacao oficial`, async () => {
        const h = harness(kind); await h.refresh();
        const save = () => ci.saveCISnapshot(h.state.items, tomorrow, h.state.items);
        conflict = true; await assert.rejects(save(), /desatualizado/); conflict = false;
        assert.equal(temporal.getMutationState().refreshRequired, true);
        await h.refresh(); assert.equal(temporal.getMutationState().refreshRequired, false);
        fail = true; await assert.rejects(save(), temporal.SavedRefreshRequired); fail = false;
        assert.equal(temporal.getMutationState().refreshRequired, true);
        await h.refresh();
        const saved = await save();
        assert.equal(c4.c4SnapshotRevision(saved, 'VCG', kind === 'ci' ? tomorrow : day, kind).baseC4, `token-${version}`);
        assert.ok(posts.at(-1).base); assert.ok(posts.at(-1).baseC4);
        h.destroy();
      });
    }
  } finally { Object.assign(globalThis, previous); }
});
