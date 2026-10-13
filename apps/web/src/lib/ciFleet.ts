import type { DataSourceResponse, InventoryVehicle } from './api';

export type FleetCar = { prefixo: string; garagem: 'VCG' | 'VCM'; garagemFonte?: number; garagemOriginal?: number | string };
export type FleetState = { cars: FleetCar[]; source: 'local' | 'real' | 'mock' | 'unknown'; loading: boolean; error: string | null };

export function fleetError(error: unknown): string {
  const e = error as { status?: number; code?: string; message?: string } | null;
  if (e?.status === 401) return 'Sessão expirada ou inválida. Entre novamente para consultar a frota.';
  if (e?.status === 403) return 'Seu usuário não tem acesso à consulta da frota.';
  if (e?.message === 'TIMEOUT_ERROR') return 'A consulta da frota excedeu o tempo de espera.';
  if (e?.code === 'SQL_SERVER_UNAVAILABLE') return 'A integração com o SQL Server legado está indisponível.';
  if (e?.status) return `Não foi possível consultar a frota (HTTP ${e.status}).`;
  if (error instanceof FleetValidationError) return `Frota rejeitada: ${error.diagnostic.incomplete} registros incompletos, ${error.diagnostic.unknownGarage} com garagem desconhecida e ${error.diagnostic.inconsistent} inconsistentes. A lista anterior foi mantida.`;
  if (e?.message === 'INVALID_FLEET_RESPONSE') return 'O servidor retornou uma lista de frota inválida.';
  return 'Não foi possível comunicar com o servidor para consultar a frota.';
}

export class FleetValidationError extends Error {
  constructor(readonly diagnostic: { incomplete: number; unknownGarage: number; inconsistent: number }) {
    super('INVALID_FLEET_RESPONSE');
  }
}

export function mapFleet(response: DataSourceResponse<InventoryVehicle[]>, reportMissingGarage = (count: number) => {
  console.warn('[CI frota] Veiculos omitidos dos seletores por ausencia de garagem:', count);
}): FleetCar[] {
  if (!response || !Array.isArray(response.data)) throw new Error('INVALID_FLEET_RESPONSE');
  const diagnostic = { incomplete: 0, unknownGarage: 0, inconsistent: 0 };
  const cars: FleetCar[] = [];
  let missingGarage = 0;
  for (const item of response.data) {
    if (!item || typeof item !== 'object') { diagnostic.incomplete++; continue; }
    const prefixo = String(item.prefixo ?? item.idCarro ?? '').trim();
    const id = String(item.idCarro ?? '').trim();
    const raw = item.garagem;
    if (!/^\d{1,10}$/.test(prefixo) || !/^\d{1,10}$/.test(id)) {
      diagnostic.incomplete++; continue;
    }
    if (raw == null || String(raw).trim() === '') { missingGarage++; continue; }
    const text = String(raw).trim().toUpperCase();
    // Mesma precedencia de reconhecimento explicito do backend; nunca usar seu fallback por prefixo.
    const garagemFonte = text === '1' || text.includes('VCM') || text.includes('MORENA') ? 1
      : text === '2' || text.includes('VCG') || text.includes('CAMPO GRANDE') ? 2 : undefined;
    if (garagemFonte === undefined) { diagnostic.unknownGarage++; continue; }
    const garagem = garagemFonte === 1 ? 'VCM' : 'VCG';
    if (item.garagemNome !== garagem || Number(prefixo) !== Number(id)) { diagnostic.inconsistent++; continue; }
    cars.push({ prefixo, garagem, garagemFonte, garagemOriginal: raw });
  }
  if (missingGarage > 0) reportMissingGarage(missingGarage);
  if (Object.values(diagnostic).some(count => count > 0)) throw new FleetValidationError(diagnostic);
  return cars;
}

// Leitura de cadastro independente das revisoes operacionais C4.
export function createCIFleetLoader(
  fetch: () => Promise<DataSourceResponse<InventoryVehicle[]>>, initial: FleetCar[],
  publish: (state: FleetState) => void,
  schedule: (callback: () => void, delay: number) => unknown,
  cancel: (timer: unknown) => void,
) {
  let state: FleetState = { cars: initial, source: 'local', loading: false, error: null };
  let mounted = false, generation = 0, retries = 0, timer: unknown;
  const clear = () => { if (timer !== undefined) { cancel(timer); timer = undefined; } };
  const emit = (next: FleetState) => { state = next; publish(state); };
  const load = async (manual = false) => {
    if (!mounted || state.loading) return;
    if (manual) retries = 0;
    clear();
    const number = ++generation;
    emit({ ...state, loading: true });
    try {
      const response = await fetch();
      if (!mounted || number !== generation) return;
      const cars = mapFleet(response);
      retries = 0;
      emit({ cars, source: response.source, loading: false, error: null });
    } catch (error) {
      if (!mounted || number !== generation) return;
      emit({ ...state, loading: false, error: fleetError(error) });
      const status = (error as { status?: number } | null)?.status;
      if (status !== 401 && status !== 403 && retries < 3) {
        const delay = 5000 * 2 ** retries++;
        timer = schedule(() => { timer = undefined; void load(); }, delay);
      }
    }
  };
  return {
    load,
    activate() { mounted = true; },
    dispose() { mounted = false; generation++; clear(); state = { ...state, loading: false }; },
    recover() { if (state.error && !state.loading) void load(true); },
  };
}
