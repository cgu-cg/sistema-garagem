import { isColorReserveCard } from './scaleReserveColors';
import { z } from 'zod';
import defaults from '../data/escalaCards.json';
import { MvpError } from './mvpTemporal';
import { recognizedFleetGarage } from './fleetContract';

export const allocationItemSchema = z.object({ id: z.string().min(1).max(100), prefixo: z.string().regex(/^(\d{1,10})?$/),
  linha: z.string().max(100).optional(), tabela: z.string().max(100).optional(), horario: z.string().max(20).optional() }).strict();
export const allocationCardSchema = z.object({ id: z.string().min(1).max(100), titulo: z.string().min(1).max(100),
  modo: z.enum(['lista', 'unico', 'rabicho']), itens: z.array(allocationItemSchema).max(2000) }).strict();
export const allocationCardsSchema = z.array(allocationCardSchema).max(50).superRefine((cards, ctx) => {
  if (new Set(cards.map(c => c.id)).size !== cards.length || cards.some(c => new Set(c.itens.map(i => i.id)).size !== c.itens.length))
    ctx.addIssue({ code: 'custom', message: 'Posicoes duplicadas nos cards.' });
  if (cards.some(c => c.modo === 'unico' && c.itens.length !== 1))
    ctx.addIssue({ code: 'custom', message: 'Card de posicao unica invalido.' });
});
export type AllocationCard = z.infer<typeof allocationCardSchema>;
export type FixedLine = { id: string; linha: string; tabela: string; carroProgramado: string };
export type Substitution = { id: string; carroSubstituido: string };
export type Occupation = { prefixo: string; local: string; chave: string };
export function officialGarageFleet(response: { source: string; data: unknown }, garage: 'VCG' | 'VCM') {
  if (response.source !== 'real' || !Array.isArray(response.data)) throw new MvpError(503, 'Frota oficial indisponivel. Alocacoes bloqueadas.');
  const prefixes = new Set<string>();
  let missing = 0;
  for (const row of response.data) {
    if (!row || typeof row !== 'object') throw new MvpError(503, 'Resposta da frota invalida.');
    const p = String(row.prefixo ?? row.idCarro ?? '').trim(), id = String(row.idCarro ?? '').trim();
    if (!/^\d{1,10}$/.test(p) || !/^\d{1,10}$/.test(id) || Number(p) !== Number(id)) throw new MvpError(503, 'Registro da frota incompleto.');
    if (row.garagem == null || String(row.garagem).trim() === '') { missing++; continue; }
    const scope = recognizedFleetGarage(row.garagem);
    if (!scope || (row.garagemNome && row.garagemNome !== scope)) throw new MvpError(503, 'Garagem da frota desconhecida ou inconsistente.');
    if (scope === garage) {
      if (prefixes.has(p)) throw new MvpError(503, 'Prefixo duplicado na frota.');
      prefixes.add(p);
    }
  }
  if (missing) console.warn('[Escala frota] Registros sem garagem omitidos:', missing);
  return [...prefixes].sort((a, b) => Number(a) - Number(b));
}
export function occupations(lines: FixedLine[], substitutions: Substitution[], cards: AllocationCard[]): Occupation[] {
  const replacements = new Map(substitutions.map(s => [s.id, s.carroSubstituido]));
  const result: Occupation[] = lines.map(l => ({ prefixo: replacements.get(l.id) ?? l.carroProgramado,
    local: `Linha ${l.linha} / Tab ${l.tabela}`, chave: `linha:${l.id}` })).filter(o => /^\d{1,10}$/.test(o.prefixo));
  for (const card of cards.filter(c => !isColorReserveCard(c.id) && c.id !== 'SUBSTITUIDOS')) for (const item of card.itens) if (item.prefixo)
    result.push({ prefixo: item.prefixo, local: card.titulo, chave: `card:${card.id}:${item.id}` });
  return result;
}
export function validateAllocation(prefixo: string, ownKey: string, frota: string[], blocked: string[], used: Occupation[]) {
  if (blocked.includes(prefixo)) throw new MvpError(409, `Carro ${prefixo} esta bloqueado.`);
  if (!frota.includes(prefixo)) throw new MvpError(409, `Carro ${prefixo} nao existe na frota oficial desta garagem.`);
  const duplicate = used.find(o => o.prefixo === prefixo && o.chave !== ownKey);
  if (duplicate) throw new MvpError(409, `Carro ${prefixo} ja utilizado em ${duplicate.local}.`);
}
export function defaultAllocations(garage: 'VCG' | 'VCM', frota: string[], blocked: string[], lines: FixedLine[], substitutions: Substitution[]) {
  const cards = structuredClone(defaults[garage]);
  const occupied = new Set(occupations(lines, substitutions, []).map(o => o.prefixo));
  let omitted = 0;
  for (const c of cards) {
    if (isColorReserveCard(c.id)) { c.itens = []; continue; }
    for (const item of c.itens) if (item.prefixo) {
      if (!/^\d{1,10}$/.test(item.prefixo) || !frota.includes(item.prefixo) || blocked.includes(item.prefixo) || occupied.has(item.prefixo)) { item.prefixo = ''; omitted++; }
      else occupied.add(item.prefixo);
    }
    if (c.modo === 'lista') c.itens = c.itens.filter(i => i.prefixo);
  }
  return { cards: allocationCardsSchema.parse(cards), omitted };
}
export function allocationProjection(lines: FixedLine[], substitutions: Substitution[], cards: AllocationCard[], frota: string[], ciBlocked: string[]) {
  const used = occupations(lines, substitutions, cards);
  const portaria = cards.find(c => c.id === 'PORTARIA')?.itens.map(i => i.prefixo).filter(Boolean) ?? [];
  const blocked = [...new Set([...ciBlocked, ...portaria])];
  const occupied = new Set(used.map(o => o.prefixo));
  return { ocupacoes: used, reserva: frota.filter(p => !occupied.has(p) && !blocked.includes(p)), bloqueados: ciBlocked, frota };
}
