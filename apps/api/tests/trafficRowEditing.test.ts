import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmTrafficRow, moveTrafficRow, renumberTrafficRows } from '../../web/src/lib/trafficRowEditing';
import { trafficEditorPayload, editRecurringTraffic } from '../../web/src/lib/trafficEditor';

const rows = Array.from({ length: 6 }, (_, index) => ({ id: `row-${index + 1}`, ordem: index + 1, linha: String(300 + index),
  tabela: '1', carroProgramado: String(4000 + index), saidaGaragem: '04:00', observacoes: 'Preservar', ordemTerminal: 9 }));

test('mover da posição 1 para 5 fecha a origem, renumera sem lacunas e preserva dados/IDs', () => {
  const before = structuredClone(rows), moved = moveTrafficRow(rows, 'row-1', 4);
  assert.deepEqual(moved.map(row => row.id), ['row-2', 'row-3', 'row-4', 'row-5', 'row-1', 'row-6']);
  assert.deepEqual(moved.map(row => row.ordem), [1, 2, 3, 4, 5, 6]);
  assert.equal(moved[4].carroProgramado, '4000'); assert.equal(moved[4].observacoes, 'Preservar');
  assert.equal(moved[4].ordemTerminal, 9); assert.deepEqual(rows, before);
});
test('mover para cima, nos extremos e para a mesma posição mantém identidade', () => {
  assert.deepEqual(moveTrafficRow(rows, 'row-5', 0).map(row => row.id), ['row-5', 'row-1', 'row-2', 'row-3', 'row-4', 'row-6']);
  assert.equal(moveTrafficRow(rows, 'row-1', 99).at(-1)?.id, 'row-1');
  assert.equal(moveTrafficRow(rows, 'row-6', -2)[0].id, 'row-6');
  assert.equal(moveTrafficRow(rows, 'row-1', 0), rows);
  assert.equal(moveTrafficRow(rows, 'inexistente', 0), rows);
  assert.equal(moveTrafficRow(rows, 'row-1', NaN), rows);
});
test('confirmar valida a linha e aplica a ordem digitada sem duplicar viagens', () => {
  const edited = rows.map(row => row.id === 'row-1' ? { ...row, ordem: 5, linha: 'NOVA' } : row);
  const confirmed = confirmTrafficRow(edited, 'row-1');
  assert.equal(confirmed[4].linha, 'NOVA'); assert.equal(confirmed[4].ordem, 5);
  assert.equal(new Set(confirmed.map(row => row.id)).size, rows.length);
  assert.throws(() => confirmTrafficRow(rows.map(row => ({ ...row, linha: '' })), 'row-1'));
  assert.throws(() => confirmTrafficRow(rows.map(row => ({ ...row, saidaGaragem: '29:00' })), 'row-1'));
  assert.throws(() => confirmTrafficRow(rows, 'inexistente'));
});
test('excluir renumera e a ordem movida chega ao payload persistido', () => {
  const removed = renumberTrafficRows(rows.filter(row => row.id !== 'row-2'));
  assert.deepEqual(removed.map(row => row.ordem), [1, 2, 3, 4, 5]);
  const draft = editRecurringTraffic({ tipo: 'ESCALA', nome: 'Modelo', revisao: 1,
    contexto: { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' }, itens: moveTrafficRow(rows, 'row-1', 4) });
  const payload = trafficEditorPayload(draft);
  assert.equal(payload.itens[4].id, 'row-1'); assert.equal(payload.itens[4].ordem, 5);
});
