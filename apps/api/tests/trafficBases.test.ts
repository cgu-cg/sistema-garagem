import test from 'node:test';
import assert from 'node:assert/strict';
import { sameDayReleaseBases, copyTrafficBase } from '../../web/src/lib/trafficBases';
import type { TrafficCommand } from '../../web/src/lib/trafficSchema';

const release: TrafficCommand = { tipo: 'SOLTURA', nome: 'Feriado especial', revisao: 1,
  contexto: { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-12-25' },
  itens: [{ id: 'original', linha: '302', tabela: '1', carroProgramado: '3253', saidaGaragem: '05:00' }] };

test('base de Soltura filtra data e garagem e identifica os turnos', () => {
  const options = sameDayReleaseBases([release, { ...release, tipo: 'ESCALA' },
    { ...release, contexto: { ...release.contexto, garagem: 'VCM' } },
    { ...release, contexto: { ...release.contexto, dataOperacao: '2026-12-26' } },
    { ...release, contexto: { ...release.contexto, turno: 'VESPERTINO' } }], 'VCG', '2026-12-25');
  assert.equal(options.length, 2);
  assert.match(options[0].label, /Matutino/); assert.match(options[1].label, /Vespertino/);
  assert.notEqual(options[0].key, options[1].key);
  assert.equal(sameDayReleaseBases([release], 'VCG', '2026-12-26').length, 0);
});

test('cópia mantém campos programados, cria IDs próprios e não altera a Soltura', () => {
  const before = structuredClone(release);
  const copied = copyTrafficBase(release.itens, () => 'novo');
  assert.equal(copied[0].id, 'trafego-novo');
  assert.equal(copied[0].saidaGaragem, '05:00'); assert.equal(copied[0].carroProgramado, '3253');
  copied[0].linha = 'EDITADA';
  assert.deepEqual(release, before);
});
