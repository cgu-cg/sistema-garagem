import test from 'node:test';
import assert from 'node:assert/strict';
import * as flow from '../src/services/c4Flow';
import { recoverCurrentDay, startC4Scheduler } from '../src/services/c4Scheduler';
import { enabledGarages, mutationMode } from '../src/services/c4Temporal';

// Nao importa bootstrap/Prisma runtime: comandos e timers sao simulados.
for (const value of [undefined, 'true', ''] as const) {
  test(`scheduler C4 inicia bootstrap e timer com flag ${String(value)}`, async t => {
    const previous = { scheduler: process.env.C4_SCHEDULER_ENABLED, garages: process.env.CI_NOVO_FLUXO_GARAGENS };
    let starts = 0, timers = 0, unrefs = 0, clears = 0;
    let scheduled!: () => void;
    const ready = new Promise<void>(resolve => { scheduled = resolve; });
    const timer = { unref: () => { unrefs++; } };
    const db: any = new Proxy({}, { get() { throw Error('Banco proibido'); } });
    t.mock.method(flow, 'startCycle', async () => { starts++; return { result: 'ALREADY_DONE' }; });
    t.mock.method(flow, 'finalizeCycle', async () => ({ result: 'ALREADY_DONE' }));
    t.mock.method(console, 'info', () => undefined);
    t.mock.method(globalThis, 'setTimeout', () => { timers++; scheduled(); return timer; });
    t.mock.method(globalThis, 'clearTimeout', (handle: unknown) => { assert.equal(handle, timer); clears++; });
    try {
      process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
      if (value === undefined) delete process.env.C4_SCHEDULER_ENABLED;
      else process.env.C4_SCHEDULER_ENABLED = value;
      const stop = startC4Scheduler(db);
      await ready;
      assert.equal(starts, 1);
      assert.equal(timers, 1);
      assert.equal(unrefs, 1);
      stop();
      assert.equal(clears, 1);
    } finally {
      if (previous.scheduler === undefined) delete process.env.C4_SCHEDULER_ENABLED;
      else process.env.C4_SCHEDULER_ENABLED = previous.scheduler;
      if (previous.garages === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS;
      else process.env.CI_NOVO_FLUXO_GARAGENS = previous.garages;
    }
  });
}

for (const value of ['false', ' FALSE ']) {
  test(`scheduler C4 desabilitado (${value}) nao inicia bootstrap, banco ou timers; comandos continuam disponiveis`, async t => {
    const previous = { scheduler: process.env.C4_SCHEDULER_ENABLED, garages: process.env.CI_NOVO_FLUXO_GARAGENS };
    let starts = 0;
    let finalizations = 0;
    let timers = 0;
    let retries = 0;
    let databaseAccesses = 0;
    let explicitOperation = false;
    let stop: (() => void) | undefined;
    const db: any = new Proxy({}, {
      get() { databaseAccesses++; throw Error('Banco proibido'); },
    });
    t.mock.method(flow, 'startCycle', async () => {
      starts++;
      // Uma regressao que inicie o bootstrap tambem exporia o caminho de retry.
      if (!explicitOperation) throw Error('Bootstrap automatico proibido');
      return { result: 'ALREADY_DONE' };
    });
    t.mock.method(flow, 'finalizeCycle', async () => { finalizations++; return { result: 'ALREADY_DONE' }; });
    t.mock.method(console, 'info', () => undefined);
    t.mock.method(console, 'error', () => undefined);
    t.mock.method(globalThis, 'setTimeout', (_callback: unknown, delay: number) => {
      timers++;
      if (delay === 60000) retries++;
      return { unref: () => undefined };
    });
    t.mock.method(globalThis, 'clearTimeout', () => undefined);
    try {
      process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
      process.env.C4_SCHEDULER_ENABLED = value;
      stop = startC4Scheduler(db);
      // Aguarda eventuais continuacoes assincronas antes de conferir os efeitos.
      await new Promise<void>(resolve => setImmediate(resolve));
      assert.equal(starts, 0);
      assert.equal(finalizations, 0);
      assert.equal(timers, 0);
      assert.equal(retries, 0);
      assert.equal(databaseAccesses, 0);
      assert.deepEqual(enabledGarages(), ['VCG']);
      assert.equal(mutationMode('VCG'), 'C4');
      // Depois das 20h locais, o comando explicito chama abertura e finalizacao.
      explicitOperation = true;
      await recoverCurrentDay(db, () => new Date('2026-10-10T00:30:00Z'), () => undefined);
      assert.equal(starts, 1);
      assert.equal(finalizations, 1);
      assert.equal(timers, 0);
      assert.equal(retries, 0);
      assert.equal(databaseAccesses, 0);
    } finally {
      stop?.();
      if (previous.scheduler === undefined) delete process.env.C4_SCHEDULER_ENABLED;
      else process.env.C4_SCHEDULER_ENABLED = previous.scheduler;
      if (previous.garages === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS;
      else process.env.CI_NOVO_FLUXO_GARAGENS = previous.garages;
    }
  });
}
