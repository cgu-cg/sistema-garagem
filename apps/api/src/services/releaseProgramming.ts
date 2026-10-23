import type { PrismaClient } from '@prisma/client';
import { currentReleaseTemplate, type TemplateContext } from '../data/scheduleTemplates';
import { fixedSchedule, parseDailyContext, parseStoredDailyScale, readEscalaDiaria } from './escalaDiaria';

export const releaseScaleContext = (context: TemplateContext & { dataOperacao: string }) => ({ ...context,
  turno: context.escalaTipo === 'SEG_SEX' ? 'MATUTINO' as const : 'PADRAO' as const });
const code = (value: string) => value.trim().replace(/[_-]/g, '/').replace(/\s/g, '')
  .split('/').map(part => /^\d+$/.test(part) ? String(Number(part)) : part).join('/');
const key = (row: { linha: string; tabela: string }) => JSON.stringify([code(row.linha), code(row.tabela)]);

export function programReleaseRows(context: TemplateContext, scale: { linha: string; tabela: string; carroProgramado: string; id: string }[],
  substitutions: { id: string; carroSubstituido: string }[]) {
  const cars = new Map(substitutions.map(row => [row.id, row.carroSubstituido]));
  return currentReleaseTemplate(context).map(row => {
    const matches = scale.filter(candidate => key(candidate) === key(row));
    const carroProgramado = matches.length === 1 ? cars.get(matches[0].id) ?? matches[0].carroProgramado : '';
    return { ...row, carroProgramado, status: 'PENDENTE' as const };
  });
}

export async function finalizedReleaseRows(tx: Pick<PrismaClient, 'escalaDiaria'>, context: TemplateContext & { dataOperacao: string }) {
  const scaleContext = releaseScaleContext(context);
  const record = await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: scaleContext } });
  if (!record) return null;
  const state = parseStoredDailyScale(record.conteudo, scaleContext);
  return state.fluxo?.status === 'FINALIZADA' ? programReleaseRows(context, fixedSchedule(scaleContext), state.itens) : null;
}

export async function readReleaseProgramming(db: PrismaClient, value: unknown, userId: number | undefined) {
  const context = parseDailyContext(value), scaleContext = releaseScaleContext(context);
  const escala = await readEscalaDiaria(db, scaleContext, userId);
  const escalaFinalizada = escala.fluxo.status === 'FINALIZADA';
  return { contexto: context, escala, escalaFinalizada,
    itens: programReleaseRows(context, escalaFinalizada ? fixedSchedule(scaleContext) : [], escala.itens) };
}
