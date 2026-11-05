import { portariaMetadata } from './portariaEvents';
import { resolveDateProgramming } from './trafficProgramming';
import { parseReleaseSheet, releaseSheetWhere } from './releaseLifecycle';
import { isIndependentRelease, readIndependentReleaseFleet } from './independentRelease';
import type { PrismaClient } from '@prisma/client';
import { currentReleaseTemplate, type TemplateContext, type TemplateRow } from '../data/scheduleTemplates';
import { fixedSchedule, parseDailyContext, parseStoredDailyScale, readEscalaDiaria, officialFleet, loadColorCache, type FleetLoader, type ColorLoader } from './escalaDiaria';
import { releaseFleetProjection } from './releaseFleetProjection';
import { refreshPendingScaleCars } from './releaseScaleUpdates';

export const releaseScaleContext = (context: TemplateContext & { dataOperacao: string }) => ({ ...context,
  turno: context.escalaTipo === 'SEG_SEX' ? 'MATUTINO' as const : 'PADRAO' as const });
const code = (value: string) => value.trim().replace(/[_-]/g, '/').replace(/\s/g, '')
  .split('/').map(part => /^\d+$/.test(part) ? String(Number(part)) : part).join('/');
const key = (row: { linha: string; tabela: string }) => JSON.stringify([code(row.linha), code(row.tabela)]);

export function programReleaseRows(context: TemplateContext, scale: { linha: string; tabela: string; carroProgramado: string; id: string }[],
  substitutions: { id: string; carroSubstituido: string }[], template: TemplateRow[] = currentReleaseTemplate(context), explicitProgramming = false, recurringCars = false, linkedScale = false) {
  const cars = new Map(substitutions.map(row => [row.id, row.carroSubstituido]));
  const byLineTable = new Map<string, typeof scale>();
  for (const row of scale) {
    const rowKey = key(row), matches = byLineTable.get(rowKey);
    if (matches) matches.push(row); else byLineTable.set(rowKey, [row]);
  }
  return template.map(row => {
    const matches = byLineTable.get(key(row)) ?? [];
    const carroProgramado = isIndependentRelease(context) ? '' : !linkedScale && explicitProgramming ? row.carroProgramado
      : !linkedScale && recurringCars && row.carroProgramado ? row.carroProgramado
      : matches.length === 1 ? cars.get(matches[0].id) ?? matches[0].carroProgramado : '';
    return { ...row, carroProgramado, status: 'PENDENTE' as const };
  });
}

export async function finalizedReleaseRows(tx: Pick<PrismaClient, 'escalaDiaria'> & Partial<Pick<PrismaClient, 'trafegoProgramacao'>>, context: TemplateContext & { dataOperacao: string }) {
  const template = await resolveDateProgramming(tx, 'SOLTURA', context);
  if (isIndependentRelease(context)) return programReleaseRows(context, [], [], template.itens, template.excecao);
  const scaleContext = releaseScaleContext(context);
  const record = await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: scaleContext } });
  if (!record) return null;
  const state = parseStoredDailyScale(record.conteudo, scaleContext);
  return state.fluxo?.status === 'FINALIZADA' ? programReleaseRows(context, state.programacao ?? fixedSchedule(scaleContext), state.itens, template.itens, template.excecao, template.recorrente, template.origemCarros === 'ESCALA') : null;
}

export async function updatedReleaseSheetRows(db: Pick<PrismaClient, 'escalaDiaria'>,
  context: TemplateContext & { dataOperacao: string }, sheet: ReturnType<typeof parseReleaseSheet>,
  records: Parameters<typeof refreshPendingScaleCars>[3]) {
  if (isIndependentRelease(context) || !sheet.escalaVinculadaIds?.length) return sheet.itens;
  const c = releaseScaleContext(context);
  const record = await db.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: c } });
  const scale = parseStoredDailyScale(record?.conteudo, c);
  if (scale.fluxo?.status !== 'FINALIZADA') return sheet.itens;
  const template = sheet.itens.map(row => ({ id: row.id, linha: row.linha, tabela: row.tabela,
    carroProgramado: row.carroProgramado, saidaGaragem: row.saidaGaragem }));
  const current = programReleaseRows(context, scale.programacao ?? fixedSchedule(c), scale.itens, template, false, false, true);
  return refreshPendingScaleCars(sheet.itens, current, sheet.escalaVinculadaIds, records);
}

export async function readReleaseProgramming(db: PrismaClient, value: unknown, userId: number | undefined,
  loadFleet: FleetLoader = officialFleet, loadColors: ColorLoader = loadColorCache) {
  const context = parseDailyContext(value), scaleContext = releaseScaleContext(context);
  const independent = isIndependentRelease(context);
  const escala = independent ? await readIndependentReleaseFleet(db, context, userId, loadFleet, loadColors) : await readEscalaDiaria(db, scaleContext, userId, loadFleet, loadColors);
  const escalaFinalizada = escala.fluxo.status === 'FINALIZADA';
  const sheet = db.folhaSoltura ? await db.folhaSoltura.findUnique({ where: releaseSheetWhere(context) }) : null;
  const records = await db.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
  const contextRecords = records.filter(record => record.escalaTipo === context.escalaTipo && record.turno === context.turno);
  const snapshot = sheet ? parseReleaseSheet(sheet.conteudo) : null;
  const frozen = snapshot ? sheet!.status === 'EM_ANDAMENTO'
    ? await updatedReleaseSheetRows(db, context, snapshot, contextRecords) : snapshot.itens : null;
  const template = frozen ? null : await resolveDateProgramming(db, 'SOLTURA', context);
  const itens = frozen ?? programReleaseRows(context, !independent && escalaFinalizada ? ('programacao' in escala ? escala.programacao : fixedSchedule(scaleContext)) : [], escala.itens, template!.itens, template!.excecao, template!.recorrente, template!.origemCarros === 'ESCALA');
  const portaria = await portariaMetadata(db, context, 'SOLTURA');
  return { contexto: context, escala: { ...escala, ...portaria }, escalaFinalizada, itens, programacao: frozen ?? template!.itens,
    disponibilidade: releaseFleetProjection(escala, itens, records, context) };
}
