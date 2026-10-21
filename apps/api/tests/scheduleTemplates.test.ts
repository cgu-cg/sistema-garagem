import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { currentScaleTemplate, currentReleaseTemplate } from '../../web/src/data/scheduleTemplates';
import { releaseScheduleBase, applyReleaseRecords } from '../../web/src/lib/releaseSchedule';
import { createSolturaSchema, batchSyncSolturaSchema } from '../src/utils/schemas';
const { generate, specs } = require('../../../scripts/importar-moldes-vcg.cjs');
const XLSX = require('xlsx');
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' } as const;

test('sete moldes reproduzem os Excel, sao deterministas e tem copias identicas na API', () => {
  const expected = [202, 108, 52, 202, 84, 108, 52];
  for (const [index, entry] of generate().entries()) {
    const saved = read(entry.json);
    assert.equal(saved.length, expected[index]);
    assert.deepEqual(saved, entry.items);
    assert.deepEqual(saved, read(entry.json.replace('apps/web/', 'apps/api/')));
    assert.equal(new Set(saved.map((i: any) => i.id)).size, saved.length);
    const book = XLSX.readFile(entry.excel);
    const raw: string[][] = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, raw: false, defval: '' });
    const rows = raw.slice(1).filter(row => row[0] && (row[1] || ['SISEP', 'ESP.VCM'].includes(row[0])));
    assert.equal(rows.length, saved.length);
    rows.forEach((row, i) => {
      assert.equal(saved[i].linha, String(row[0]).trim()); assert.equal(saved[i].tabela, String(row[1]).trim());
      assert.equal(saved[i].carroProgramado, String(row[4]).trim());
      assert.equal(saved[i].saidaGaragem, row[2] ? String(row[2]).replace(';', ':').padStart(5, '0') : '');
      assert.equal(saved[i].ordem, i + 1); assert.equal(saved[i].status, 'PENDENTE');
      assert.ok(!('carroRealizado' in saved[i])); assert.ok(!('carroSubstituido' in saved[i]));
    });
  }
  assert.equal(specs.length, 7);
});
test('molde da escala e da soltura ficam separados e os campos de garagem sao preservados', () => {
  const scale = currentScaleTemplate(context), release = currentReleaseTemplate(context);
  assert.equal(scale[0].carroProgramado, '3253'); assert.equal(release[0].carroProgramado, '');
  assert.equal(scale[0].saidaGaragem, '03:50'); assert.equal(scale[0].chegadaGaragem, '04:30');
  assert.equal(scale[0].id, 'vcg-mat-001'); assert.equal(scale[0].id, release[0].id);
  assert.equal(scale.find(i => i.linha === '316' && i.tipo === 'VCM')?.chegadaGaragem, 'VCM');
  const afternoon = currentReleaseTemplate({ ...context, turno: 'VESPERTINO' });
  assert.equal(afternoon.length, 84);
  assert.equal(afternoon.find(i => i.linha === '321' && i.observacoes === 'T. BANDEIRANTES')?.saidaGaragem, '14:55');
  assert.equal(scale.filter(i => i.tipo === 'FRETAMENTO').length, 2);
  assert.ok(scale.filter(i => i.tipo === 'FRETAMENTO').every(i => i.tabela === ''));
});
test('VCG usa JSON mesmo com publicacao antiga; VCM conserva comportamento anterior', () => {
  const published = [{ ...releaseScheduleBase(context)[0], linha: 'PUBLICADA ANTIGA' }];
  assert.notEqual(releaseScheduleBase(context, published)[0].linha, 'PUBLICADA ANTIGA');
  assert.equal(releaseScheduleBase({ ...context, garagem: 'VCM' }, published), published);
  for (const [escalaTipo, count] of [['SEG_SEX', 202], ['SABADO', 108], ['DOM_FER', 52]] as const) {
    assert.equal(currentScaleTemplate({ ...context, escalaTipo }).length, count);
  }
  assert.equal(releaseScheduleBase({ ...context, garagem: 'VCM' }).length, 59);
});
test('despachos salvos sobrepoem campos operacionais e viagens retiradas continuam no historico', () => {
  const base = releaseScheduleBase(context), before = JSON.stringify(base);
  const record = { carroRealizado: '4000', motoristaCodigo: '123', motoristaNome: 'Motorista', horaLiberacao: '04:00', substituido: true };
  const records = { [base[0].id]: record, retirada: { ...record, scheduleSnapshot: { ...base[0], id: 'retirada', linha: 'ANTIGA' } } };
  const today = applyReleaseRecords(base, records), history = applyReleaseRecords(base, records, true);
  assert.equal(today[0].carroRealizado, '4000'); assert.equal(today[0].status, 'SUBSTITUIDO');
  assert.equal(today.length, base.length); assert.equal(history.length, base.length + 1);
  assert.equal(history.at(-1)?.linha, 'ANTIGA'); assert.equal(history.at(-1)?.status, 'SUBSTITUIDO');
  assert.equal(JSON.stringify(base), before);
});
test('tabela vazia aceita somente fretamentos identificados no molde, em escrita unica e lote', () => {
  const special = currentReleaseTemplate(context).find(i => i.tipo === 'FRETAMENTO')!;
  const entry = { scheduleId: special.id, linha: special.linha, tabela: '', carroRealizado: '4000', driverCode: '123' };
  const header = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-21' };
  assert.ok(createSolturaSchema.safeParse({ ...header, ...entry }).success);
  assert.ok(batchSyncSolturaSchema.safeParse({ ...header, items: [entry] }).success);
  for (const change of [{ linha: '302' }, { scheduleId: 'inventado' }, { garagem: 'VCM' }, { turno: 'VESPERTINO' }, { escalaTipo: 'SABADO' }]) {
    assert.equal(createSolturaSchema.safeParse({ ...header, ...entry, ...change }).success, false);
  }
  assert.equal(batchSyncSolturaSchema.safeParse({ ...header, items: [{ ...entry, scheduleId: 'inventado' }] }).success, false);
});
