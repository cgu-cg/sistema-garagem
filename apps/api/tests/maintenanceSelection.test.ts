import test from 'node:test';
import assert from 'node:assert/strict';
import { garageVehiclePrefixes, addMaintenanceSelection } from '../../web/src/pages/manutencao/maintenanceSelection';

test('seletor usa garagem cadastrada, sem inferir pelo prefixo ou garagemNome', () => {
  const fleet = [
    { idCarro: 1111, prefixo: '1111', garagem: 2, garagemNome: 'VCM' as const },
    { idCarro: 4200, prefixo: '4200', garagem: '1', garagemNome: 'VCG' as const },
    { idCarro: 4201, prefixo: '4201', garagemNome: 'VCG' as const },
  ];
  assert.deepEqual(garageVehiclePrefixes(fleet, 'VCG'), ['1111']);
  assert.deepEqual(garageVehiclePrefixes(fleet, 'VCM'), ['4200']);
  assert.deepEqual(garageVehiclePrefixes(fleet, undefined), []);
});

const blocked = { id: 'old', prefixo: '4200', consorciada: 'VCG' as const, observacao: 'MOTOR',
  data: '2026-10-14', bloqueado: true, emExecucao: false, liberado: false, observacaoBloqueio: 'MOTOR' };
const company = () => 'VCG' as const;

test('selecao multipla retira bloqueio ao executar, nao duplica e nao muda a origem', () => {
  const baseline = [blocked];
  const result = addMaintenanceSelection(baseline, ['4200', '4201', '4201'], 'EM_EXECUCAO', 'freio', blocked.data, true, company);
  assert.equal(result.length, 2);
  assert.equal(result[0].bloqueado, false);
  assert.equal(result[0].emExecucao, true);
  assert.equal(result[0].observacaoBloqueio, null);
  assert.equal(result[0].observacaoOficina, 'FREIO');
  assert.equal(blocked.emExecucao, false);
});

test('liberacao multipla remove bloqueio e execucao apenas dos selecionados', () => {
  const other = { ...blocked, id: 'other', prefixo: '4202' };
  const result = addMaintenanceSelection([blocked, other], ['4200', '4201'], 'LIBERADO', '', blocked.data, true, company);
  for (const row of result.filter(i => i.prefixo !== '4202')) {
    assert.equal(row.liberado, true); assert.equal(row.bloqueado, false); assert.equal(row.emExecucao, false);
  }
  assert.deepEqual(result.find(i => i.prefixo === '4202'), other);
});

test('adicionar bloqueio em lote encerra execucao C4', () => {
  const executing = { ...blocked, bloqueado: false, emExecucao: true };
  const result = addMaintenanceSelection([executing], ['4200', '4201'], 'BLOQUEADO', 'motor', blocked.data, true, company);
  assert.equal(result[0].emExecucao, false);
  assert.equal(result[0].bloqueado, true);
  assert.equal(result[1].bloqueado, true);
});
