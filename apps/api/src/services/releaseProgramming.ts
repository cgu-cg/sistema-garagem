import { resolveDateProgramming } from './trafficProgramming';
import { isIndependentRelease, readIndependentReleaseFleet } from './independentRelease';
import type { PrismaClient } from '@prisma/client';
import { currentReleaseTemplate, type TemplateContext, type TemplateRow } from '../data/scheduleTemplates';
import { fixedSchedule, parseDailyContext, parseStoredDailyScale, readEscalaDiaria } from './escalaDiaria';
import { releaseFleetProjection } from './releaseFleetProjection';

export const releaseScaleContext = (context: TemplateContext & { dataOperacao: string }) => ({ ...context,
  turno: context.escalaTipo === 'SEG_SEX' ? 'MATUTINO' as const : 'PADRAO' as const });
const code = (value: string) => value.trim().replace(/[_-]/g, '/').replace(/\s/g, '')
  .split('/').map(part => /^\d+$/.test(part) ? String(Number(part)) : part).join('/');
const key = (row: { linha: string; tabela: string }) => JSON.stringify([code(row.linha), code(row.tabela)]);

export function programReleaseRows(context: TemplateContext, scale: { linha: string; tabela: string; carroProgramado: string; id: string }[],
  substitutions: { id: string; carroSubstituido: string }[], template: TemplateRow[] = currentReleaseTemplate(context), explicitProgramming = false) {
  const cars = new Map(substitutions.map(row => [row.id, row.carroSubstituido]));
  const byLineTable = new Map<string, typeof scale>();
  for (const row of scale) {
    const rowKey = key(row), matches = byLineTable.get(rowKey);
    if (matches) matches.push(row); else byLineTable.set(rowKey, [row]);
  }
  return template.map(row => {
    const matches = byLineTable.get(key(row)) ?? [];
    const carroProgramado = isIndependentRelease(context) ? '' : explicitProgramming ? row.carroProgramado
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
  return state.fluxo?.status === 'FINALIZADA' ? programReleaseRows(context, state.programacao ?? fixedSchedule(scaleContext), state.itens, template.itens, template.excecao) : null;
}

export async function readReleaseProgramming(db: PrismaClient, value: unknown, userId: number | undefined) {
  const context = parseDailyContext(value), scaleContext = releaseScaleContext(context);
  const independent = isIndependentRelease(context);
  const escala = independent ? await readIndependentReleaseFleet(db, context, userId) : await readEscalaDiaria(db, scaleContext, userId);
  const escalaFinalizada = escala.fluxo.status === 'FINALIZADA';
  const template = await resolveDateProgramming(db, 'SOLTURA', context);
  const itens = programReleaseRows(context, !independent && escalaFinalizada ? ('programacao' in escala ? escala.programacao : fixedSchedule(scaleContext)) : [], escala.itens, template.itens, template.excecao);
  const records = await db.soltura.findMany({ where: { garagem: context.garagem, dataOperacao: context.dataOperacao } });
  return { contexto: context, escala, escalaFinalizada, itens, programacao: template.itens,
    disponibilidade: releaseFleetProjection(escala, itens, records, context) };
}
