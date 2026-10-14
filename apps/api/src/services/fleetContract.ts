export function recognizedFleetGarage(garagemRaw: unknown): 'VCM' | 'VCG' | undefined {
  if (garagemRaw !== null && garagemRaw !== undefined) {
    const str = String(garagemRaw).trim().toUpperCase();
    if (str === '1' || str.includes('VCM') || str.includes('MORENA')) return 'VCM';
    if (str === '2' || str.includes('VCG') || str.includes('CAMPO GRANDE')) return 'VCG';
  }
  return undefined;
}
// Preserve o valor legado; garagemNome e apenas a classificacao ja existente.
export function normalizeGaragemVeiculo(garagemRaw: unknown, idCarro: number | string): 'VCM' | 'VCG' {
  const recognized = recognizedFleetGarage(garagemRaw);
  if (recognized) return recognized;
  const clean = String(idCarro).replace(/\D/g, '');
  if (clean === '2002' || clean.startsWith('1')) return 'VCM';
  return 'VCG';
}

export function inventoryVehicle(row: { idCarro: number | string; garagem?: unknown }) {
  return { idCarro: row.idCarro, prefixo: String(row.idCarro), garagem: row.garagem,
    garagemNome: normalizeGaragemVeiculo(row.garagem, row.idCarro) };
}
