import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { MvpError } from './mvpTemporal';
import { occupations, type AllocationCard, type FixedLine, type Substitution } from './escalaAllocation';

export const scaleWithdrawalSchema = z.object({
  prefixo: z.string().regex(/^\d{1,10}$/),
  destino: z.enum(['RESERVA', 'BLOQUEAR']),
  motivo: z.string().trim().min(1).max(1000),
}).strict();
export const scaleExchangeSchema = scaleWithdrawalSchema.extend({
  id: z.string().uuid(), linhaId: z.string().min(1).max(100),
  substituto: z.string().regex(/^\d{1,10}$/),
  usuarioId: z.number().int().positive(), registradoEm: z.string().datetime(),
}).strict();

// Executado na mesma transacao da troca da linha. Nao altera CI ou manutencao.
export function registerScaleWithdrawal(args: {
  anterior: string; substituto: string; linhaId: string;
  retirada?: z.infer<typeof scaleWithdrawalSchema>;
  cards: AllocationCard[]; fixed: FixedLine[]; itens: Substitution[];
  frota: string[]; bloqueadosCI: string[]; usuarioId: number; agora: Date;
}) {
  const { anterior, substituto, retirada, cards, fixed, itens, frota, bloqueadosCI } = args;
  if (anterior === substituto || !/^\d{1,10}$/.test(anterior)) return null;
  if (!retirada) throw new MvpError(400, 'Informe o destino e o motivo do carro retirado.');
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
