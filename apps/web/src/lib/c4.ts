import { api } from './api';
import type { BloqueioCarro } from '@/data/solturaData';
import type { ManutencaoCarroItem } from '@/pages/manutencao/manutencaoManager';
import { operationalContext } from './mvpTemporal';

export type C4Garage = 'VCG' | 'VCM';
export interface C4Context {
  mode: 'C4' | 'LEGADO'; garagem: C4Garage; garages?: C4Garage[]; day?: string; baseC4?: string; mutable?: boolean;
  folha?: { id: number; status: string; tituloColunaAdicional: string | null } | null;
  folhas?: { id: number; dataFolha: string; status: string; origem: string; tituloColunaAdicional: string | null }[];
  ci?: BloqueioCarro[]; maintenance?: ManutencaoCarroItem[];
}
const contexts = new Map<string, C4Context>();
export const c4Configured = () => [...contexts.values()].some(c => Boolean(c.garages?.length));
export const c4Context = (garagem: C4Garage = 'VCG', day = operationalContext().today) => contexts.get(`${garagem}:${day}`);
export const c4Enabled = (garagem: C4Garage = 'VCG') => c4Context(garagem)?.mode === 'C4';
export function storeC4Context(context: C4Context, day: string) { contexts.set(`${context.garagem}:${day}`, context); }
export async function fetchC4Context(garagem: C4Garage, day = operationalContext().today) {
  return api.get<C4Context>('/c4/contexto', { params: { garagem, data: day } });
}
export function c4Folha(day: string, garagem: C4Garage = 'VCG') { return c4Context(garagem)?.folhas?.find(f => f.dataFolha === day); }
export function c4Mutable(day: string, garagem: C4Garage = 'VCG') {
  return c4Context(garagem)?.mutable && day === operationalContext().tomorrow && c4Folha(day, garagem)?.status === 'EM_PREPARACAO';
}
// Representacao existente da UI e traduzida para a identidade persistida tipo+ordem.
export function c4Items(items: BloqueioCarro[]) {
  return items.map(i => {
    const slot = i.reforcoSlotId || i.id?.match(/ci-reforco-(ref(?:-extra)?-\d+)-/)?.[1];
    const match = slot?.match(/^ref(-extra)?-(\d+)$/);
    return { ...i, ...(i.categoriaPlanilha === 'REFORCO' && match ? { tipoPosicao: match[1] ? 'EXTRA' : 'FIXO', ordemPosicao: Number(match[2]) } : {}) };
  });
}
