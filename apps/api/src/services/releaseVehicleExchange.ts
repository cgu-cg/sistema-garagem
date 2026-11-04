import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { MvpError } from './mvpTemporal';

export const releaseExchangeCommandSchema = z.object({
  carroAnterior: z.string().regex(/^\d{1,10}$/),
  motivo: z.enum(['Adicionado equivocadamente', 'Defeito Garagem']),
  descricaoDefeito: z.string().trim().max(1000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.motivo === 'Defeito Garagem' && !value.descricaoDefeito)
    ctx.addIssue({ code: 'custom', path: ['descricaoDefeito'], message: 'Descreva o defeito na garagem.' });
});

export function releaseHistory(value: unknown): Record<string, unknown>[] {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value ?? [];
  if (!Array.isArray(parsed) || parsed.some(i => !i || typeof i !== 'object' || Array.isArray(i)))
    throw new MvpError(409, 'Historico de trocas invalido. Recarregue antes de salvar.');
  return parsed;
}

export function garageDefects(records: { historicoTrocas?: unknown }[]) {
  const defects = new Map<string, { prefixo: string; descricao: string; registradoEm: string | null }>();
  for (const record of records) for (const event of releaseHistory(record.historicoTrocas)) {
    if (event.destino && event.destino !== 'BLOQUEAR') continue;
    if (event.motivo !== 'Defeito Garagem' && event.destino !== 'BLOQUEAR') continue;
    if (typeof event.carroAnterior !== 'string' || !/^\d{1,10}$/.test(event.carroAnterior))
      throw new MvpError(409, 'Historico de defeito sem prefixo valido.');
    const next = { prefixo: event.carroAnterior, descricao: typeof event.descricaoDefeito === 'string' ? event.descricaoDefeito : 'Defeito registrado anteriormente sem descricao.',
      registradoEm: typeof event.registradoEm === 'string' ? event.registradoEm : null };
    const old = defects.get(next.prefixo);
    if (!old || (next.registradoEm ?? '') >= (old.registradoEm ?? '')) defects.set(next.prefixo, next);
  }
  return [...defects.values()].sort((a, b) => Number(a.prefixo) - Number(b.prefixo));
}

export function appendReleaseExchange(history: unknown, anterior: string | null | undefined, novo: string,
  command: z.infer<typeof releaseExchangeCommandSchema> | undefined, userId: number, now: Date) {
  const previous = releaseHistory(history);
  if (!anterior || anterior === novo) {
    if (command) throw new MvpError(409, 'A troca exige um despacho existente e um carro diferente.');
    return previous;
  }
  if (!command) {
    const stamp = now.toISOString();
    return [...previous, { id: randomUUID(), carroAnterior: anterior, novoCarro: novo,
      motivo: 'Aguardando tratativa', origem: 'SOLTURA', destino: 'PENDENTE',
      usuarioId: userId, registradoEm: stamp, dataHora: stamp }];
  }
  if (command.carroAnterior !== anterior) throw new MvpError(409, 'O carro realizado mudou em outro posto. Recarregue antes de trocar.');
  const stamp = now.toISOString();
  return [...previous, { id: randomUUID(), carroAnterior: anterior, novoCarro: novo, motivo: command.motivo,
    ...(command.motivo === 'Defeito Garagem' ? { descricaoDefeito: command.descricaoDefeito } : {}),
    usuarioId: userId, registradoEm: stamp, dataHora: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Campo_Grande', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(now) }];
}
