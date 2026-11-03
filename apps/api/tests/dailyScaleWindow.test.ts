import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dailyScaleWindow, canEditScaleDate } from '../src/services/dailyScaleWindow';
import { assertScaleDate } from '../src/services/dailyScaleLifecycle';
import { dailyScaleWindow as clientWindow, canEditScaleDate as clientCanEdit } from '../../web/src/lib/dailyScaleWindow';

test('preparacao permanece no mesmo dia ate 05:59:59 e avanca as 06h de Campo Grande', () => {
  for (const [instant, preferred] of [
    ['2026-11-03T16:00:00Z', '2026-11-04'], ['2026-11-04T03:59:59Z', '2026-11-04'],
    ['2026-11-04T04:00:00Z', '2026-11-04'], ['2026-11-04T09:59:59Z', '2026-11-04'],
    ['2026-11-04T10:00:00Z', '2026-11-05'], ['2026-12-31T16:00:00Z', '2027-01-01'],
  ]) {
    const now = new Date(instant);
    assert.equal(dailyScaleWindow(now).preparationDate, preferred);
    assert.deepEqual(clientWindow(now), dailyScaleWindow(now));
  }
});

test('limite vale para iniciar editar e reabrir; finalizar pendencia continua permitido', () => {
  for (const operation of ['iniciar', 'editar', 'reabrir'] as const) {
    assert.doesNotThrow(() => assertScaleDate('2026-11-04', operation, new Date('2026-11-04T09:59:59.999Z')));
    assert.throws(() => assertScaleDate('2026-11-04', operation, new Date('2026-11-04T10:00:00Z')), /06h/);
    assert.throws(() => assertScaleDate('2026-11-03', operation, new Date('2026-11-04T04:00:00Z')), /06h/);
    assert.doesNotThrow(() => assertScaleDate('2026-11-05', operation, new Date('2026-11-04T16:00:00Z')));
  }
  assert.doesNotThrow(() => assertScaleDate('2026-11-03', 'finalizar', new Date('2026-11-04T16:00:00Z')));
  for (const instant of ['2026-11-04T09:59:59Z', '2026-11-04T10:00:00Z'])
    assert.equal(clientCanEdit('2026-11-04', new Date(instant)), canEditScaleDate('2026-11-04', new Date(instant)));
  assert.equal(readFileSync('apps/api/src/services/dailyScaleWindow.ts', 'utf8').replace(/\r\n/g, '\n'), readFileSync('apps/web/src/lib/dailyScaleWindow.ts', 'utf8').replace(/\r\n/g, '\n'));
});
