import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { MvpError } from './mvpTemporal';
import { assertC4Read } from './c4Authorization';

export const escalaContextSchema = z.object({
  garagem: z.enum(['VCG', 'VCM']),
  escalaTipo: z.enum(['SEG_SEX', 'SABADO', 'DOM_FER']),
  turno: z.enum(['MATUTINO', 'VESPERTINO', 'PADRAO']),
}).strict().refine(c => c.escalaTipo === 'SEG_SEX' ? c.turno !== 'PADRAO' : c.turno === 'PADRAO', 'Turno incompativel com a escala.');
// Programacao recorrente, igual ao contexto da interface; nao representa soltura.
export const escalaItemSchema = z.object({
  id: z.string().min(1).max(100), ordem: z.number().int().nonnegative().optional(),
  linha: z.string().trim().min(1).max(100), tabela: z.string().trim().min(1).max(100),
  // Programacao existente inclui marcadores como 4220R; nao e prefixo de soltura.
  carroProgramado: z.string().trim().max(100),
  motoristaCodigo: z.string().max(100).optional(), motoristaNome: z.string().max(200).optional(),
  saidaGaragem: z.string().max(20), chegadaGaragem: z.string().max(20).optional(),
  inicioLinha: z.string().max(20).optional(), inicioBairro: z.string().max(20).optional(),
  status: z.literal('PENDENTE'), tipo: z.enum(['REGULAR', 'VCM', 'FRETAMENTO', 'EXTRA']).optional(),
  observacoes: z.string().max(1000).optional(),
}).strict();
export const escalaCommandSchema = z.object({
  contexto: escalaContextSchema, revisao: z.number().int().nonnegative().max(2147483646),
  itens: z.array(escalaItemSchema).max(2000),
}).strict().superRefine((c, ctx) => {
  for (const key of ['id'] as const) {
    const values = c.itens.map(i => i[key]).filter(Boolean);
    if (new Set(values).size !== values.length) ctx.addIssue({ code: 'custom', message: `${key} duplicado.` });
  }
});
function selector(contexto: z.infer<typeof escalaContextSchema>) {
  return { garagem_escalaTipo_turno: contexto };
}
export async function readEscala(db: PrismaClient, value: unknown, userId: number | undefined) {
  const contexto = escalaContextSchema.parse(value);
  await assertC4Read(db, userId, contexto.garagem);
  return db.$transaction(async tx => {
    const record = await tx.escalaCarros.findUnique({ where: selector(contexto), include: { itens: { orderBy: { ordem: 'asc' } } } });
    return { contexto, revisao: record?.revisao ?? 0, publicada: Boolean(record),
      itens: record ? record.itens.map(i => escalaItemSchema.parse(JSON.parse(i.conteudo))) : [] };
  }, { isolationLevel: 'Serializable' });
}
export async function saveEscala(db: PrismaClient, userId: number | undefined, value: unknown) {
  const c = escalaCommandSchema.parse(value);
  return db.$transaction(async tx => {
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true } }) : null;
    if (user?.role !== 'ADMIN') throw new MvpError(403, 'Publicacao da escala requer ADMIN.');
    const { garagem, escalaTipo, turno } = c.contexto;
    // Range lock na chave UNIQUE protege inclusive duas primeiras publicacoes.
    await tx.$queryRaw`SELECT id FROM dbo.escala_carros WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${garagem} AND escala_tipo=${escalaTipo} AND turno=${turno}`;
    const old = await tx.escalaCarros.findUnique({ where: selector(c.contexto) });
    if ((old?.revisao ?? 0) !== c.revisao) throw new MvpError(409, 'Escala alterada em outro posto. Recarregue e revise antes de salvar.');
    const header = old
      ? await tx.escalaCarros.update({ where: { id: old.id }, data: { revisao: c.revisao + 1, responsavelId: userId } })
      : await tx.escalaCarros.create({ data: { ...c.contexto, revisao: 1, responsavelId: userId! } });
    if (old) await tx.itemEscalaCarros.deleteMany({ where: { escalaId: old.id } });
    for (const [ordem, item] of c.itens.entries()) await tx.itemEscalaCarros.create({ data: {
      escalaId: header.id, chaveItem: item.id, ordem, conteudo: JSON.stringify(item),
    } });
    return { contexto: c.contexto, revisao: header.revisao, publicada: true, itens: c.itens };
  }, { isolationLevel: 'Serializable' });
}
