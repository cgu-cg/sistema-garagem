import type { Prisma, CiPortariaEvento } from '@prisma/client';
import { randomUUID } from 'node:crypto';

type DB = Pick<Prisma.TransactionClient, 'ciPortariaEvento'>;
export async function portariaEvents(db: DB, where: Prisma.CiPortariaEventoWhereInput): Promise<CiPortariaEvento[]> {
  // Bancos simulados antigos nao possuem a nova entidade. Prisma real sempre possui.
  if (!db.ciPortariaEvento) return [];
  return db.ciPortariaEvento.findMany({ where, orderBy: { id: 'asc' } });
}
export function ciPortariaFlags(events: CiPortariaEvento[], folhaId: number, chaveItem: string) {
  const own = events.filter(e => e.folhaId === folhaId && e.itemChave === chaveItem);
  return { bloqueadoPortaria: own.some(e => e.tipo === 'BLOQUEIO_CI'), usadoPortaria: own.some(e => e.tipo === 'USO_CI') };
}
export async function registerCiUse(db: DB, context: { garagem: string; dataOperacao: string; escalaTipo: string; turno: string },
  item: { folhaId?: number; chaveItem?: string; prefixo: string }, usuarioId: number, descricao: string, now: Date) {
  if (!db.ciPortariaEvento) return;
  if (!item.folhaId || !item.chaveItem) throw Error('Item CI sem identificacao para auditar uso da Portaria.');
  await db.ciPortariaEvento.create({ data: { ...context, prefixo: item.prefixo, tipo: 'USO_CI', modulo: 'SOLTURA',
    operacaoId: randomUUID(), folhaId: item.folhaId, itemChave: item.chaveItem, usuarioId, descricao, createdAt: now } });
}
export async function portariaMetadata(db: DB & Partial<Pick<Prisma.TransactionClient, 'itemFolhaCI'>>, context: { garagem: string; dataOperacao: string; escalaTipo: string; turno: string }, modulo: string) {
  const events = await portariaEvents(db, { garagem: context.garagem, dataOperacao: context.dataOperacao });
  const activeItems = events.length && db.itemFolhaCI ? await db.itemFolhaCI.findMany({ where: {
    folhaId: { in: [...new Set(events.flatMap(e => e.folhaId ? [e.folhaId] : []))] }, categoria: 'BLOQUEADO', statusItem: { not: 'LIBERADO' },
  } }) : [];
  const bound = events.filter(e => activeItems.some(i => i.folhaId === e.folhaId && i.chaveItem === e.itemChave));
  return {
    justificativas: events.filter(e => e.tipo === 'JUSTIFICATIVA' && e.modulo === modulo && e.escalaTipo === context.escalaTipo && e.turno === context.turno)
      .map(e => ({ prefixo: e.prefixo, descricao: e.descricao ?? '', registradoEm: e.createdAt.toISOString() })),
    ciPortaria: [...new Set(bound.map(e => e.prefixo))].map(prefixo => ({ prefixo,
      bloqueadoPortaria: bound.some(e => e.prefixo === prefixo && e.tipo === 'BLOQUEIO_CI'),
      usadoPortaria: bound.some(e => e.prefixo === prefixo && e.tipo === 'USO_CI') })),
  };
}
