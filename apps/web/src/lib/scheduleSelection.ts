export type ScheduleDayType = 'SEG_SEX' | 'SABADO' | 'DOM_FER';
export interface ScheduleSelection { date: string; dayType: ScheduleDayType }

export function defaultScheduleSelection(date: string): ScheduleSelection {
  const value = new Date(date + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== date)
    throw new Error('Data operacional invalida.');
  const weekday = value.getUTCDay();
  return { date, dayType: weekday === 6 ? 'SABADO' : weekday === 0 ? 'DOM_FER' : 'SEG_SEX' };
}

// Escolha manual vale enquanto a data nao mudar, inclusive ao clicar Hoje/Amanha novamente.
export function selectScheduleDate(current: ScheduleSelection, date: string): ScheduleSelection {
  return current.date === date ? current : defaultScheduleSelection(date);
}
