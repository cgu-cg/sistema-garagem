import type { TrafficCommand, TrafficRow } from './trafficSchema';

export function sameDayReleaseBases(exceptions: TrafficCommand[], garage: string, date: string) {
  return exceptions.filter(item => item.tipo === 'SOLTURA' && item.contexto.garagem === garage && item.contexto.dataOperacao === date)
    .map(item => ({
      key: `soltura-dia:${JSON.stringify(item.contexto)}`,
      label: `Soltura desta data: ${item.nome} · ${item.contexto.turno === 'MATUTINO' ? 'Matutino' : item.contexto.turno === 'VESPERTINO' ? 'Vespertino' : 'Padrão'}`,
      itens: item.itens,
    }));
}

// Copia somente a programação; não transporta despachos nem compartilha objetos.
export function copyTrafficBase(rows: TrafficRow[], makeId: () => string): TrafficRow[] {
  return structuredClone(rows).map(row => ({ ...row, id: `trafego-${makeId()}`, status: 'PENDENTE' }));
}
