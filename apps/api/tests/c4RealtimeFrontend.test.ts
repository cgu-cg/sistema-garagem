import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealtimeSession, matchesInvalidation, validInvalidation, type RealtimeSocket } from '../../web/src/lib/realtimeSession';
import { createRealtimeRefresh } from '../../web/src/lib/realtimeRefresh';
import { createEditBaselines } from '../../web/src/lib/editBaselines';
import { createReadCoordinator } from '../../web/src/lib/readCoordination';
import * as temporal from '../../web/src/lib/mvpTemporal';
import Module from 'node:module';

const event = { garagem: 'VCG' as const, dataOperacional: '2026-10-13', dataFolha: '2026-10-14' };
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
class FakeSocket implements RealtimeSocket {
  handlers = new Map<string, Set<(...args: any[]) => void>>(); connects = 0; disconnects = 0;
  on(event: string, fn: (...args: any[]) => void) { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(fn); }
  off(event: string, fn: (...args: any[]) => void) { this.handlers.get(event)?.delete(fn); }
  connect() { this.connects++; }
  disconnect() { this.disconnects++; }
  receive(event: string, data?: unknown) { this.handlers.get(event)?.forEach(fn => fn(data)); }
}

test('invalidation valida contexto completo; outra garagem/data e payload malformado sao ignorados', () => {
  assert.ok(validInvalidation(event));
  assert.ok(matchesInvalidation(event, 'VCG', '2026-10-14', 'ci'));
  assert.ok(matchesInvalidation(event, 'VCG', '2026-10-13', 'manutencao'));
  assert.equal(matchesInvalidation(event, 'VCM', '2026-10-14', 'ci'), false);
  assert.equal(matchesInvalidation(event, 'VCG', '2026-10-15', 'ci'), false);
  assert.equal(matchesInvalidation(event, 'VCG', '2026-10-14', 'manutencao'), false);
  for (const e of [null, {}, { ...event, dataFolha: '2026-10-15' }, { ...event, dataOperacional: '2026-02-30' }]) assert.equal(validInvalidation(e), false);
});

test('sessao compartilhada: StrictMode, listeners, reconnect, token novo e logout', async () => {
  const sockets: FakeSocket[] = [], credentials: string[] = [];
  const session = createRealtimeSession(token => { credentials.push(token); const socket = new FakeSocket(); sockets.push(socket); return socket; });
  const messages: unknown[] = [], unsubscribe = session.subscribe(e => messages.push(e));
  const first = session.retain('test-token-A'); first(); const strict = session.retain('test-token-A'); await tick();
  assert.equal(sockets.length, 1); assert.equal(sockets[0].connects, 1);
  assert.equal(sockets[0].handlers.get('c4:updated')!.size, 1);
  sockets[0].receive('connect'); sockets[0].receive('c4:updated', event); sockets[0].receive('c4:updated', {});
  sockets[0].receive('disconnect'); sockets[0].receive('connect');
  assert.deepEqual(messages, [null, event, null]);
  const late: unknown[] = [], stopLate = session.subscribe(e => late.push(e)); await tick(); assert.deepEqual(late, [null]); stopLate();
  const fresh = session.retain('test-token-B'); strict(); await tick();
  assert.equal(sockets[0].disconnects, 1); assert.deepEqual(credentials, ['test-token-A', 'test-token-B']);
  session.logout(); sockets[1].receive('c4:updated', event);
  assert.equal(sockets[1].disconnects, 1); assert.equal(messages.length, 3);
  fresh(); unsubscribe(); await tick();
  assert.equal(sockets[1].handlers.get('c4:updated')!.size, 0);
});

test('duas sessoes recebem notificacao; burst gera uma consulta por tela sem POST', async () => {
  const sockets: FakeSocket[] = [], queues: ReturnType<typeof createRealtimeRefresh>[] = [], releases: (() => void)[] = [];
  const loaded = [deferred<void>(), deferred<void>()], counts = [0, 0];
  for (let i = 0; i < 2; i++) {
    const session = createRealtimeSession(() => { const socket = new FakeSocket(); sockets.push(socket); return socket; });
    const queue = createRealtimeRefresh(async () => { counts[i]++; loaded[i].resolve(); }, () => false, 1); queues.push(queue);
    releases.push(session.subscribe(e => { if (!e || matchesInvalidation(e, 'VCG', '2026-10-14', 'ci')) queue.request(); }), session.retain('test-token'));
  }
  for (const socket of sockets) {
    socket.receive('c4:updated', { ...event, garagem: 'VCM' });
    socket.receive('c4:updated', event); socket.receive('c4:updated', event); socket.receive('connect');
  }
  await Promise.all(loaded.map(d => d.promise)); assert.deepEqual(counts, [1, 1]);
  queues.forEach(q => q.dispose()); releases.forEach(fn => fn()); await tick();
});

test('gravação pendente adia consultas e eventos durante leitura geram no maximo uma recarga seguinte', async () => {
  let busy = true, count = 0;
  const started = deferred<void>(), first = deferred<void>(), second = deferred<void>();
  const queue = createRealtimeRefresh(async () => { count++; if (count === 1) { started.resolve(); await first.promise; } else second.resolve(); }, () => busy, 1);
  queue.request(); await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(count, 0);
  busy = false; await started.promise;
  queue.request(); queue.request(); first.resolve(); await second.promise;
  assert.equal(count, 2); queue.dispose();
});

