// Valor observado da coluna Veiculos.garagem, sem inferencia de prefixo/empresa.
export function garageOne<T extends { garagemFonte?: number }>(items: T[]): T[] {
  return items.filter(i => i.garagemFonte === 1);
}
