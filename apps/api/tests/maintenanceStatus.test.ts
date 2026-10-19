import test from 'node:test';
import assert from 'node:assert/strict';
import { assertMaintenanceTransition } from '../src/services/maintenanceStatus';

const blocked = { prefixo: '4222', bloqueado: true, emExecucao: false, liberado: false };
test('novas transicoes exigem estado unico, inclusive registros separados do legado', () => {
  assert.throws(() => assertMaintenanceTransition([{ ...blocked, emExecucao: true }], [blocked]), /somente um estado/);
  assert.throws(() => assertMaintenanceTransition([blocked, { ...blocked, bloqueado: false, emExecucao: true }], [blocked]), /somente um estado/);
  assert.doesNotThrow(() => assertMaintenanceTransition([{ ...blocked, bloqueado: false, emExecucao: true }], [blocked]));
});
test('coexistencia antiga nao e reescrita ao editar outros campos, mas pode passar a estado unico', () => {
  const old = { ...blocked, emExecucao: true };
  assert.doesNotThrow(() => assertMaintenanceTransition([old], [old]));
  assert.doesNotThrow(() => assertMaintenanceTransition([blocked], [old]));
});
