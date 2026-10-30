import type { PrismaClient } from '@prisma/client';
import { assertC4Read } from './c4Authorization';
import { officialGarageFleet } from './escalaAllocation';
import { officialFleet, loadColorCache, type FleetLoader, type ColorLoader, type parseDailyContext } from './escalaDiaria';
import { vehicleColor } from './fleetColors';
import { groupReserveColors } from './scaleReserveColors';

export const isIndependentRelease = (context: { escalaTipo: string; turno: string }) =>
  context.escalaTipo === 'SEG_SEX' && context.turno === 'VESPERTINO';

// Mantem o formato de frota usado pelos seletores, sem ler CI ou Escala.
export async function readIndependentReleaseFleet(db: Pick<PrismaClient, 'user'>,
  contexto: ReturnType<typeof parseDailyContext>, userId: number | undefined,
  loadFleet: FleetLoader = officialFleet, loadColors: ColorLoader = loadColorCache) {
  await assertC4Read(db, userId, contexto.garagem);
  const frota = officialGarageFleet(await loadFleet(), contexto.garagem), colors = await loadColors();
  return { contexto, revisao: 0, itens: [], cards: [], confirmadas: [], ocupacoes: [], bloqueados: [], ciAvisos: [],
    ciData: contexto.dataOperacao, cardsOrigem: 'padrao' as const, omitidosPadrao: 0, frota, reserva: frota,
    coresFrota: Object.fromEntries(frota.map(p => [p, vehicleColor(colors, p)])), reservaPorCor: groupReserveColors(frota, colors),
    fluxo: { status: 'NAO_INICIADA' as const, ciFinalizada: false, proximaIniciada: false, iniciadaEm: null, finalizadaEm: null } };
}
