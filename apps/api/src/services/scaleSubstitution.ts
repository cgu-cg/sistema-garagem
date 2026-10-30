import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { MvpError } from './mvpTemporal';
import { occupations, type AllocationCard, type FixedLine, type Substitution } from './escalaAllocation';

const scaleWithdrawalFields = z.object({
  prefixo: z.string().regex(/^\d{1,10}$/),
  destino: z.enum(['RESERVA', 'BLOQUEAR']),
  motivo: z.string().trim().max(1000).default(''),
}).strict();
export const scaleWithdrawalSchema = scaleWithdrawalFields.refine(value => value.destino === 'RESERVA' || Boolean(value.motivo), 'Informe a observacao ou defeito para bloquear.');
export const scaleExchangeSchema = scaleWithdrawalFields.extend({
  destino: z.enum(['PENDENTE', 'RESERVA', 'BLOQUEAR']), motivo: z.string().trim().max(1000),
  tratadoPor: z.number().int().positive().optional(), tratadoEm: z.string().datetime().optional(),
  id: z.string().uuid(), linhaId: z.string().min(1).max(100),
  substituto: z.string().regex(/^\d{1,10}$/),
  usuarioId: z.number().int().positive(), registradoEm: z.string().datetime(),
}).strict().refine(value => value.destino === 'PENDENTE'
  ? value.motivo === '' && !value.tratadoPor && !value.tratadoEm
  : value.destino === 'RESERVA' || Boolean(value.motivo), 'Historico de substituicao inconsistente.');

// Executado na mesma transacao da troca da linha. Nao altera CI ou manutencao.
export function registerScaleWithdrawal(args: {
  anterior: string; substituto: string; linhaId: string;
  retirada?: z.infer<typeof scaleWithdrawalSchema>;
  cards: AllocationCard[]; fixed: FixedLine[]; itens: Substitution[];
  frota: string[]; bloqueadosCI: string[]; usuarioId: number; agora: Date;
}) {
  const { anterior, substituto, retirada, cards, fixed, itens, frota, bloqueadosCI } = args;
  if (anterior === substituto || !/^\d{1,10}$/.test(anterior)) return null;
  if (!retirada) {
    if (!frota.includes(anterior)) throw new MvpError(409, 'Carro retirado fora da frota oficial.');
    if (occupations(fixed, itens, cards).some(o => o.prefixo === anterior && !o.chave.startsWith('card:PORTARIA:')))
      throw new MvpError(409, 'Carro retirado ainda esta alocado.');
    let pending = cards.find(c => c.id === 'SUBSTITUIDOS');
    if (!pending) { pending = { id: 'SUBSTITUIDOS', titulo: 'SUBSTITUIDOS', modo: 'lista', itens: [] }; cards.push(pending); }
    const id = randomUUID(); pending.itens.push({ id, prefixo: anterior });
    return scaleExchangeSchema.parse({ id, prefixo: anterior, substituto, linhaId: args.linhaId,
      destino: 'PENDENTE', motivo: '', usuarioId: args.usuarioId, registradoEm: args.agora.toISOString() });
  }
  if (retirada.prefixo !== anterior) throw new MvpError(409, 'O carro da linha mudou. Recarregue e revise a substituicao.');
  if (!frota.includes(anterior)) throw new MvpError(409, 'Carro retirado fora da frota oficial desta garagem.');
  const portaria = cards.find(c => c.id === 'PORTARIA');
  if (retirada.destino === 'RESERVA' && (bloqueadosCI.includes(anterior) || portaria?.itens.some(i => i.prefixo === anterior)))
    throw new MvpError(409, 'Carro retirado esta bloqueado. Nao pode ser colocado na reserva.');
  const used = occupations(fixed, itens, cards).find(o => o.prefixo === anterior && !(retirada.destino === 'BLOQUEAR' && o.chave.startsWith('card:PORTARIA:')));
  if (used) throw new MvpError(409, `Carro ${anterior} ainda utilizado em ${used.local}. Revise antes de destinar o carro.`);
  if (retirada.destino === 'BLOQUEAR') {
    if (!portaria) throw new MvpError(409, 'Card de Bloqueados Portaria indisponivel.');
    if (!portaria.itens.some(i => i.prefixo === anterior)) portaria.itens.push({ id: randomUUID(), prefixo: anterior });
  }
  return scaleExchangeSchema.parse({ ...retirada, id: randomUUID(), linhaId: args.linhaId,
    substituto, usuarioId: args.usuarioId, registradoEm: args.agora.toISOString() });
}

export function treatScaleWithdrawal(args: {
  trocaId: string; retirada: z.infer<typeof scaleWithdrawalSchema>;
  historico: z.infer<typeof scaleExchangeSchema>[]; cards: AllocationCard[];
  fixed: FixedLine[]; itens: Substitution[]; frota: string[]; bloqueadosCI: string[];
  usuarioId: number; agora: Date;
}) {
  const troca = args.historico.find(t => t.id === args.trocaId);
  const pending = args.cards.find(c => c.id === 'SUBSTITUIDOS');
  if (!troca || troca.destino !== 'PENDENTE' || troca.prefixo !== args.retirada.prefixo
    || !pending?.itens.some(i => i.id === troca.id && i.prefixo === troca.prefixo))
    throw new MvpError(409, 'Substituicao ja tratada ou alterada. Recarregue.');
  const cards = structuredClone(args.cards);
  cards.find(c => c.id === 'SUBSTITUIDOS')!.itens = pending.itens.filter(i => i.id !== troca.id);
  registerScaleWithdrawal({ ...args, cards, anterior: troca.prefixo, substituto: troca.substituto, linhaId: troca.linhaId });
  args.cards.splice(0, args.cards.length, ...cards);
  Object.assign(troca, args.retirada, { tratadoPor: args.usuarioId, tratadoEm: args.agora.toISOString() });
}
