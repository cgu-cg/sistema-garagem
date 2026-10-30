import test from 'node:test';
import assert from 'node:assert/strict';
import { programReleaseRows, releaseScaleContext, finalizedReleaseRows } from '../src/services/releaseProgramming';
import { currentScaleTemplate, currentReleaseTemplate } from '../src/data/scheduleTemplates';
import { applyReleaseRecords } from '../../web/src/lib/releaseSchedule';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-24' } as const;
const [first] = currentReleaseTemplate(context);
const candidate = { id: 'scale-row', linha: first.linha, tabela: first.tabela, carroProgramado: '4001' };

test('correspondencia usa linha E tabela, substituto prevalece e campos JSON de carro sao ignorados', () => {
  const rows = programReleaseRows(context, [candidate], [{ id: candidate.id, carroSubstituido: '5001' }]);
  assert.equal(rows[0].carroProgramado, '5001');
  assert.ok(rows.filter(row => row.linha !== first.linha || row.tabela !== first.tabela).every(row => row.carroProgramado === ''));
  assert.equal(programReleaseRows(context, [{ ...candidate, tabela: 'INEXISTENTE' }], [])[0].carroProgramado, '');
  assert.ok(programReleaseRows(context, [], []).every(row => row.carroProgramado === ''));
});

test('equivalencias de codigo nao dependem de zeros, espacos ou separador, ambiguidades ficam vazias', () => {
  const normalized = (code: string) => code.split('/').map(value => /^\d+$/.test(value) ? '0' + value : value).join('_');
  const row = { ...candidate, linha: ' ' + normalized(candidate.linha) + ' ', tabela: normalized(candidate.tabela) };
  assert.equal(programReleaseRows(context, [row], [])[0].carroProgramado, '4001');
  assert.equal(programReleaseRows(context, [candidate, { ...candidate, id: 'second' }], [])[0].carroProgramado, '');
});

test('vespertino ignora escala e substituicoes, mantendo apenas o molde sem programados', async () => {
 const evening = { ...context, turno: 'VESPERTINO' } as const;
 const scale = currentScaleTemplate(context);
 assert.ok(programReleaseRows(evening, scale, [{ id: scale[0].id, carroSubstituido: '5001' }]).every(row => row.carroProgramado === ''));
 const db: any = { escalaDiaria: { findUnique: async () => { throw Error('Nao deve consultar escala'); } } };
 const rows = await finalizedReleaseRows(db, evening);
 assert.equal(rows?.length, currentReleaseTemplate(evening).length);
 assert.ok(rows?.every(row => row.carroProgramado === ''));
 assert.deepEqual(releaseScaleContext(context), context);
});

test('matutino continua exigindo escala finalizada', async () => {
 const db: any = { escalaDiaria: { findUnique: async () => null } };
 assert.equal(await finalizedReleaseRows(db, context), null);
 db.escalaDiaria.findUnique = async () => ({ conteudo: '[]' });
 assert.equal(await finalizedReleaseRows(db, context), null);
});

test('reprogramar pendentes preserva carro e identificacao da viagem ja despachada, inclusive programado vazio', () => {
  const before = programReleaseRows(context, [candidate], []);
  const snapshot = { ...before[0], linha: 'ORIGINAL', saidaGaragem: '04:00' };
  const saved = { carroRealizado: '4002', carroProgramado: '', motoristaCodigo: '123', motoristaNome: '', horaLiberacao: '04:00', substituido: true,
    scheduleSnapshot: { ...snapshot, carroProgramado: '' } };
  const after = programReleaseRows(context, [candidate], [{ id: candidate.id, carroSubstituido: '5001' }]);
  const merged = applyReleaseRecords(after, { [first.id]: saved });
  assert.equal(merged[0].carroProgramado, '');
  assert.equal(merged[0].carroRealizado, '4002');
  assert.equal(merged[0].linha, 'ORIGINAL');
  assert.equal(merged[0].saidaGaragem, '04:00');
  assert.equal(applyReleaseRecords(after, {})[0].carroProgramado, '5001');
});
