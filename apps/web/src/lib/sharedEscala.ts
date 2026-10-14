import { SolturaItem } from '@/data/solturaData';
import { api } from './api';
import { z } from 'zod';
import fixedScale from '../data/escalaFixa.json';
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
export interface DailyEscala { contexto: EscalaContext & { dataOperacao: string }; revisao: number;
  confirmadas: string[];
  itens: { id: string; carroSubstituido: string }[]; cards: ScaleCard[]; frota: string[]; bloqueados: string[]; reserva: string[];
  ocupacoes: { prefixo: string; local: string; chave: string }[]; ciData: string; cardsOrigem: 'padrao' | 'salvo'; omitidosPadrao: number }
const prefixSchema = z.string().regex(/^\d{1,10}$/);
const dailyResponseSchema = z.object({
  contexto: z.object({ garagem: z.enum(['VCG', 'VCM']), escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']), dataOperacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(),
  revisao: z.number().int().nonnegative(),
  confirmadas: z.array(z.string().min(1)).max(2000).default([]),
  itens: z.array(z.object({ id: z.string().min(1), carroSubstituido: z.string().regex(/^\d{1,10}$/) }).strict()).max(2000),
  cards: z.array(z.object({ id: z.string(), titulo: z.string(), modo: z.enum(['lista', 'unico', 'rabicho']), itens: z.array(z.object({ id: z.string(),
    prefixo: z.string().regex(/^(\d{1,10})?$/), linha: z.string().optional(), tabela: z.string().optional(), horario: z.string().optional() }).strict()) }).strict()),
  frota: z.array(prefixSchema), bloqueados: z.array(prefixSchema), reserva: z.array(prefixSchema),
  ocupacoes: z.array(z.object({ prefixo: prefixSchema, local: z.string(), chave: z.string() }).strict()),
  ciData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), cardsOrigem: z.enum(['padrao', 'salvo']), omitidosPadrao: z.number().int().nonnegative(),
}).strict();
export function validateDailyEscala(value: unknown, contexto: DailyEscala['contexto']): DailyEscala {
  const parsed = dailyResponseSchema.parse(value);
  const key = `${contexto.garagem}_${contexto.escalaTipo}_${contexto.turno}` as keyof typeof fixedScale;
  const ids = new Set(fixedScale[key]?.map(i => i.id));
  const nextDate = new Date(`${contexto.dataOperacao}T12:00:00Z`); nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  if (Object.entries(contexto).some(([key, v]) => parsed.contexto[key as keyof typeof contexto] !== v)
      || parsed.ciData !== nextDate.toISOString().slice(0, 10)
      || new Set(parsed.itens.map(i => i.id)).size !== parsed.itens.length || parsed.itens.some(i => !ids.has(i.id))
      || new Set(parsed.confirmadas).size !== parsed.confirmadas.length || parsed.confirmadas.some(id => !ids.has(id))
      || [...parsed.reserva, ...parsed.bloqueados].some(p => !parsed.frota.includes(p)))
    throw new Error('Resposta de substituicoes inconsistente com o contexto solicitado.');
  return parsed;
}
export const loadDailyEscala = async (contexto: DailyEscala['contexto']) => validateDailyEscala(
  await api.get<DailyEscala>('/escala-carros/diaria', { params: { ...contexto } }), contexto);
export const saveDailyEscala = async (contexto: DailyEscala['contexto'], revisao: number, id: string, carroSubstituido: string, base: string) =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, id, carroSubstituido, base }), contexto);
export const saveDailyScaleCard = async (contexto: DailyEscala['contexto'], revisao: number, mutation: CardMutation) =>
  validateDailyEscala(await api.post<DailyEscala>('/escala-carros/diaria', { contexto, revisao, ...mutation }), contexto);
