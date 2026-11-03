import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultScheduleSelection, selectScheduleDate, defaultReleasePeriod } from '../../web/src/lib/scheduleSelection';

test('Soltura Seg-Sex sugere vespertino a partir de 12h em Campo Grande, sem aplicar a fim de semana', () => {
  for (const [instant, expected] of [['2026-11-03T15:59:59Z', 'MATUTINO'], ['2026-11-03T16:00:00Z', 'VESPERTINO'],
    ['2026-11-03T23:00:00Z', 'VESPERTINO'], ['2026-11-04T03:59:59Z', 'VESPERTINO'], ['2026-11-04T04:00:00Z', 'MATUTINO']])
    assert.equal(defaultReleasePeriod('SEG_SEX', new Date(instant)), expected);
  for (const day of ['SABADO', 'DOM_FER'] as const)
    assert.equal(defaultReleasePeriod(day, new Date('2026-11-07T17:00:00Z')), 'MATUTINO');
});

test('data operacional seleciona dias uteis, sabado e domingo pelo calendario civil', () => {
 for (const [date, expected] of [['2026-10-30', 'SEG_SEX'], ['2026-10-31', 'SABADO'], ['2026-11-01', 'DOM_FER'], ['2026-11-02', 'SEG_SEX']])
  assert.equal(defaultScheduleSelection(date).dayType, expected);
});

test('escolha manual de sabado numa segunda e preservada; mudar data retoma automatico', () => {
 const manual = { date: '2026-11-02', dayType: 'SABADO' as const };
 assert.equal(selectScheduleDate(manual, manual.date), manual);
 assert.deepEqual(selectScheduleDate(manual, '2026-11-03'), { date: '2026-11-03', dayType: 'SEG_SEX' });
 assert.equal(selectScheduleDate(manual, '2026-11-01').dayType, 'DOM_FER');
});

test('calendario nao normaliza silenciosamente datas invalidas', () => {
 for (const date of ['2026-02-30', '2026-13-01', '', '2026-1-2']) assert.throws(() => defaultScheduleSelection(date));
});
