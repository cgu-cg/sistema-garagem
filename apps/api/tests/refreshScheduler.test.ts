import test from 'node:test';
import assert from 'node:assert/strict';
import { createRefreshScheduler } from '../../web/src/lib/refreshScheduler';

const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test('recarga apos salvar absorve notificacoes agendadas sem repetir consulta', async () => {
 let reads = 0;
 const scheduler = createRefreshScheduler(async () => { reads++; }, 5);
 for (let n = 0; n < 20; n++) scheduler.schedule();
 await scheduler.refresh(); await new Promise(resolve => setTimeout(resolve, 15));
 assert.equal(reads, 1); scheduler.dispose();
});

test('eventos em rajada resultam em uma unica consulta', async () => {
 let reads = 0;
 const scheduler = createRefreshScheduler(async () => { reads++; }, 0);
 for (let n = 0; n < 20; n++) scheduler.schedule();
 await new Promise(resolve => setTimeout(resolve, 15));
 assert.equal(reads, 1); scheduler.dispose();
});

test('invalidacao durante consulta executa uma leitura posterior sem sobrepor requisicoes', async () => {
 let reads = 0, active = 0, maxActive = 0;
 const finish: (() => void)[] = [];
 const scheduler = createRefreshScheduler(async () => {
  reads++; active++; maxActive = Math.max(maxActive, active);
  await new Promise<void>(resolve => finish.push(resolve)); active--;
 });
 const request = scheduler.refresh(); await tick();
 for (let n = 0; n < 20; n++) scheduler.schedule();
 assert.equal(scheduler.refresh(), request);
 assert.equal(reads, 1); finish.shift()!(); await tick();
 assert.equal(reads, 2); finish.shift()!(); await request;
 assert.equal(maxActive, 1); assert.equal(reads, 2); scheduler.dispose();
});

test('troca de contexto cancela eventos pendentes e nao repete consulta antiga em andamento', async () => {
 let reads = 0;
 const queued = createRefreshScheduler(async () => { reads++; }, 0);
 queued.schedule(); queued.dispose(); await tick(); await queued.refresh(); assert.equal(reads, 0);
 let finish!: () => void;
 const running = createRefreshScheduler(async () => { reads++; await new Promise<void>(resolve => { finish = resolve; }); });
 const request = running.refresh(); await tick(); running.schedule(); running.dispose(); finish(); await request;
 assert.equal(reads, 1);
});

test('falha libera fila para nova tentativa sem autorizar sucesso ficticio', async () => {
 let reads = 0;
 const scheduler = createRefreshScheduler(async () => { if (++reads === 1) throw Error('API indisponivel'); });
 await assert.rejects(scheduler.refresh(), /API indisponivel/);
 await scheduler.refresh(); assert.equal(reads, 2); scheduler.dispose();
});
