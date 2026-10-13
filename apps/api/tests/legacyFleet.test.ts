import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyPool } from '../src/services/legacyPool';
import { createCIFleetLoader, fleetError, mapFleet, FleetValidationError, type FleetState } from '../../web/src/lib/ciFleet';
import { vehiclesForGarage } from '../../web/src/lib/c4Vehicles';
import { inventoryVehicle } from '../src/services/fleetContract';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

test('pool compartilha inicializacao entre requisicoes e reutiliza conexao', async () => {
  const wait = deferred<void>(); let creates = 0;
  const pool = { connected: false, async connect() { await wait.promise; this.connected = true; }, async close() {} };
  const manager = createLegacyPool(() => { creates++; return pool; });
  const first = manager.get(), second = manager.get();
  assert.equal(creates, 1); wait.resolve();
  assert.equal(await first, pool); assert.equal(await second, pool); assert.equal(await manager.get(), pool);
  assert.equal(creates, 1);
});

test('falha fecha pool e permite recuperacao apos intervalo sem tempestade de conexoes', async () => {
  let time = 0, creates = 0, closes = 0;
  const manager = createLegacyPool(() => {
    const fail = creates++ === 0;
    return { connected: false, async connect() { if (fail) throw Error('mock failure'); this.connected = true; }, async close() { closes++; } };
  }, () => time);
  assert.equal(await manager.get(), null); assert.equal(closes, 1);
  await Promise.all([manager.get(), manager.get()]); assert.equal(creates, 1);
  time = 5000;
  const [first, second] = await Promise.all([manager.get(), manager.get()]);
  assert.ok(first?.connected); assert.equal(first, second); assert.equal(creates, 2);
});

test('pool desconectado e fechado antes de nova conexao', async () => {
  const pools: { connected: boolean; closed: boolean; connect(): Promise<void>; close(): Promise<void> }[] = [];
  const manager = createLegacyPool(() => {
    const pool = { connected: false, closed: false, async connect() { this.connected = true; }, async close() { this.closed = true; } };
    pools.push(pool); return pool;
  });
  const old = await manager.get(); old!.connected = false;
  const next = await manager.get();
  assert.equal(old!.closed, true); assert.notEqual(old, next); assert.equal(pools.length, 2);
});

const response = (prefixo = '4000', source: 'real' | 'mock' | 'unknown' = 'real') => ({ source, data: [inventoryVehicle({ idCarro: Number(prefixo), garagem: 1 })] }) as any;

