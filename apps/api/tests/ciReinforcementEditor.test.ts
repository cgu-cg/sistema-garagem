import test from 'node:test';
import assert from 'node:assert/strict';
import type { BloqueioCarro } from '../../web/src/data/solturaTypes';
import { savedInspectionEntries, saveInspectionSelection, saveFixedReinforcement, type ReinforcementEditContext } from '../../web/src/pages/soltura/ciReinforcementEditor';

const context: ReinforcementEditContext = { date: '2026-10-27', garage: 'VCG', c4: true, serviceTitle: 'INSPEÇÃO',
  fixedSlots: [{ id: 'ref-1', horario: '07:15 - A' }, { id: 'ref-2', horario: '07:15 - A' }],
  legacyVehicle: () => ({ garagem: 'VCG', consorciada: 'VCG' }) };
const item = (changes = {}): BloqueioCarro => ({ id: 'c4-ci-1', prefixo: '4000', garagem: 'VCG', data: context.date,
  categoriaPlanilha: 'REFORCO', tipo: 'REFORCO_REVISAO', motivo: null, tipoPosicao: 'EXTRA', ordemPosicao: 1,
  chaveItem: 'b59af975-8a79-4795-b831-b6dd1117345f', horarioReforco: null, os: 'OBS ORIGINAL',
  consorciada: null, gravidade: null, status: null, responsavel: null, hora: null, ...changes });

for (const draft of [{ prefixo: '', motivo: 'INSPEÇÃO', obs: '' }, { prefixo: '4001', motivo: '   ', obs: '' },
  { prefixo: 'texto', motivo: 'INSPEÇÃO', obs: '' }]) test('horario rejeita prefixo/situacao incompletos sem alterar snapshot: ' + JSON.stringify(draft), () => {
  const original = [item()]; const before = structuredClone(original);
  assert.throws(() => saveFixedReinforcement(original, context, 'ref-1', '07:15 - A', draft));
  assert.deepEqual(original, before);
});

test('horario aceita observacao opcional e conserva identidade/NULL de item antigo', () => {
  const original = item({ tipoPosicao: 'FIXO', motivo: 'REVISÃO', os: null });
  const next = saveFixedReinforcement([original], context, 'ref-1', '07:15 - A', { prefixo: '4001', motivo: 'INSPEÇÃO', obs: '' });
  assert.equal(next.length, 1); assert.equal(next[0].id, original.id); assert.equal(next[0].chaveItem, original.chaveItem);
  for (const key of ['hora', 'gravidade', 'responsavel', 'status', 'consorciada', 'horarioReforco', 'os'] as const) assert.equal(next[0][key], null);
  assert.equal(next[0].motivo, 'INSPEÇÃO'); assert.equal(next[0].prefixo, '4001');
});

test('novo horario preserva posicoes diferentes com mesmo horario e outros setores', () => {
  const original = [item({ id: 'fixed-other', tipoPosicao: 'FIXO', ordemPosicao: 2 }), item({ id: 'workshop', categoriaPlanilha: 'OFICINA' })];
  const next = saveFixedReinforcement(original, context, 'ref-1', '07:15 - A', { prefixo: '4000', motivo: 'INSPEÇÃO', obs: 'POSTO M' });
  assert.deepEqual(next.slice(0, 2), original); assert.equal(next[2].ordemPosicao, 1);
  assert.equal(next[2].os, 'POSTO M'); assert.equal(next[2].horarioReforco, '07:15 - A');
});

test('inspecao seleciona seis carros em um snapshot novo sem modificar a lista original', () => {
  const original = [item({ id: 'workshop', categoriaPlanilha: 'OFICINA' })];
  const selected = Array.from({ length: 6 }, (_, index) => ({ key: `new-${4100 + index}`, prefixo: String(4100 + index) }));
  const next = saveInspectionSelection(original, context, selected);
  assert.equal(next.length, 7); assert.deepEqual(original, [next[0]]);
  const inspection = savedInspectionEntries(next, context);
  assert.deepEqual(inspection.map(i => i.key), Array.from({ length: 6 }, (_, i) => `ref-extra-${i + 1}`));
  assert.equal(new Set(inspection.map(i => i.prefixo)).size, 6);
  for (const { saved } of inspection) { assert.equal(saved.motivo, null); assert.equal(saved.os, null); assert.equal(saved.status, null); }
});

