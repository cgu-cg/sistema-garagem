import { trafficRowsSchema, type TrafficRow } from './trafficSchema';
import { SolturaItem } from '@/data/solturaTypes';
import { api } from './api';
import { z } from 'zod';
import { currentScaleTemplate, retiredScaleRows } from '../data/scheduleTemplates';
export interface EscalaContext { garagem: 'VCG' | 'VCM'; escalaTipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; turno: 'MATUTINO' | 'VESPERTINO' | 'PADRAO' }
export interface SharedEscala { contexto: EscalaContext; revisao: number; publicada: boolean; itens: SolturaItem[] }
export function scaleItems(items: SolturaItem[]) {
  // Somente programacao: nunca publicar despachos junto da escala.
  return items.map(i => ({ id: i.id, ordem: i.ordem, ordemTerminal: i.ordemTerminal, variante: i.variante, linha: i.linha, tabela: i.tabela,
    carroProgramado: i.carroProgramado, motoristaCodigo: i.motoristaCodigo, motoristaNome: i.motoristaNome,
    saidaGaragem: i.saidaGaragem, chegadaGaragem: i.chegadaGaragem, inicioLinha: i.inicioLinha,
    inicioBairro: i.inicioBairro, status: 'PENDENTE' as const, tipo: i.tipo, observacoes: i.observacoes }));
}
export const loadSharedEscala = (contexto: EscalaContext) => api.get<SharedEscala>('/escala-carros', { params: { ...contexto } });
export const saveSharedEscala = (contexto: EscalaContext, revisao: number, itens: SolturaItem[]) =>
  api.post<SharedEscala>('/escala-carros', { contexto, revisao, itens: scaleItems(itens) });
export interface ScaleCardItem { id: string; prefixo: string; linha?: string; tabela?: string; horario?: string }
export interface ScaleCard { id: string; titulo: string; modo: 'lista' | 'unico' | 'rabicho'; itens: ScaleCardItem[] }
export interface CardMutation { card: string; operacao: 'adicionar' | 'remover' | 'definir'; prefixo: string; itemId?: string; linha?: string; tabela?: string }
export interface ScaleWithdrawal { prefixo: string; destino: 'RESERVA' | 'BLOQUEAR'; motivo: string }
export interface ScaleExchange extends Omit<ScaleWithdrawal, 'destino'> { destino: 'PENDENTE' | 'RESERVA' | 'BLOQUEAR'; tratadoPor?: number; tratadoEm?: string; id: string; linhaId: string; substituto: string; usuarioId: number; registradoEm: string }
export interface DailyEscala { programacao?: TrafficRow[]; contexto: EscalaContext & { dataOperacao: string }; revisao: number;
  // Anotacao de apresentacao da Soltura; nao altera a fotografia da Escala.
  defeitosGaragem?: { prefixo: string; descricao: string }[];
  historicoTrocas?: ScaleExchange[];
  ciProvisoria?: boolean;
  fluxo?: { status: 'NAO_INICIADA' | 'EM_PREPARACAO' | 'FINALIZADA' | 'LEGADO'; ciFinalizada: boolean;
    proximaIniciada: boolean; iniciadaEm: string | null; finalizadaEm: string | null };
  coresFrota?: Record<string, string>;
  foraMolde?: { id: string; linha: string; tabela: string; saidaGaragem: string; carroSubstituido: string }[];
  reservaPorCor?: { updatedAt: string | null; grupos: { id: string; titulo: string; prefixos: string[] }[] };
  ciAvisos?: { prefixo: string; categoria: 'PREVENTIVA' | 'OFICINA' | 'REFORCO'; subTipo: string | null; horario: string | null; tipoPosicao: string | null; ordemPosicao: number | null }[];
  confirmadas: string[];
  itens: { id: string; carroSubstituido: string; suspensa?: boolean }[]; cards: ScaleCard[]; frota: string[]; bloqueados: string[]; reserva: string[];
  ocupacoes: { prefixo: string; local: string; chave: string }[]; ciData: string; cardsOrigem: 'padrao' | 'salvo'; omitidosPadrao: number }
