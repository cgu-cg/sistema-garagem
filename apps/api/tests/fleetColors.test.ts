import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildColorCache, colorForCode, createColorUpdater, readColorCache, scheduledColorMonth, vehicleColor, writeColorCache } from '../src/services/fleetColors';

const rows = [{ idCarro: 4200, carroceriaFAIXA: 1 }, { idCarro: 2319, carroceriaFAIXA: null }];
const now = () => new Date('2026-10-16T19:00:00Z');
async function temporary(run: (file: string, dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'garagem-colors-test-'));
  try { await run(path.join(dir, 'cache.json'), dir); }
  finally { assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep)); await rm(dir, { recursive: true, force: true }); }
}

test('cores respeitam mapeamento aprovado, nulos e carros sem correspondencia', () => {
  assert.deepEqual([null, 1, 3, 4, 5, 6, 2, 99].map(colorForCode), ['OUTRO', 'AZUL', 'PRATA', 'VERMELHO', 'VERMELHO/AZUL', 'EXECUTIVO', 'NAO IDENTIFICADO', 'NAO IDENTIFICADO']);
  const cache = buildColorCache(rows, now());
  assert.equal(vehicleColor(cache, 4200), 'AZUL');
  assert.equal(vehicleColor(cache, '2319'), 'OUTRO');
  assert.equal(vehicleColor(cache, 5000), 'OUTRO');
  assert.ok(!('garagem' in cache.vehicles[0]));
});

test('cache rejeita duplicados, fonte vazia, payload invalido e codigos malformados', () => {
  for (const input of [[], null, [...rows, rows[0]], [{ idCarro: 1999, carroceriaFAIXA: 1 }], [{ idCarro: 6001, carroceriaFAIXA: 1 }], [{ idCarro: 4200 }], [{ idCarro: 4200, carroceriaFAIXA: 'AZUL' }]])
    assert.throws(() => buildColorCache(input));
});

test('agenda primeiro domingo as 15h de Campo Grande, incluindo recuperacao no mesmo mes', () => {
  assert.equal(scheduledColorMonth(new Date('2026-11-01T18:59:59Z')), null);
  assert.equal(scheduledColorMonth(new Date('2026-11-01T19:00:00Z')), '2026-11');
  assert.equal(scheduledColorMonth(new Date('2026-11-20T10:00:00Z')), '2026-11');
  assert.equal(scheduledColorMonth(new Date('2026-10-04T18:59:59Z')), null);
  assert.equal(scheduledColorMonth(new Date('2026-10-04T19:00:00Z')), '2026-10');
  assert.equal(scheduledColorMonth(new Date('2026-12-05T23:00:00Z')), null);
  assert.equal(scheduledColorMonth(new Date('2026-12-06T19:00:00Z')), '2026-12');
});

test('atualizacao grava JSON validado atomicamente e limpa temporarios', async () => temporary(async (file, dir) => {
  assert.equal(await readColorCache(file), null);
  const updated = await createColorUpdater(file, async () => rows, now)('2026-10');
  assert.deepEqual(await readColorCache(file), updated);
  assert.equal(updated.scheduledMonth, '2026-10');
  assert.deepEqual(await readdir(dir), ['cache.json']);
}));

test('falha de consulta ou validacao preserva bytes do ultimo cache valido', async () => temporary(async file => {
  await writeColorCache(file, buildColorCache(rows, now()));
  const before = await readFile(file, 'utf8');
  const failure = createColorUpdater(file, async () => { throw Error('offline'); }, now);
  await assert.rejects(failure());
  await assert.rejects(createColorUpdater(file, async () => [...rows, rows[0]], now)());
  assert.equal(await readFile(file, 'utf8'), before);
}));

test('duas chamadas simultaneas compartilham uma consulta', async () => temporary(async file => {
  let calls = 0;
  const refresh = createColorUpdater(file, async () => { calls++; return rows; }, now);
  const [a, b] = await Promise.all([refresh(), refresh()]);
  assert.equal(calls, 1); assert.deepEqual(a, b);
}));

test('cache invalido nao e confundido com arquivo ausente', async () => temporary(async file => {
  await writeFile(file, '{quebrado');
  await assert.rejects(readColorCache(file), /CACHE_CORES_INVALIDO/);
  assert.equal(await readFile(file, 'utf8'), '{quebrado');
}));
