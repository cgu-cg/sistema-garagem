import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleLinkedReleaseIds, refreshPendingScaleCars } from '../src/services/releaseScaleUpdates';
import { updatedReleaseSheetRows } from '../src/services/releaseProgramming';

const c = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-11-04' } as const;
const rows = [
  { id: 'pendente', linha: '302', tabela: '1', saidaGaragem: '05:00', carroProgramado: '4000' },
  { id: 'liberada', linha: '308', tabela: '2', saidaGaragem: '05:05', carroProgramado: '4001' },
];
test('politica preserva carros explicitos e identifica heranca ao iniciar a folha', () => {
  assert.deepEqual(scaleLinkedReleaseIds(rows, true, false, true), ['pendente', 'liberada']);
  assert.deepEqual(scaleLinkedReleaseIds(rows, true, false, false), []);
  assert.deepEqual(scaleLinkedReleaseIds(rows, false, false, false), ['pendente', 'liberada']);
  assert.deepEqual(scaleLinkedReleaseIds([{ ...rows[0], carroProgramado: '' }, rows[1]], false, true, false), ['pendente']);
});
test('somente programado de viagem pendente muda; liberadas e demais campos permanecem iguais', () => {
  const before = structuredClone(rows);
  for (const status of ['LIBERADO', 'SUBSTITUIDO']) {
    const updated = refreshPendingScaleCars(rows, rows.map(r => ({ ...r, carroProgramado: '4999' })), rows.map(r => r.id),
      [{ scheduleId: 'liberada', status, carroProgramado: '4001' }]);
    assert.deepEqual(updated[0], { ...rows[0], carroProgramado: '4999' });
    assert.deepEqual(updated[1], rows[1]);
  }
  assert.deepEqual(rows, before);
  assert.deepEqual(refreshPendingScaleCars(rows, [], ['pendente'], []), rows);
});
test('vinculo consulta mesma data/garagem/tipo; aguarda escala finalizada e preserva snapshot antigo', async () => {
  let state: any = { version: 3, itens: [{ id: 's1', carroSubstituido: '4002' }], cards: [], confirmacoes: [],
    programacao: [{ ...rows[0], id: 's1', saidaGaragem: '04:00' }, { ...rows[1], id: 's2' }],
    fluxo: { status: 'FINALIZADA', iniciadaEm: '2026-11-03T16:00:00Z', finalizadaEm: '2026-11-03T17:00:00Z', fonteCI: { ciData: c.dataOperacao, bloqueados: [], ciAvisos: [] } } };
  const db: any = { escalaDiaria: { findUnique: async ({ where }: any) => {
    assert.deepEqual(where.garagem_escalaTipo_turno_dataOperacao, c); return { conteudo: JSON.stringify(state) };
  } } };
  const sheet = { version: 1 as const, itens: rows, eventos: [], escalaVinculadaIds: ['pendente', 'liberada'] };
  const updated = await updatedReleaseSheetRows(db, c, sheet, [{ scheduleId: 'liberada', status: 'LIBERADO', carroProgramado: '4001' }]);
  assert.equal(updated[0].carroProgramado, '4002'); assert.equal(updated[0].saidaGaragem, '05:00');
  assert.deepEqual(updated[1], rows[1]);
  state.fluxo.status = 'EM_PREPARACAO'; state.fluxo.finalizadaEm = null;
  assert.deepEqual(await updatedReleaseSheetRows(db, c, sheet, []), rows);
  assert.deepEqual(await updatedReleaseSheetRows({} as any, c, { ...sheet, escalaVinculadaIds: undefined }, []), rows);
  assert.deepEqual(await updatedReleaseSheetRows({} as any, { ...c, turno: 'VESPERTINO' }, sheet, []), rows);
});
