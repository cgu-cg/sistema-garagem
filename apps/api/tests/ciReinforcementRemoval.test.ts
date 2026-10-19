import test from 'node:test';
import assert from 'node:assert/strict';
import type { BloqueioCarro } from '../../web/src/data/solturaData';
import { removeSavedReinforcement } from '../../web/src/pages/soltura/ciReinforcementRemoval';

const item = (changes = {}) => ({ id: 'c4-ci-1', prefixo: '3022', garagem: 'VCG', categoriaPlanilha: 'REFORCO',
  data: '2026-10-17', tipoPosicao: 'FIXO', ordemPosicao: 1, status: 'BLOQUEADO', ...changes } as BloqueioCarro);

test('retirada no reforco persiste e nao reaparece na recarga', async () => {
  const saved = item(); let server = [saved];
  assert.equal(await removeSavedReinforcement(server, saved, async next => { server = structuredClone(next); return true; }), true);
  assert.deepEqual(structuredClone(server), []);
});

test('retirada preserva o mesmo carro em outros slots, setores, datas e garagens', async () => {
  const saved = item();
  const others = [item({ id: 'c4-ci-2', ordemPosicao: 2 }), item({ id: 'c4-ci-3', categoriaPlanilha: 'OFICINA', setorOficina: 'ELEVADOR' }),
    item({ id: 'c4-ci-4', categoriaPlanilha: 'BLOQUEADO' }), item({ data: '2026-10-16' }), item({ garagem: 'VCM' })];
  const baseline = [saved, ...others]; const before = structuredClone(baseline);
  await removeSavedReinforcement(baseline, saved, async next => { assert.deepEqual(next, others); return true; });
  assert.deepEqual(baseline, before);
});

test('erro ou conflito nao confirma retirada nem altera fotografia anterior', async () => {
  const saved = item(), baseline = [saved];
  assert.equal(await removeSavedReinforcement(baseline, saved, async () => false), false);
  await assert.rejects(removeSavedReinforcement(baseline, saved, async () => { throw Error('409'); }), /409/);
  assert.deepEqual(baseline, [saved]);
});

test('retirada da posicao extra usa o id salvo e preserva as posicoes fixas', async () => {
  const fixed = item(), extra = item({ id: 'c4-ci-90', tipoPosicao: 'EXTRA', ordemPosicao: 1 });
  await removeSavedReinforcement([fixed, extra], extra, async next => { assert.deepEqual(next, [fixed]); return true; });
});

test('alvo ausente ou categoria errada nao envia gravacao', async () => {
  let calls = 0; const commit = async () => { calls++; return true; };
  await assert.rejects(removeSavedReinforcement([], item(), commit), /alterada/);
  await assert.rejects(removeSavedReinforcement([], item({ categoriaPlanilha: 'BLOQUEADO' }), commit), /invalida/);
  assert.equal(calls, 0);
});
