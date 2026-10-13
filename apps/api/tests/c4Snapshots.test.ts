import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { revision } from '../src/services/mvpTemporal';

const day = '2026-10-07', target = '2026-10-08';
const wire = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test('snapshots C4 nos managers, sem rede ou banco', async t => {
  const RealDate = Date;
  const previous = { Date, window: (globalThis as any).window, localStorage: (globalThis as any).localStorage, CustomEvent: (globalThis as any).CustomEvent };
  class FixedDate extends RealDate {
    constructor(value?: any) { super(value === undefined ? '2026-10-07T12:00:00Z' : value); }
    static now() { return new RealDate('2026-10-07T12:00:00Z').getTime(); }
  }
  const events: string[] = [];
  Object.assign(globalThis, { Date: FixedDate, window: { dispatchEvent: (e: any) => { events.push(e.type); } },
    localStorage: { setItem() {}, getItem() { throw new Error('Cache nao pode fornecer revisao'); } },
    CustomEvent: class { constructor(public type: string, public options: unknown) {} } });
  let version = 1, gets = 0;
  const ciItem = { id: 'c4-ci-1', chaveItem: '11111111-1111-4111-8111-111111111111', updatedAt: new FixedDate('2026-10-07T11:00:00.567Z'),
    prefixo: '4000', consorciada: 'VCG', garagem: 'VCG', data: target, categoriaPlanilha: 'BLOQUEADO', motivo: 'MOTOR', dataBloqueio: day };
  const state = { id: 'c4-m-1', cicloId: 1, updatedAt: ciItem.updatedAt, prefixo: '4000', consorciada: 'VCG', data: day,
    bloqueado: true, emExecucao: false, liberado: false, observacao: 'MOTOR', observacaoBloqueio: 'MOTOR', observacaoOficina: null };
  let serverCI: any[] = wire([ciItem]), serverMaintenance: any[] = wire([state]);
  const context = (garage = 'VCG', date = day) => wire({ mode: 'C4', garagem: garage, day: date, garages: ['VCG', 'VCM'],
    baseC4: `token-${version}`, mutable: true, ci: serverCI, maintenance: serverMaintenance });
  let getOverride: ((options: any) => Promise<any>) | undefined;
  let failReload = false;
  let afterPost: (() => void) | undefined;
  const posts: { url: string; body: any }[] = [];
  const api = {
    get: async (url: string, options: any) => {
      assert.equal(url, '/c4/contexto'); gets++;
      if (failReload) throw new Error('Recarga indisponivel');
      return getOverride ? getOverride(options) : context(options.params.garagem, options.params.data);
    },
    post: async (url: string, body: any) => {
      posts.push({ url, body: wire(body) });
      if (body.baseC4 !== `token-${version}`) throw Object.assign(new Error('Snapshot C4 desatualizado'), { status: 409 });
      assert.equal(body.base, revision(url === '/ci-bloqueios/sync' ? serverCI : serverMaintenance));
      if (url === '/ci-bloqueios/sync') serverCI = wire(body.items);
      else serverMaintenance = wire(body.items);
      version++;
      const response = { records: wire(serverMaintenance), baseC4: `token-${version}` };
      afterPost?.();
      return response;
    },
  };
  const loader = (Module as any)._load;
  let ci: any, maintenance: any, c4: any, temporal: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === '@/lib/api' || (request === './api' && parent.filename.endsWith(path.join('lib', 'c4.ts')))) return { api };
      return loader.call(this, request.startsWith('@/') ? path.resolve('apps/web/src', request.slice(2) + '.ts') : request, parent, main);
    };
    ci = require('../../web/src/pages/soltura/ciManager');
    maintenance = require('../../web/src/pages/manutencao/manutencaoManager');
    c4 = require('../../web/src/lib/c4');
    temporal = require('../../web/src/lib/mvpTemporal');
  } finally { (Module as any)._load = loader; }
  try {
    await t.test('CI e Controle simultaneos compartilham uma leitura oficial', async () => {
      const wait = deferred<any>(); getOverride = () => wait.promise;
      const count = gets;
      const a = ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' });
      const b = maintenance.fetchManutencaoDataFromApi(day, 'VCG');
      assert.equal(gets - count, 1);
      wait.resolve(context());
      const [items, states] = await Promise.all([a, b]);
      assert.equal(c4.c4SnapshotRevision(items, 'VCG', target, 'ci').baseC4,
        c4.c4SnapshotRevision(states, 'VCG', day, 'manutencao').baseC4);
      getOverride = undefined;
    });

    await t.test('resposta anterior a mutacao nao substitui contexto mais novo', async () => {
      const wait = deferred<any>(), old = context(); getOverride = () => wait.promise;
      const pending = c4.fetchC4Context('VCG', day);
      const rejected = assert.rejects(pending, /anterior a uma mutacao/);
      temporal.beginMutation(); version++;
      getOverride = undefined;
      const fresh = await c4.fetchC4Context('VCG', day);
      c4.storeC4Context(fresh, day);
      wait.resolve(old); await rejected; temporal.endMutation();
      assert.equal(c4.c4Context('VCG', day), fresh);
    });

    await t.test('contexto concluido antigo nao pode ser republicado fora de ordem', async () => {
      const old = await c4.fetchC4Context('VCG', day);
      version++;
      const fresh = await c4.fetchC4Context('VCG', day);
      c4.storeC4Context(fresh, day);
      assert.throws(() => c4.storeC4Context(old, day), /substituida/);
      assert.equal(c4.c4Context('VCG', day), fresh);
    });

    await t.test('manager CI encaminha baixa confirmada com base e baseC4 oficiais', async () => {
      const baseline = await ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' });
      await ci.saveCISnapshot(baseline, target, baseline, [], 'save', 'VCG', undefined, true);
      const sent = posts.at(-1)!.body;
      assert.equal(sent.confirmRelease, true); assert.ok(sent.baseC4); assert.equal(sent.base, revision(baseline));
    });

    for (const kind of ['ci', 'manutencao'] as const) {
      const load = () => kind === 'ci' ? ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' }) : maintenance.fetchManutencaoDataFromApi(day, 'VCG');
      const save = (next: any[], baseline: any[]) => kind === 'ci'
        ? ci.saveCISnapshot(next, target, baseline, [], 'save', 'VCG')
        : maintenance.saveManutencaoData(day, next, false, baseline, [], 'VCG');
      await t.test(`${kind}: lista antiga conserva token antigo, conflito protege outro usuario e recarga recupera`, async () => {
        const old = await load(), oldToken = c4.c4Context('VCG', day).baseC4;
        // Outro posto grava entre as consultas; o outro manager atualiza o mapa compartilhado.
        version++;
        serverCI = serverCI.map(i => ({ ...i, motivo: 'OUTRO USUARIO' }));
        serverMaintenance = serverMaintenance.map(i => ({ ...i, observacao: 'OUTRO USUARIO', observacaoBloqueio: 'OUTRO USUARIO' }));
        if (kind === 'ci') await maintenance.fetchManutencaoDataFromApi(day, 'VCG');
        else await ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' });
        const before = wire([serverCI, serverMaintenance]);
        await assert.rejects(save(old.map(i => ({ ...i, motivo: 'MINHA EDICAO' })), old), /desatualizado/);
        assert.equal(posts.at(-1)!.body.baseC4, oldToken);
        assert.deepEqual([serverCI, serverMaintenance], before);
        assert.equal(temporal.getMutationState().refreshRequired, true);
        const count = posts.length;
        await assert.rejects(save(old, old), /precisa ser atualizada/);
        assert.equal(posts.length, count); // Sem retry automatico.
        const fresh = await load(); temporal.confirmRefresh();
        assert.equal(temporal.getMutationState().refreshRequired, false);
        const readsBefore = gets;
        const saved = await save(fresh.map(i => ({ ...i, ...(kind === 'ci' ? { motivo: 'NOVA EDICAO' } : { observacao: 'NOVA EDICAO' }) })), fresh);
        assert.ok(gets > readsBefore);
        assert.equal(c4.c4SnapshotRevision(saved, 'VCG', kind === 'ci' ? target : day, kind).baseC4, `token-${version}`);
        // A proxima gravacao utiliza a revisao associada a recarga, nao a resposta do POST.
        await save(saved, saved);
      });
      await t.test(`${kind}: copia ou baseline alterada nao pode receber token do mapa`, async () => {
        const baseline = await load(), count = posts.length;
        await assert.rejects(save(baseline, [...baseline]), /sem snapshot/);
        assert.equal(posts.length, count);
        temporal.confirmRefresh();
        const fresh = await load();
        fresh[0] = { ...fresh[0], prefixo: '4999' };
        await assert.rejects(save(fresh, fresh), /sem snapshot/);
        assert.equal(posts.length, count);
        temporal.confirmRefresh();
      });
      await t.test(`${kind}: recarga prevalece sobre POST se outro usuario gravar em seguida`, async () => {
        const baseline = await load();
        afterPost = () => {
          version++;
          serverCI = serverCI.map(i => ({ ...i, motivo: 'GRAVACAO POSTERIOR' }));
          serverMaintenance = serverMaintenance.map(i => ({ ...i, observacao: 'GRAVACAO POSTERIOR', observacaoBloqueio: 'GRAVACAO POSTERIOR' }));
        };
        const saved = await save(baseline, baseline);
        afterPost = undefined;
        assert.equal(kind === 'ci' ? saved[0].motivo : saved[0].observacao, 'GRAVACAO POSTERIOR');
        assert.equal(c4.c4SnapshotRevision(saved, 'VCG', kind === 'ci' ? target : day, kind).baseC4, `token-${version}`);
      });
    }

    await t.test('POST salvo e recarga falha exige atualizar sem repetir gravacao', async () => {
      const baseline = await ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' });
      const count = posts.length; failReload = true;
      await assert.rejects(ci.saveCISnapshot(baseline, target, baseline), temporal.SavedRefreshRequired);
      assert.equal(posts.length, count + 1);
      assert.equal(temporal.getMutationState().refreshRequired, true);
      failReload = false;
      await ci.fetchCIBloqueiosFromApi({ garagem: 'VCG' }); temporal.confirmRefresh();
      assert.ok(events.includes('ci_bloqueios_updated'));
      assert.ok(events.includes('manutencao_updated'));
    });
  } finally { Object.assign(globalThis, previous); }
});
