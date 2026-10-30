import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultScheduleSelection, selectScheduleDate } from '../../web/src/lib/scheduleSelection';

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
