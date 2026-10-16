import test from 'node:test';
import assert from 'node:assert/strict';
import { buildColorCache } from '../src/services/fleetColors';
import { groupReserveColors } from '../src/services/scaleReserveColors';
import { allocationProjection } from '../src/services/escalaAllocation';

test('seis grupos seguem ordem aprovada, executivo vira micro e desconhecidos viram outro', () => {
  const cache = buildColorCache([1, 4, 6, 5, 3, null, 99].map((code, i) => ({ idCarro: 5001 + i, carroceriaFAIXA: code })));
  const result = groupReserveColors(['5001', '5002', '5003', '5004', '5005', '5006', '5007', '5008'], cache);
  assert.deepEqual(result.grupos.map(g => g.id), ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO']);
  assert.deepEqual(result.grupos.map(g => g.prefixos), [['5001'], ['5002'], ['5003'], ['5004'], ['5005'], ['5006', '5007', '5008']]);
});

test('cores ausentes ou invalidas nao classificam toda a frota como outro', () => {
  const result = groupReserveColors(['5001'], null);
  assert.equal(result.updatedAt, null);
  assert.ok(result.grupos.every(g => g.prefixos.length === 0));
});

test('so agrupa livres, libera fixo substituido e ignora alocacoes manuais antigas por cor sem alterar dados', () => {
  const lines = [{ id: '1', linha: '01', tabela: '1', carroProgramado: '4200' }];
  const cards = [
    { id: 'AZUL', titulo: 'AZUL', modo: 'lista' as const, itens: [{ id: 'old', prefixo: '4201' }] },
    { id: 'LIMPEZA', titulo: 'LIMPEZA', modo: 'lista' as const, itens: [{ id: 'clean', prefixo: '4202' }] },
    { id: 'PORTARIA', titulo: 'PORTARIA', modo: 'lista' as const, itens: [{ id: 'block', prefixo: '4203' }] },
  ];
  const before = JSON.stringify(cards);
  const frota = ['4200', '4201', '4202', '4203', '4204', '4205'];
  const initial = allocationProjection(lines, [], cards, frota, ['4204']);
  assert.deepEqual(initial.reserva, ['4201', '4205']);
  const substituted = allocationProjection(lines, [{ id: '1', carroSubstituido: '4205' }], cards, frota, ['4204']);
  assert.deepEqual(substituted.reserva, ['4200', '4201']);
  const cache = buildColorCache(frota.map(idCarro => ({ idCarro, carroceriaFAIXA: 1 })));
  assert.deepEqual(groupReserveColors(substituted.reserva, cache).grupos[0].prefixos, ['4200', '4201']);
  assert.equal(JSON.stringify(cards), before);
});
