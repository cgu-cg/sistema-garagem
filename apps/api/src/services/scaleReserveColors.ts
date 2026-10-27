import { vehicleColor, type FleetColorCache, type FleetColor } from './fleetColors';

export const reserveColorGroups = [
  { id: 'AZUL', titulo: 'AZUL' }, { id: 'VERMELHO', titulo: 'VERMELHO' }, { id: 'MICRO', titulo: 'MICRO' },
  { id: 'VERMELHO_AZUL', titulo: 'VERMELHO/AZUL' }, { id: 'PRATA', titulo: 'PRATA' }, { id: 'OUTRO', titulo: 'OUTRO' },
] as const;
export const isColorReserveCard = (id: string) => reserveColorGroups.some(g => g.id === id);

export function groupReserveColors(reserve: string[], cache: FleetColorCache | null) {
  return groupReserveColorsBy(reserve, cache?.updatedAt ?? null, prefixo => vehicleColor(cache, prefixo));
}
export function groupReserveColorsBy(reserve: string[], updatedAt: string | null, colorFor: (prefixo: string) => FleetColor) {
  const grupos = reserveColorGroups.map(g => ({ ...g, prefixos: [] as string[] }));
  if (updatedAt) for (const prefixo of [...new Set(reserve)]) {
    const color = colorFor(prefixo);
    const id = color === 'EXECUTIVO' ? 'MICRO' : color === 'VERMELHO/AZUL' ? 'VERMELHO_AZUL'
      : color === 'NAO IDENTIFICADO' ? 'OUTRO' : color;
    grupos.find(g => g.id === id)!.prefixos.push(prefixo);
  }
  return { updatedAt, grupos };
}
