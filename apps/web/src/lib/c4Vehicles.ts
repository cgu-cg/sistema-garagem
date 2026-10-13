// Valor observado da coluna Veiculos.garagem, sem inferencia de prefixo/empresa.
export function vehiclesForGarage<T extends { garagemFonte?: number }>(items: T[], garagem: 'VCG' | 'VCM'): T[] {
  const code = garagem === 'VCG' ? 2 : 1;
  return items.filter(i => i.garagemFonte === code);
}