test('inspecao preserva IDs/campos existentes ao adicionar e remove apenas escolhas explicitamente retiradas', () => {
  const kept = item({ id: 'kept', ordemPosicao: 2 }), removed = item();
  const others = [item({ id: 'fixed', tipoPosicao: 'FIXO' }), item({ id: 'other-day', data: '2026-10-26' }), item({ id: 'vcm', garagem: 'VCM' }), item({ id: 'blocked', categoriaPlanilha: 'BLOQUEADO' })];
  const original = [removed, kept, ...others]; const before = structuredClone(original);
  const next = saveInspectionSelection(original, context, [{ key: 'ref-extra-2', prefixo: kept.prefixo }, { key: 'new-4999', prefixo: '4999' }]);
  assert.deepEqual(next.slice(0, others.length), others); assert.ok(next.includes(kept));
  assert.ok(!next.includes(removed)); assert.deepEqual(original, before);
  assert.equal(savedInspectionEntries(next, context).find(i => i.prefixo === '4999')?.key, 'ref-extra-1');
});

test('inspecao permite retirar todos os carros sem afetar o mesmo prefixo em outros setores', () => {
  const other = item({ categoriaPlanilha: 'OFICINA', id: 'workshop' });
  assert.deepEqual(saveInspectionSelection([item(), other], context, []), [other]);
});

test('inspecao rejeita sete carros, selecao duplicada e chave desconhecida', () => {
  const choices = Array.from({ length: 7 }, (_, index) => ({ key: `new-${4100 + index}`, prefixo: String(4100 + index) }));
  assert.throws(() => saveInspectionSelection([], context, choices), /máximo 6/);
  assert.throws(() => saveInspectionSelection([], context, [choices[0], choices[0]]), /repetida/);
  assert.throws(() => saveInspectionSelection([item()], context, [{ key: 'new-4000', prefixo: '4000' }, { key: 'ref-extra-1', prefixo: '4000' }]), /já selecionado/);
  assert.throws(() => saveInspectionSelection([], context, [{ key: 'ref-extra-8', prefixo: '4001' }]), /alterada/);
});

test('inspecao preserva registros antigos fora das seis posicoes e nulos quando mantidos', () => {
  const historical = item({ ordemPosicao: 1000, os: null });
  const next = saveInspectionSelection([historical], context, [{ key: 'ref-extra-1000', prefixo: '4000' }]);
  assert.deepEqual(next, [historical]);
});

test('legado mantem motivo da inspecao e identifica posicao pelo slot, sem criar outra folha', () => {
  const legacyContext = { ...context, c4: false };
  const next = saveInspectionSelection([], legacyContext, [{ key: 'new-4001', prefixo: '4001' }]);
  assert.equal(next[0].motivo, 'INSPEÇÃO'); assert.equal(next[0].data, context.date);
  assert.equal(next[0].consorciada, 'VCG'); assert.equal(savedInspectionEntries(next, legacyContext).length, 1);
});

test('posicao liberada pode receber novo carro sem duplicar FIXO/EXTRA no snapshot', () => {
  const released = item({ status: 'LIBERADO' }), fixed = item({ id: 'fixed', tipoPosicao: 'FIXO', status: 'LIBERADO' });
  const inspection = saveInspectionSelection([released, fixed], context, [{ key: 'new-4001', prefixo: '4001' }]);
  assert.equal(inspection.length, 2); assert.ok(inspection.includes(fixed)); assert.ok(!inspection.includes(released));
  const next = saveFixedReinforcement(inspection, context, 'ref-1', '07:15 - A', { prefixo: '4002', motivo: 'INSPEÇÃO', obs: '' });
  assert.equal(next.length, 2); assert.ok(!next.includes(fixed));
  assert.equal(next.filter(i => i.tipoPosicao === 'FIXO' && i.ordemPosicao === 1).length, 1);
});
