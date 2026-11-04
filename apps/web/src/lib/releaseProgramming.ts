import { z } from 'zod';
import { api } from './api';
import { validateDailyEscala, type DailyEscala } from './sharedEscala';
import { currentReleaseTemplate } from '../data/scheduleTemplates';
import type { SolturaItem } from '../data/solturaTypes';
import { trafficRowsSchema } from './trafficSchema';

export interface ReleaseProgramming {
  contexto: DailyEscala['contexto']; escala: DailyEscala; escalaFinalizada: boolean; itens: SolturaItem[];
  disponibilidade?: { reserva: string[]; reservaPorCor: NonNullable<DailyEscala['reservaPorCor']>; defeitosGaragem: GarageDefect[]; substituidos?: ReleaseWithdrawal[]; bloqueadosPortaria?: ReleaseWithdrawal[] };
}
export const releaseWithdrawalSchema = z.object({ registroId: z.number().int().nonnegative(), trocaId: z.string(),
  prefixo: z.string().regex(/^\d{1,10}$/), substituto: z.string(), destino: z.enum(['PENDENTE', 'BLOQUEAR']),
  motivo: z.string(), legado: z.boolean(), turno: z.string().nullable(), escalaTipo: z.string().nullable(),
  scheduleId: z.string().nullable(), base: z.string() }).strict();
export type ReleaseWithdrawal = z.infer<typeof releaseWithdrawalSchema>;
export const treatReleaseWithdrawal = (contexto: DailyEscala['contexto'], revisao: number, item: ReleaseWithdrawal,
  destino: 'RESERVA' | 'BLOQUEAR', motivo = '') => api.post('/solturas/tratar-carro', {
    contexto, revisao, registroId: item.registroId, trocaId: item.trocaId, base: item.base, destino, motivo,
  });
export interface GarageDefect { prefixo: string; descricao: string; registradoEm: string | null }
export interface ReleaseExchangeCommand { carroAnterior: string; motivo: 'Adicionado equivocadamente' | 'Defeito Garagem'; descricaoDefeito?: string }
// A fotografia operacional tem flags que não pertencem ao modelo de Tráfego.
// Retira somente a flag conhecida antes de validar o molde estrito.
const operationalProgrammingSchema = z.preprocess(value => Array.isArray(value) ? value.map(row => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const { suspensa: _suspended, ...template } = row;
  return template;
}) : value, trafficRowsSchema);
export async function loadReleaseProgramming(context: DailyEscala['contexto']): Promise<ReleaseProgramming> {
  const raw = z.object({ contexto: z.record(z.string()), escala: z.unknown(), escalaFinalizada: z.boolean(),
    programacao: operationalProgrammingSchema.optional(),
    disponibilidade: z.object({ reserva: z.array(z.string().regex(/^\d{1,10}$/)),
      substituidos: z.array(releaseWithdrawalSchema).optional(), bloqueadosPortaria: z.array(releaseWithdrawalSchema).optional(),
      defeitosGaragem: z.array(z.object({ prefixo: z.string().regex(/^\d{1,10}$/), descricao: z.string(), registradoEm: z.string().datetime().nullable() }).strict()),
      reservaPorCor: z.object({ updatedAt: z.string().datetime().nullable(), grupos: z.array(z.object({ id: z.enum(['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO']), titulo: z.string(), prefixos: z.array(z.string().regex(/^\d{1,10}$/)) }).strict()).length(6) }).strict(),
    }).strict().optional(),
    itens: z.array(z.object({ suspensa: z.boolean().optional(), id: z.string(), linha: z.string(), tabela: z.string(), carroProgramado: z.string().regex(/^\d{0,10}$/) }).passthrough()),
  }).strict().parse(await api.get('/solturas/programacao', { params: { ...context } }));
  if (Object.entries(context).some(([key, value]) => raw.contexto[key] !== value)) throw Error('Programacao de outra data ou garagem.');
  const independent = context.escalaTipo === 'SEG_SEX' && context.turno === 'VESPERTINO';
  const scaleContext = independent ? context : { ...context, turno: context.escalaTipo === 'SEG_SEX' ? 'MATUTINO' as const : 'PADRAO' as const };
  const escala = validateDailyEscala(raw.escala, scaleContext), template = raw.programacao ?? currentReleaseTemplate(context);
  if ((independent && (raw.itens.some(row => row.carroProgramado !== '') || escala.bloqueados.length > 0 || escala.ciAvisos?.length || escala.cards.length > 0)) || raw.escalaFinalizada !== (escala.fluxo?.status === 'FINALIZADA') || raw.itens.length !== template.length
    || (!raw.escalaFinalizada && !raw.programacao && raw.itens.some(row => row.carroProgramado !== ''))
    || new Set(raw.itens.map(row => row.id)).size !== template.length) throw Error('Programacao inconsistente com a escala.');
  const byId = new Map(raw.itens.map(item => [item.id, item]));
  const itens = template.map(row => {
    const received = byId.get(row.id);
    if (!received || received.linha !== row.linha || received.tabela !== row.tabela) throw Error('Molde de Soltura divergente.');
    return { ...row, suspensa: received.suspensa, carroProgramado: received.carroProgramado, status: 'PENDENTE' as const };
  });
  if (raw.disponibilidade) {
    const { reserva, defeitosGaragem, reservaPorCor, substituidos = [], bloqueadosPortaria = [] } = raw.disponibilidade;
    const grouped = reservaPorCor.grupos.flatMap(g => g.prefixos);
    if ([...substituidos, ...bloqueadosPortaria].some(r => reserva.includes(r.prefixo)) || new Set(reserva).size !== reserva.length || reserva.some(p => !escala.frota.includes(p) || escala.bloqueados.includes(p) || defeitosGaragem.some(d => d.prefixo === p))
      || new Set(defeitosGaragem.map(d => d.prefixo)).size !== defeitosGaragem.length || new Set(reservaPorCor.grupos.map(g => g.id)).size !== 6
      || new Set(grouped).size !== grouped.length || grouped.some(p => !reserva.includes(p))
      || (reservaPorCor.updatedAt ? grouped.length !== reserva.length : grouped.length > 0)) throw Error('Disponibilidade da Soltura inconsistente.');
  }
  return { contexto: context, escala, escalaFinalizada: raw.escalaFinalizada, itens, ...(raw.disponibilidade ? { disponibilidade: raw.disponibilidade } : {}) };
}
