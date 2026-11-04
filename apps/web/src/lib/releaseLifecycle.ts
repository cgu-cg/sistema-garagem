import { z } from 'zod';
import { api } from './api';
import { ciUseSchema, type DailyEscala } from './sharedEscala';
import type { ReleaseReport } from './releaseReport';

export const lifecycleSchema = z.object({ contexto: z.object({ garagem: z.enum(['VCG', 'VCM']), escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
  turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']), dataOperacao: z.string() }), status: z.enum(['NAO_INICIADA', 'EM_ANDAMENTO', 'FINALIZADA']),
  revisao: z.number().int().nonnegative(), eventos: z.array(z.object({ operacao: z.enum(['iniciar', 'finalizar', 'reabrir']), usuarioId: z.number().int().positive(), registradoEm: z.string().datetime() })),
  usosBloqueadosCI: z.array(ciUseSchema).optional(),
  itens: z.array(z.object({ suspensa: z.boolean().optional(), id: z.string(), linha: z.string(), tabela: z.string(), carroProgramado: z.string(), saidaGaragem: z.string() }).passthrough()).nullable() });
export type ReleaseLifecycle = z.infer<typeof lifecycleSchema>;
function validate(value: unknown, context: DailyEscala['contexto']) {
  const parsed = lifecycleSchema.parse(value);
  if (Object.entries(context).some(([key, v]) => parsed.contexto[key as keyof typeof context] !== v)) throw Error('Estado da Soltura pertence a outro contexto.');
  return parsed;
}
export const loadReleaseLifecycle = async (context: DailyEscala['contexto']) => validate(await api.get('/solturas/estado', { params: { ...context } }), context);
export const changeReleaseLifecycle = async (context: DailyEscala['contexto'], revisao: number, operacao: 'iniciar' | 'finalizar' | 'reabrir') =>
  validate(await api.post('/solturas/estado', { contexto: context, revisao, operacao }), context);
export const loadReleaseReport = async (context: DailyEscala['contexto']): Promise<ReleaseReport> => {
  const value = await api.get<ReleaseReport>('/solturas/relatorio', { params: { ...context } });
  if (!value || Object.entries(context).some(([key, v]) => value.contexto?.[key as keyof typeof context] !== v)
    || !Array.isArray(value.itens) || !Array.isArray(value.reserva) || !Array.isArray(value.bloqueados)
    || !Array.isArray(value.defeitosGaragem) || !Array.isArray(value.reservasTerminais)) throw Error('Relatorio da Soltura invalido.');
  return value;
};
