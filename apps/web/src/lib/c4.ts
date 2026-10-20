import { api } from './api';
import type { BloqueioCarro } from '@/data/solturaData';
import type { ManutencaoCarroItem } from '@/pages/manutencao/manutencaoManager';
import { operationalContext, revision, readTicket, assertReadTicket } from './mvpTemporal';
import { ReadInterrupted } from './readCoordination';

export type C4Garage = 'VCG' | 'VCM';
export interface C4Context {
  mode: 'C4' | 'LEGADO'; garagem: C4Garage; garages?: C4Garage[]; day?: string; baseC4?: string; mutable?: boolean; ciMutable?: boolean;
  folha?: { id: number; status: string; tituloColunaAdicional: string | null } | null;
  folhas?: { id: number; dataFolha: string; status: string; origem: string; tituloColunaAdicional: string | null }[];
  ci?: BloqueioCarro[]; maintenance?: ManutencaoCarroItem[];
}
const contexts = new Map<string, C4Context>();
const reads = new Map<string, Promise<C4Context>>();
const sequences = new Map<string, number>();
const origins = new WeakMap<C4Context, { key: string; sequence: number; ticket: number }>();
const snapshots = new WeakMap<object, { garagem: C4Garage; day: string; kind: 'ci' | 'manutencao'; base: string; baseC4: string }>();
export const c4Configured = () => [...contexts.values()].some(c => Boolean(c.garages?.length));
export const c4Context = (garagem: C4Garage = 'VCG', day = operationalContext().today) => contexts.get(`${garagem}:${day}`);
export const c4Enabled = (garagem: C4Garage = 'VCG') => c4Context(garagem)?.mode === 'C4';
export function storeC4Context(context: C4Context, day: string) {
  const origin = origins.get(context);
  if (origin) {
    if (origin.key !== `${context.garagem}:${day}`) throw new ReadInterrupted('CONTEXT_CHANGED', 'Contexto C4 fora da consulta solicitada.');
    assertReadTicket(origin.ticket);
    if (origin.sequence !== sequences.get(origin.key)) throw new ReadInterrupted('SUPERSEDED', 'Consulta C4 substituida por uma mais recente.');
  }
  contexts.set(`${context.garagem}:${day}`, context);
}
export async function fetchC4Context(garagem: C4Garage, day = operationalContext().today) {
  const ticket = readTicket(), key = `${garagem}:${day}`, readKey = `${key}:${ticket}`;
  const running = reads.get(readKey);
  if (running) return running;
  const sequence = (sequences.get(key) ?? 0) + 1;
  sequences.set(key, sequence);
  const request = (async () => {
    const context = await api.get<C4Context>('/c4/contexto', { params: { garagem, data: day } });
    assertReadTicket(ticket);
    if (sequence !== sequences.get(key)) throw new ReadInterrupted('SUPERSEDED', 'Consulta C4 substituida por uma mais recente.');
    if (context.garagem !== garagem || (context.day && context.day !== day)) throw new Error('Contexto C4 fora da consulta solicitada.');
    if (context.mode === 'C4') {
      if (!context.baseC4 || !Array.isArray(context.ci) || !Array.isArray(context.maintenance)) throw new Error('Snapshot C4 incompleto.');
      const tomorrow = new Date(`${day}T12:00:00Z`);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const target = tomorrow.toISOString().slice(0, 10);
      snapshots.set(context.ci, { garagem, day: target, kind: 'ci', baseC4: context.baseC4,
        base: revision(context.ci.filter(i => i.data === target && i.garagem === garagem)) });
      snapshots.set(context.maintenance, { garagem, day, kind: 'manutencao', baseC4: context.baseC4, base: revision(context.maintenance) });
    }
    origins.set(context, { key, sequence, ticket });
    return context;
  })();
  reads.set(readKey, request);
  try { return await request; } finally { if (reads.get(readKey) === request) reads.delete(readKey); }
}
// A revisao pertence a lista lida, nunca ao ultimo contexto de outra consulta.
export function c4SnapshotRevision(baseline: readonly { id?: string; updatedAt?: unknown }[], garagem: C4Garage, day: string, kind: 'ci' | 'manutencao') {
  const snapshot = snapshots.get(baseline);
  const current = kind === 'ci' ? (baseline as BloqueioCarro[]).filter(i => i.data === day && i.garagem === garagem) : baseline;
  if (!snapshot || snapshot.garagem !== garagem || snapshot.day !== day || snapshot.kind !== kind || snapshot.base !== revision(current)) {
    throw new Error('Lista sem snapshot C4 correspondente. Recarregue CI e Controle.');
  }
  return { base: snapshot.base, baseC4: snapshot.baseC4 };
}
export function ciContextDay(date: string) {
  const day = new Date(date + 'T12:00:00Z'); day.setUTCDate(day.getUTCDate() - 1); return day.toISOString().slice(0, 10);
}
export function ciNextDay(date: string) { return new Date(Date.parse(date + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10); }
export function c4Folha(day: string, garagem: C4Garage = 'VCG') { return (c4Context(garagem, ciContextDay(day)) ?? c4Context(garagem))?.folhas?.find(f => f.dataFolha === day); }
export function c4Mutable(day: string, garagem: C4Garage = 'VCG') {
  return day > operationalContext().today && c4Context(garagem, ciContextDay(day))?.ciMutable && c4Folha(day, garagem)?.status === 'EM_PREPARACAO';
}
// Representacao existente da UI e traduzida para a identidade persistida tipo+ordem.
export function c4Items(items: BloqueioCarro[]) {
  return items.map(i => {
    const slot = i.reforcoSlotId || i.id?.match(/ci-reforco-(ref(?:-extra)?-\d+)-/)?.[1];
    const match = slot?.match(/^ref(-extra)?-(\d+)$/);
    return { ...i, ...(i.categoriaPlanilha === 'REFORCO' && match ? { tipoPosicao: match[1] ? 'EXTRA' : 'FIXO', ordemPosicao: Number(match[2]) } : {}) };
  });
}

// Navegacao independente da janela de escrita; muda somente as 03h civis.
export { initialCIDate } from './ciInitialDate';
export function c4OperationalContext(garagem: C4Garage, now = new Date()) {
 return operationalContext(now, c4Context(garagem, operationalContext(now).today)?.mode === 'C4' ? 72000 : 66600);
}
