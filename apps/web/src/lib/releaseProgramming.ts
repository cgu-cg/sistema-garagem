import { z } from 'zod';
import { api } from './api';
import { validateDailyEscala, type DailyEscala } from './sharedEscala';
import { currentReleaseTemplate } from '../data/scheduleTemplates';
import type { SolturaItem } from '../data/solturaTypes';

export interface ReleaseProgramming {
  contexto: DailyEscala['contexto']; escala: DailyEscala; escalaFinalizada: boolean; itens: SolturaItem[];
}
export async function loadReleaseProgramming(context: DailyEscala['contexto']): Promise<ReleaseProgramming> {
  const raw = z.object({ contexto: z.record(z.string()), escala: z.unknown(), escalaFinalizada: z.boolean(),
    itens: z.array(z.object({ id: z.string(), linha: z.string(), tabela: z.string(), carroProgramado: z.string().regex(/^\d{0,10}$/) }).passthrough()),
  }).strict().parse(await api.get('/solturas/programacao', { params: { ...context } }));
  if (Object.entries(context).some(([key, value]) => raw.contexto[key] !== value)) throw Error('Programacao de outra data ou garagem.');
  const scaleContext = { ...context, turno: context.escalaTipo === 'SEG_SEX' ? 'MATUTINO' as const : 'PADRAO' as const };
  const escala = validateDailyEscala(raw.escala, scaleContext), template = currentReleaseTemplate(context);
  if (raw.escalaFinalizada !== (escala.fluxo?.status === 'FINALIZADA') || raw.itens.length !== template.length
    || (!raw.escalaFinalizada && raw.itens.some(row => row.carroProgramado !== ''))
    || new Set(raw.itens.map(row => row.id)).size !== template.length) throw Error('Programacao inconsistente com a escala.');
  const itens = template.map(row => {
    const received = raw.itens.find(item => item.id === row.id);
    if (!received || received.linha !== row.linha || received.tabela !== row.tabela) throw Error('Molde de Soltura divergente.');
    return { ...row, carroProgramado: received.carroProgramado, status: 'PENDENTE' as const };
  });
  return { contexto: context, escala, escalaFinalizada: raw.escalaFinalizada, itens };
}
