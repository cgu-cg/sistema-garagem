import { MvpError, operationalContext as legacyContext, assertContext } from './mvpTemporal';

export const C4_CLOSE_HOUR = 20;
export const operationalContext = (now = new Date()) => legacyContext(now, C4_CLOSE_HOUR * 3600);
export const assertC4Context = (date: unknown, kind: 'ci' | 'manutencao', now = new Date()) => assertContext(date, kind, now, C4_CLOSE_HOUR * 3600);

export type Garage = 'VCG' | 'VCM';
export const TIME_ZONE = 'America/Campo_Grande';
export function enabledGarages(value = process.env.CI_NOVO_FLUXO_GARAGENS || ''): Garage[] {
  const entries = value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  if (entries.some(s => s !== 'VCG' && s !== 'VCM')) throw new Error('CI_NOVO_FLUXO_GARAGENS invalida.');
  return [...new Set(entries)] as Garage[];
}
export function garage(value: unknown): Garage {
  if (value !== 'VCG' && value !== 'VCM') throw new MvpError(400, 'Informe o contexto VCG ou VCM.');
  return value;
}
export function mutationMode(value: unknown, enabled = enabledGarages()): 'C4' | 'LEGADO' {
  if (!value && enabled.length) throw new MvpError(400, 'Informe garagem explicitamente.');
  if (value === 'VCG' || !value) return enabled.includes('VCG') ? 'C4' : 'LEGADO';
  if (value === 'VCM' && enabled.includes('VCM')) return 'C4';
  throw new MvpError(409, 'Contexto nao habilitado para mutacoes.');
}
export function civil(value: unknown): string {
  if (typeof value !== 'string' || value < '0001-01-01' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new MvpError(400, 'Data civil invalida.');
  }
  return value;
}
export const dateValue = (value: string) => new Date(`${civil(value)}T00:00:00Z`);
export const dateString = (value: Date) => value.toISOString().slice(0, 10);
export function addDays(value: string, days: number) {
  const d = dateValue(value); d.setUTCDate(d.getUTCDate() + days); return dateString(d);
}
// Converte horario civil com Intl, sem depender de TZ do processo nem fixar offset.
export function eventInstant(day: string, hour: number, minute = 0) {
  const wall = Date.parse(`${civil(day)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
  let instant = wall;
  for (let n = 0; n < 3; n++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(instant));
    const get = (key: string) => parts.find(p => p.type === key)!.value;
    const displayed = Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`);
    instant += wall - displayed;
  }
  return new Date(instant);
}
export function nextEvent(now = new Date()) {
  const { today } = operationalContext(now);
  const events = [eventInstant(today, 3), eventInstant(today, C4_CLOSE_HOUR), eventInstant(addDays(today, 1), 3)];
  return events.find(e => e > now)!;
}
