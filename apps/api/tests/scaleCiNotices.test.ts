import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ciFixedReinforcementTimes, projectScaleCiNotices } from '../src/services/scaleCiNotices';

test('avisos de reforco mostram horario completo da posicao fixa sem modificar origem', () => {
  const items = [1, 2, 3, 5, 7, 12].map(ordemPosicao => ({ prefixo: '2426', categoria: 'REFORCO', tipoPosicao: 'FIXO', ordemPosicao, horarioReforco: null }));
  const before = JSON.stringify(items);
  assert.deepEqual(projectScaleCiNotices(items, ['2426']).map(i => i.horario), ['07:15 - A', '07:15 - A', '07:32 - A', '07:40 - M', '07:40 - C', '07:50 - A']);
  assert.equal(JSON.stringify(items), before);
});

test('horario persistido tem prioridade, extras e posicoes desconhecidas nao recebem horario fixo', () => {
  const base = { prefixo: '2426', categoria: 'REFORCO', tipoPosicao: 'FIXO', ordemPosicao: 1 };
  assert.deepEqual(projectScaleCiNotices([
    { ...base, horarioReforco: '08:00 - M' }, { ...base, tipoPosicao: 'EXTRA' },
    { ...base, ordemPosicao: 13 }, { ...base, categoria: 'OFICINA' },
  ], ['2426']).map(i => i.horario), ['08:00 - M', null, null, null]);
});

test('horarios projetados correspondem aos horarios fixos da tela da CI', () => {
  const source = readFileSync('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'utf8');
  const section = source.slice(source.indexOf('const FIXED_REFORCO_SLOTS = ['), source.indexOf('// 3.1 SLOTS EXTRAS'));
  assert.deepEqual([...section.matchAll(/horario: "([^"]+)"/g)].map(m => m[1]), [...ciFixedReinforcementTimes]);
});
