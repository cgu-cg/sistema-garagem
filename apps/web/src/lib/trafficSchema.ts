import { z } from 'zod';

export const trafficDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Data inválida.');
const time = z.string().max(20).refine(value => value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) || value === 'VCM', 'Horário inválido.');
export const trafficRowSchema = z.object({
  id: z.string().min(1).max(100), ordem: z.number().int().nonnegative().optional(), ordemTerminal: z.number().int().nonnegative().optional(),
  linha: z.string().trim().min(1).max(100), tabela: z.string().trim().max(100),
  carroProgramado: z.string().trim().max(100), saidaGaragem: time, chegadaGaragem: time.optional(),
  inicioLinha: time.optional(), inicioBairro: time.optional(), status: z.literal('PENDENTE').optional(),
  tipo: z.enum(['REGULAR', 'VCM', 'FRETAMENTO', 'EXTRA']).optional(), observacoes: z.string().max(1000).optional(),
}).strict().refine(row => Boolean(row.tabela) || row.tipo === 'FRETAMENTO', 'Tabela obrigatória, exceto fretamento.');
export const trafficRowsSchema = z.array(trafficRowSchema).min(1).max(2000)
  .refine(rows => new Set(rows.map(row => row.id)).size === rows.length, 'Identificadores de viagens duplicados.');
export const trafficContextSchema = z.object({
  garagem: z.enum(['VCG', 'VCM']), escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
  turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']), dataOperacao: trafficDate,
}).strict().refine(c => c.escalaTipo === 'SEG_SEX' ? c.turno !== 'PADRAO' : c.turno === 'PADRAO', 'Turno incompatível.');
const commandFields = {
  origemCarros: z.literal('ESCALA').optional(),
  tipo: z.enum(['ESCALA', 'SOLTURA']), nome: z.string().trim().min(1).max(150),
  revisao: z.number().int().nonnegative().max(2147483646), itens: trafficRowsSchema,
};
const compatible = (c: { tipo: string; contexto: { turno: string }; itens: TrafficRow[] }) => c.tipo !== 'ESCALA' || c.contexto.turno !== 'VESPERTINO';
const numericCars = (c: { tipo: string; itens: TrafficRow[] }) => c.tipo !== 'SOLTURA' || c.itens.every(row => /^\d{0,10}$/.test(row.carroProgramado));
const independent = (c: { tipo: string; contexto: { turno: string }; itens: TrafficRow[] }) => c.tipo !== 'SOLTURA' || c.contexto.turno !== 'VESPERTINO' || c.itens.every(row => row.carroProgramado === '');
const scaleLink = (c: { tipo: string; contexto: { turno: string }; origemCarros?: string }) => !c.origemCarros || c.tipo === 'SOLTURA' && c.contexto.turno !== 'VESPERTINO';
export const trafficContentSchema = z.object({ version: z.literal(1), itens: trafficRowsSchema,
  origemCarros: z.literal('ESCALA').optional() }).strict();
export const trafficModelContextSchema = z.object({
  garagem: z.enum(['VCG', 'VCM']), escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
  turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']),
}).strict().refine(c => c.escalaTipo === 'SEG_SEX' ? c.turno !== 'PADRAO' : c.turno === 'PADRAO', 'Turno incompatível.');
export const trafficModelCommandSchema = z.object({
  ...commandFields, funcionamento: z.literal('RECORRENTE'), contexto: trafficModelContextSchema,
}).strict().refine(scaleLink, 'Vínculo de carros exige Soltura matutina ou padrão.').refine(compatible, 'Escala não possui turno vespertino.')
  .refine(numericCars, 'Use apenas o número do carro programado na soltura.')
  .refine(independent, 'Soltura vespertina possui apenas carro realizado.');
export const trafficCommandSchema = z.object({
  ...commandFields, origem: trafficContextSchema.optional(),
  contexto: trafficContextSchema,
}).strict().refine(scaleLink, 'Vínculo de carros exige Soltura matutina ou padrão.').refine(compatible, 'Escala não possui turno vespertino.')
  .refine(numericCars, 'Use apenas o número do carro programado na soltura.')
  .refine(independent, 'Soltura vespertina possui apenas carro realizado.');
export type TrafficRow = z.infer<typeof trafficRowSchema>;
export type TrafficCommand = z.infer<typeof trafficCommandSchema>;
export type TrafficModelCommand = z.infer<typeof trafficModelCommandSchema>;