test('mudanca de contexto/desmontagem descarta resposta antiga; erro HTTP conserva lista e recupera depois', async () => {
  const coordinator = createReadCoordinator(() => 0); coordinator.setContext('VCG|14');
  let list = ['original'], failures = 0;
  const old = deferred<string[]>(), started = deferred<void>();
  const queue = createRealtimeRefresh(() => coordinator.run(() => { started.resolve(); return old.promise; }, value => { list = value; }, () => failures++), () => false, 1);
  queue.request(); await started.promise;
  queue.dispose(); coordinator.setContext('VCM|14');
  await coordinator.run(async () => ['nova garagem'], value => { list = value; }, () => failures++);
  old.resolve(['antiga']); await tick(); assert.deepEqual(list, ['nova garagem']);
  await coordinator.run(async () => { throw Error('HTTP 503'); }, value => { list = value; }, () => failures++);
  assert.equal(failures, 1); assert.deepEqual(list, ['nova garagem']);
  await coordinator.run(async () => ['recuperada'], value => { list = value; }, () => failures++);
  assert.deepEqual(list, ['recuperada']); coordinator.dispose();
});

test('rascunhos mantem array original, texto, selecao e contexto; novas edicoes usam baseline recente', () => {
  const old = [{ id: '1', text: 'original' }], fresh = [{ id: '1', text: 'outro usuario' }];
  const edits = createEditBaselines<{ id: string; text: string }>();
  const form = { text: 'digitado', selected: '4000', open: true };
  for (const key of ['quick', 'slot', 'title', 'release']) edits.begin(key, 'VCG|14', old);
  edits.begin('quick', 'VCG|14', fresh); assert.equal(edits.read('quick', fresh), old);
  assert.deepEqual(form, { text: 'digitado', selected: '4000', open: true });
  edits.begin('new', 'VCG|14', fresh); assert.equal(edits.read('new', old), fresh);
  assert.equal(edits.oldest(['new', 'slot'], fresh), old);
  assert.throws(() => edits.assertContext('quick', 'VCM|14'), /outra data ou garagem/);
  edits.end('quick'); edits.begin('quick', 'VCG|14', fresh); assert.equal(edits.read('quick', old), fresh);
});

test('hook realtime real coordena HTTP, mutacao durante GET, recuperacao e cleanup sem resetar formulario', async () => {
  const listeners = new Set<(e: any) => void>(), cleanups: (() => void)[] = [];
  const loader = (Module as any)._load;
  let useReload: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (request === 'react' && parent.filename.endsWith('useC4Realtime.ts')) return {
        useRef: (value: unknown) => ({ current: value }), useEffect: (fn: () => () => void) => { cleanups.push(fn()); },
      };
      if (request === '@/stores/auth') return { useAuth: () => ({}) };
      if (request === './c4RealtimeClient' && parent.filename.endsWith('useC4Realtime.ts')) return {
        c4Realtime: { subscribe(fn: (e: any) => void) { listeners.add(fn); return () => listeners.delete(fn); } },
      };
      return loader.call(this, request, parent, main);
    };
    useReload = require('../../web/src/lib/useC4Realtime').useC4RealtimeReload;
  } finally { (Module as any)._load = loader; }
  temporal.confirmRefresh();
  const coordinator = createReadCoordinator(temporal.readTicket); coordinator.setContext('VCG|14');
  const starts = [deferred<void>(), deferred<void>(), deferred<void>(), deferred<void>()];
  const responses = [deferred<string[]>(), deferred<string[]>(), deferred<string[]>(), deferred<string[]>()];
  let count = 0, failures = 0, list = ['oficial inicial'];
  const draft = { text: 'digitado', selection: '4000', open: true };
  useReload('VCG', '2026-10-14', 'ci', coordinator, () => {
    const index = count++; starts[index].resolve(); return responses[index].promise;
  }, (value: string[]) => { list = value; }, () => { failures++; });
  const receive = (e: any) => listeners.forEach(fn => fn(e));
  try {
    receive({ ...event, garagem: 'VCM' }); receive({ ...event, dataFolha: '2026-10-15' });
    receive(event); receive(event); await starts[0].promise; assert.equal(count, 1);
    temporal.beginMutation(); responses[0].resolve(['resposta anterior a gravacao']);
    await tick(); assert.deepEqual(list, ['oficial inicial']);
    temporal.endMutation(); await starts[1].promise; responses[1].resolve(['oficial atualizado']);
    while (list[0] !== 'oficial atualizado') await tick();
    assert.deepEqual(draft, { text: 'digitado', selection: '4000', open: true }); assert.equal(failures, 0);
    // HTTP 409/POST+GET falho exige somente recuperacao de leitura, sem nova escrita.
    temporal.beginMutation(); temporal.requireRefresh(); temporal.endMutation();
    await starts[2].promise; responses[2].resolve(['recuperacao oficial']);
    while (list[0] !== 'recuperacao oficial') await tick();
    receive(null); await starts[3].promise;
    cleanups.forEach(fn => fn()); coordinator.dispose(); responses[3].resolve(['tardia']); await tick();
    assert.equal(list[0], 'recuperacao oficial'); assert.equal(listeners.size, 0);
  } finally {
    cleanups.forEach(fn => fn()); coordinator.dispose(); temporal.endMutation(); temporal.confirmRefresh();
  }
});
