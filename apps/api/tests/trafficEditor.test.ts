import test from 'node:test';
import assert from 'node:assert/strict';
import { changeTrafficDate, editDatedTraffic, editRecurringTraffic, trafficEditorPayload } from '../../web/src/lib/trafficEditor';
import { trafficModelCommandSchema } from '../src/services/trafficSchema';

const item = { tipo: 'ESCALA' as const, nome: 'Escala padrão', revisao: 2,
  contexto: { garagem: 'VCG' as const, escalaTipo: 'SEG_SEX' as const, turno: 'MATUTINO' as const },
  itens: [{ id: 'linha1', linha: '302', tabela: '1', carroProgramado: '3253', saidaGaragem: '04:00' }] };

test('editor conserva vinculo ao abrir e salvar recorrente ou excecao', () => {
  const linked = { ...item, tipo: 'SOLTURA' as const, origemCarros: 'ESCALA' as const };
  assert.equal(trafficEditorPayload(editRecurringTraffic(linked)).origemCarros, 'ESCALA');
  assert.equal(trafficEditorPayload(editDatedTraffic({ ...linked, contexto: { ...linked.contexto, dataOperacao: '2026-11-09' } })).origemCarros, 'ESCALA');
});
test('editar recorrente abre linhas e funcionamento sem exigir data ou formulário de criação', () => {
  const draft = editRecurringTraffic(item);
  assert.equal(draft.funcionamento, 'RECORRENTE'); assert.equal(draft.contexto.dataOperacao, '');
  draft.itens[0].linha = 'EDITADA'; assert.equal(item.itens[0].linha, '302');
  const payload = trafficEditorPayload(draft);
  assert.ok('funcionamento' in payload); assert.equal('dataOperacao' in payload.contexto, false);
  assert.equal(payload.revisao, 2); assert.equal(payload.itens[0].linha, 'EDITADA');
});
test('editar data conserva origem e revisão ao mudar para sábado; não vira outro cadastro', () => {
  const original = { ...item, contexto: { ...item.contexto, dataOperacao: '2026-11-09' } };
  const draft = changeTrafficDate(editDatedTraffic(original), '2026-11-14');
  assert.equal(draft.contexto.escalaTipo, 'SABADO'); assert.equal(draft.contexto.turno, 'PADRAO');
  assert.equal(draft.origem?.dataOperacao, '2026-11-09'); assert.equal(draft.revisao, 2);
  const payload = trafficEditorPayload(draft);
  assert.ok(!('funcionamento' in payload)); assert.equal(payload.contexto.dataOperacao, '2026-11-14');
  assert.equal('origem' in payload ? payload.origem?.dataOperacao : '', '2026-11-09');
});
test('primeira edição do JSON recebe IDs próprios; modelo salvo conserva os IDs', () => {
  assert.equal(editRecurringTraffic({ ...item, revisao: 0 }, () => 'novo').itens[0].id, 'trafego-novo');
  assert.equal(editRecurringTraffic(item, () => 'novo').itens[0].id, 'linha1');
  assert.ok(!trafficModelCommandSchema.safeParse({ ...item, funcionamento: 'RECORRENTE', contexto: { ...item.contexto, dataOperacao: '2026-11-09' } }).success);
});