// Historico e preservado apos limpar; somente posicoes atuais podem ser tratadas.
export function pendingScaleWithdrawals(state: DailyEscala | null): ScaleExchange[] {
  const positions = state?.cards.find(card => card.id === 'SUBSTITUIDOS')?.itens ?? [];
  return state?.historicoTrocas?.filter(t => t.destino === 'PENDENTE' &&
    positions.some(item => item.id === t.id && item.prefixo === t.prefixo)) ?? [];
}

const prefixSchema = z.string().regex(/^\d{1,10}$/);
const dailyResponseSchema = z.object({
  programacao: trafficRowsSchema.optional(),
  historicoTrocas: z.array(z.object({ id: z.string().uuid(), linhaId: z.string().min(1).max(100),
    prefixo: prefixSchema, substituto: prefixSchema, destino: z.enum(['PENDENTE', 'RESERVA', 'BLOQUEAR']), tratadoPor: z.number().int().positive().optional(), tratadoEm: z.string().datetime().optional(),
    motivo: z.string().trim().max(1000), usuarioId: z.number().int().positive(), registradoEm: z.string().datetime() }).strict()
    .refine(value => value.destino === 'PENDENTE' ? value.motivo === '' && !value.tratadoPor && !value.tratadoEm : value.destino === 'RESERVA' || Boolean(value.motivo))).optional(),
  ciProvisoria: z.boolean().optional(),
  fluxo: z.object({ status: z.enum(['NAO_INICIADA', 'EM_PREPARACAO', 'FINALIZADA', 'LEGADO']), ciFinalizada: z.boolean(),
    proximaIniciada: z.boolean(), iniciadaEm: z.string().datetime().nullable(), finalizadaEm: z.string().datetime().nullable() }).strict().optional(),
  coresFrota: z.record(prefixSchema, z.enum(['OUTRO', 'AZUL', 'PRATA', 'VERMELHO', 'VERMELHO/AZUL', 'EXECUTIVO', 'NAO IDENTIFICADO'])).optional(),
  contexto: z.object({ garagem: z.enum(['VCG', 'VCM']), escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']), dataOperacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(),
  revisao: z.number().int().nonnegative(),
  foraMolde: z.array(z.object({ id: z.string(), linha: z.string(), tabela: z.string(), saidaGaragem: z.string(), carroSubstituido: prefixSchema }).strict()).optional(),
  reservaPorCor: z.object({ updatedAt: z.string().datetime().nullable(), grupos: z.array(z.object({
    id: z.enum(['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO']), titulo: z.string(), prefixos: z.array(prefixSchema),
  }).strict()).length(6) }).strict().optional(),
  ciAvisos: z.array(z.object({ prefixo: prefixSchema, categoria: z.enum(['PREVENTIVA', 'OFICINA', 'REFORCO']), subTipo: z.string().nullable(),
    horario: z.string().nullable(), tipoPosicao: z.string().nullable(), ordemPosicao: z.number().int().positive().nullable() }).strict()).optional(),
  confirmadas: z.array(z.string().min(1)).max(2000).default([]),
  itens: z.array(z.object({ id: z.string().min(1), carroSubstituido: z.string().regex(/^(\d{1,10})?$/), suspensa: z.boolean().optional() }).strict()).max(2000),
  cards: z.array(z.object({ id: z.string(), titulo: z.string(), modo: z.enum(['lista', 'unico', 'rabicho']), itens: z.array(z.object({ id: z.string(),
    prefixo: z.string().regex(/^(\d{1,10})?$/), linha: z.string().optional(), tabela: z.string().optional(), horario: z.string().optional() }).strict()) }).strict()),
  frota: z.array(prefixSchema), bloqueados: z.array(prefixSchema), reserva: z.array(prefixSchema),
  ocupacoes: z.array(z.object({ prefixo: prefixSchema, local: z.string(), chave: z.string() }).strict()),
  ciData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), cardsOrigem: z.enum(['padrao', 'salvo']), omitidosPadrao: z.number().int().nonnegative(),
}).strict();
export function validateDailyEscala(value: unknown, contexto: DailyEscala['contexto']): DailyEscala {
  const parsed = dailyResponseSchema.parse(value);
  const ids = new Set([...(parsed.programacao ?? currentScaleTemplate(contexto)), ...retiredScaleRows(contexto)].map(i => i.id));
  if (parsed.foraMolde?.some(item => {
    const old = retiredScaleRows(contexto).find(row => row.id === item.id);
    return !old || old.linha !== item.linha || old.tabela !== item.tabela || old.saidaGaragem !== item.saidaGaragem
      || !parsed.itens.some(row => row.id === item.id && row.carroSubstituido === item.carroSubstituido);
  })) throw new Error('Registros anteriores inconsistentes com o contexto solicitado.');
  const nextDate = new Date(`${contexto.dataOperacao}T12:00:00Z`); nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  if (Object.entries(contexto).some(([key, v]) => parsed.contexto[key as keyof typeof contexto] !== v)
      || (parsed.ciProvisoria
        ? !parsed.fluxo || parsed.fluxo.status === 'LEGADO' || parsed.fluxo.status === 'FINALIZADA' || parsed.fluxo.ciFinalizada || parsed.ciData >= contexto.dataOperacao || Boolean(parsed.ciAvisos?.length)
        : parsed.ciData !== (parsed.fluxo && parsed.fluxo.status !== 'LEGADO' ? contexto.dataOperacao : nextDate.toISOString().slice(0, 10)))
      || new Set(parsed.itens.map(i => i.id)).size !== parsed.itens.length || parsed.itens.some(i => !ids.has(i.id))
      || new Set(parsed.confirmadas).size !== parsed.confirmadas.length || parsed.confirmadas.some(id => !ids.has(id))
      || [...parsed.reserva, ...parsed.bloqueados].some(p => !parsed.frota.includes(p)))
    throw new Error('Resposta de substituicoes inconsistente com o contexto solicitado.');
  if (parsed.ciAvisos?.some(i => !parsed.frota.includes(i.prefixo))) throw new Error('Aviso da CI fora da frota solicitada.');
  if (parsed.reservaPorCor) {
    const grouped = parsed.reservaPorCor.grupos.flatMap(g => g.prefixos);
    if (new Set(parsed.reservaPorCor.grupos.map(g => g.id)).size !== 6 || new Set(grouped).size !== grouped.length
      || grouped.some(p => !parsed.reserva.includes(p))
      || (parsed.reservaPorCor.updatedAt !== null && grouped.length !== parsed.reserva.length)
      || (parsed.reservaPorCor.updatedAt === null && grouped.length > 0))
      throw new Error('Reserva por cor inconsistente.');
  }
  return parsed;
}
export const loadDailyEscala = async (contexto: DailyEscala['contexto']) => validateDailyEscala(
  await api.get<DailyEscala>('/escala-carros/diaria', { params: { ...contexto } }), contexto);
export const saveDailyEscala = async (contexto: DailyEscala['contexto'], revisao: number, id: string, carroSubstituido: string, base: string, retirada?: ScaleWithdrawal) =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, id, carroSubstituido, base, retirada }), contexto);
export const saveDailyScaleCard = async (contexto: DailyEscala['contexto'], revisao: number, mutation: CardMutation) =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, ...mutation }), contexto);
export const changeDailyScaleState = async (contexto: DailyEscala['contexto'], revisao: number, operacao: 'iniciar' | 'finalizar' | 'reabrir') =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, operacao }), contexto);

export const treatDailySubstitution = async (contexto: DailyEscala['contexto'], revisao: number, trocaId: string, retirada: ScaleWithdrawal) =>
  validateDailyEscala(await api.post('/escala-carros/diaria', { contexto, revisao, operacao: 'tratar-substituido', trocaId, retirada }), contexto);

export const clearDailyScaleLine = async (contexto: DailyEscala['contexto'], revisao: number, id: string, base: string, operacao: 'limpar-linha' | 'suspender-linha' | 'reativar-linha' | 'devolver-fixo' = 'limpar-linha') =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, id, base, operacao }), contexto);
