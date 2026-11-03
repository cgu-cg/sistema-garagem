import test from 'node:test';
import assert from 'node:assert/strict';
import { trafficScaleLinkOptions } from '../../web/src/lib/trafficScaleLinks';
import { editRecurringTraffic, editDatedTraffic, changeTrafficDate, trafficEditorPayload } from '../../web/src/lib/trafficEditor';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' } as const;
const row = { id: 'viagem', linha: '302', tabela: '1', carroProgramado: '4000', saidaGaragem: '04:00' };
const scale = { tipo: 'ESCALA', nome: 'Escala Seg-Sex', revisao: 1, contexto: context, itens: [row] } as const;
const release = { ...scale, tipo: 'SOLTURA' as const, itens: [row] };
const special = { ...scale, nome: 'Feriado especial', contexto: { ...context, dataOperacao: '2026-11-09' }, itens: [row] };
const catalog = { padroes: [{ ...scale, itens: [row] },
  { ...scale, nome: 'Sabado', contexto: { ...context, escalaTipo: 'SABADO' as const, turno: 'PADRAO' as const }, itens: [row] },
  { ...scale, nome: 'Outra garagem', contexto: { ...context, garagem: 'VCM' as const }, itens: [row] }],
  excecoes: [special, { ...special, nome: 'Outro dia', contexto: { ...special.contexto, dataOperacao: '2026-11-10' } }] };

test('recorrente lista somente a Escala da mesma garagem e tipo de dia', () => {
  const options = trafficScaleLinkOptions(catalog, editRecurringTraffic(release));
  assert.deepEqual(options.map(o => o.key), ['recorrente:SEG_SEX']);
  assert.match(options[0].label, /Escala Seg-Sex/);
});

test('data especifica exibe especial do mesmo dia e nao oferece recorrente que seria sobreposta', () => {
  const draft = editDatedTraffic({ ...release, contexto: special.contexto, origemCarros: 'ESCALA' });
  const options = trafficScaleLinkOptions(catalog, draft);
  assert.deepEqual(options.map(o => o.key), ['data:2026-11-09']);
  assert.match(options[0].label, /Feriado especial/);
  assert.equal(trafficEditorPayload(draft).origemCarros, 'ESCALA');
  const next = trafficScaleLinkOptions(catalog, changeTrafficDate(draft, '2026-11-11'));
  assert.deepEqual(next.map(o => o.key), ['recorrente:SEG_SEX']);
});

test('nao oferece vinculacao para Escala, vespertino, catalogo ausente ou outra garagem', () => {
  assert.deepEqual(trafficScaleLinkOptions(catalog, editRecurringTraffic({ ...scale, itens: [row] })), []);
  assert.deepEqual(trafficScaleLinkOptions(catalog, editRecurringTraffic({ ...release, contexto: { ...context, turno: 'VESPERTINO' } })), []);
  assert.deepEqual(trafficScaleLinkOptions(null, editRecurringTraffic(release)), []);
  assert.deepEqual(trafficScaleLinkOptions({ padroes: [], excecoes: [{ ...special, contexto: { ...special.contexto, garagem: 'VCM' } }] }, editDatedTraffic({ ...release, contexto: special.contexto })), []);
});