for (const [raw, code, name] of [[1, 1, 'VCM'], [2, 2, 'VCG'], ['1', 1, 'VCM'], ['2', 2, 'VCG'], ['VCM', 1, 'VCM'], ['VCG', 2, 'VCG'], [' Vila Morena ', 1, 'VCM'], ['Campo Grande', 2, 'VCG']] as const) {
  test(`contrato backend/frontend reconhece garagem ${JSON.stringify(raw)}`, () => {
    const vehicle = inventoryVehicle({ idCarro: 4000, garagem: raw });
    const [mapped] = mapFleet({ source: 'real', data: [vehicle] } as any);
    assert.equal(mapped.garagemFonte, code); assert.equal(mapped.garagem, name);
    assert.equal(mapped.garagemOriginal, raw); assert.equal(vehicle.garagem, raw);
  });
}
for (const raw of [0, '0', 99, 'DESCONHECIDA']) {
  test(`garagem incompleta/desconhecida ${JSON.stringify(raw)} nao utiliza fallback do backend`, () => {
    const vehicle = inventoryVehicle({ idCarro: 2002, garagem: raw });
    assert.throws(() => mapFleet({ source: 'real', data: [vehicle] } as any), error => {
      assert.ok(error instanceof FleetValidationError);
      assert.equal(error.diagnostic.incomplete + error.diagnostic.unknownGarage, 1);
      assert.match(fleetError(error), /incompletos.*desconhecida/); return true;
    });
  });
}
test('prefixos e identificadores invalidos, lista mista e formatos inesperados', () => {
  const good = inventoryVehicle({ idCarro: 4000, garagem: 1 });
  assert.equal(mapFleet({ source: 'real', data: [{ ...good, prefixo: 4000 }] } as any)[0].prefixo, '4000');
  assert.equal(mapFleet({ source: 'real', data: [{ ...good, prefixo: undefined }] } as any)[0].prefixo, '4000');
  for (const bad of [{ ...good, prefixo: '', idCarro: undefined }, { ...good, idCarro: 'x' }, { ...good, prefixo: '4001' }, { ...good, garagemNome: 'VCG' }, null]) {
    assert.throws(() => mapFleet({ source: 'real', data: [good, bad] } as any), FleetValidationError);
  }
  for (const data of [{ data: [] }, null, 'html']) assert.throws(() => mapFleet({ source: 'real', data } as any), /INVALID_FLEET_RESPONSE/);
});
test('resposta valida recupera rejeicao cadastral sem perder ultima lista', async () => {
  let calls = 0;
  const f = fixture(async () => ++calls === 1 ? { source: 'real', data: [inventoryVehicle({ idCarro: 4000, garagem: 99 })] } : response());
  await f.loader.load(); assert.equal(f.latest().cars, f.initial); assert.match(f.latest().error!, /incompletos/);
  await f.loader.load(true); assert.equal(f.latest().error, null); assert.equal(f.latest().source, 'real'); f.loader.dispose();
});
test('garagem ausente e omitida sem rejeitar frota ou fabricar garagem; diagnostico apenas quantitativo', () => {
  const good = inventoryVehicle({ idCarro: 4000, garagem: 1 });
  const missing = [null, undefined, '', ' '].map(garagem => inventoryVehicle({ idCarro: 2025, garagem }));
  const counts: number[] = [];
  const mapped = mapFleet({ source: 'real', data: [good, ...missing] } as any, count => counts.push(count));
  assert.deepEqual(mapped.map(i => i.prefixo), ['4000']); assert.deepEqual(counts, [4]);
  assert.deepEqual(mapFleet({ source: 'real', data: missing } as any, () => {}), []);
});
test('frota com veiculo sem garagem nao agenda retry nem recarrega ao foco', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; return { source: 'real', data: [...response().data, inventoryVehicle({ idCarro: 2025, garagem: null })] }; });
  await f.loader.load(); f.loader.recover(); await tick();
  assert.equal(calls, 1); assert.equal(f.timers.length, 0); assert.equal(f.latest().error, null);
  assert.equal(f.latest().source, 'real'); assert.deepEqual(f.latest().cars.map(i => i.prefixo), ['4000']); f.loader.dispose();
});
function fixture(fetch: () => Promise<any>) {
  const states: FleetState[] = [], timers: { callback: () => void; delay: number; cancelled: boolean }[] = [];
  const initial = [{ prefixo: '4999', garagem: 'VCG' as const }];
  const loader = createCIFleetLoader(fetch, initial, state => states.push(state), (callback, delay) => {
    const timer = { callback, delay, cancelled: false }; timers.push(timer); return timer;
  }, timer => { (timer as typeof timers[number]).cancelled = true; });
  loader.activate();
  return { loader, states, timers, initial, latest: () => states.at(-1)! };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test('carga substitui lista local pela frota oficial com garagem real, inclusive resposta vazia', async () => {
  let value = response(); const f = fixture(async () => value);
  assert.equal(vehiclesForGarage(f.initial, 'VCM').length, 0); // Nao inventar garagemFonte na lista local.
  await f.loader.load(); assert.equal(f.latest().source, 'real'); assert.equal(f.latest().cars[0].garagemFonte, 1);
  assert.equal(vehiclesForGarage(f.latest().cars, 'VCM').length, 1);
  value = { source: 'real', data: [] }; await f.loader.load(true);
  assert.deepEqual(f.latest().cars, []); assert.equal(f.latest().error, null); f.loader.dispose();
});

test('falha temporaria recupera automaticamente sem F5 e limpa aviso', async () => {
  let fail = true;
  const f = fixture(async () => { if (fail) throw { status: 503, code: 'SQL_SERVER_UNAVAILABLE' }; return response(); });
  await f.loader.load(); assert.equal(f.latest().source, 'local'); assert.match(f.latest().error!, /legado/);
  assert.equal(f.timers[0].delay, 5000);
  fail = false; f.timers[0].callback(); await tick();
  assert.equal(f.latest().source, 'real'); assert.equal(f.latest().error, null); f.loader.dispose();
});

test('atualizacao malsucedida preserva ultima frota oficial e permite nova consulta manual', async () => {
  let fail = false; const f = fixture(async () => { if (fail) throw Error('network'); return response(); });
  await f.loader.load(); const cars = f.latest().cars;
  fail = true; await f.loader.load(true); assert.equal(f.latest().cars, cars); assert.equal(f.latest().source, 'real');
  fail = false; await f.loader.load(true); assert.equal(f.latest().error, null);
  assert.equal(f.timers[0].cancelled, true); f.loader.dispose();
});

test('tentativas automaticas sao limitadas e recuperar ao foco permite nova tentativa', async () => {
  let fail = true, calls = 0;
  const f = fixture(async () => { calls++; if (fail) throw Error('network'); return response(); });
  await f.loader.load();
  for (let i = 0; i < 3; i++) { f.timers[i].callback(); await tick(); }
  assert.equal(calls, 4); assert.deepEqual(f.timers.map(t => t.delay), [5000, 10000, 20000]);
  fail = false; f.loader.recover(); await tick(); assert.equal(f.latest().error, null); f.loader.dispose();
});

test('desmontagem cancela timer e respostas antigas nao substituem carga nova', async () => {
  const old = deferred<any>(), fresh = deferred<any>(); let calls = 0;
  const f = fixture(() => ++calls === 1 ? old.promise : fresh.promise);
  const first = f.loader.load(); f.loader.dispose(); f.loader.activate();
  const second = f.loader.load(); fresh.resolve(response('4001')); await second;
  old.resolve(response('4000')); await first;
  assert.equal(f.latest().cars[0].prefixo, '4001'); f.loader.dispose();
  const failure = fixture(async () => { throw Error('network'); }); await failure.loader.load(); failure.loader.dispose();
  assert.equal(failure.timers[0].cancelled, true);
});

test('consultas simultaneas da frota nao duplicam requisicao', async () => {
  const wait = deferred<any>(); let calls = 0;
  const f = fixture(() => { calls++; return wait.promise; });
  const first = f.loader.load(); await f.loader.load(true); f.loader.recover();
  assert.equal(calls, 1); wait.resolve(response()); await first; f.loader.dispose();
});

test('erros de sessao nao recebem retry automatico', async () => {
  for (const status of [401, 403]) {
    const f = fixture(async () => { throw { status }; }); await f.loader.load();
    assert.equal(f.timers.length, 0); assert.ok(f.latest().error); f.loader.dispose();
  }
});

test('aviso distingue sessao, permissao, timeout, SQL, HTTP, resposta invalida e rede', () => {
  assert.match(fleetError({ status: 401 }), /Sessão/);
  assert.match(fleetError({ status: 403 }), /acesso/);
  assert.match(fleetError(Error('TIMEOUT_ERROR')), /tempo/);
  assert.match(fleetError({ code: 'SQL_SERVER_UNAVAILABLE' }), /legado/);
  assert.match(fleetError({ status: 502 }), /HTTP 502/);
  assert.match(fleetError(Error('INVALID_FLEET_RESPONSE')), /inválida/);
  assert.match(fleetError(Error('network')), /comunicar/);
});

test('mapeamento nao infere garagem por prefixo e preserva origem mock ou desconhecida', async () => {
  assert.throws(() => mapFleet({ source: 'real', data: [{ prefixo: '4000' } as any] }), /INVALID_FLEET_RESPONSE/);
  for (const source of ['mock', 'unknown'] as const) {
    const f = fixture(async () => response('4000', source)); await f.loader.load();
    assert.equal(f.latest().source, source); f.loader.dispose();
  }
});
