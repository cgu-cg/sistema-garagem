import type { PrismaClient } from '@prisma/client';
import { operationalContext, MvpError } from './mvpTemporal';

type Model = { id: number; revisao: number; nome: string; conteudo: string; responsavelId: number; updatedAt: Date };
type Reader = Pick<PrismaClient, 'trafegoModeloVersao'>;

export function modelEffectiveDate(model: Pick<Model, 'updatedAt'>) {
  if (!(model.updatedAt instanceof Date) || !Number.isFinite(model.updatedAt.getTime()))
    throw new MvpError(409, 'Modelo sem data de atualização válida. Revisar sem reconstruir o histórico.');
  return operationalContext(model.updatedAt).today;
}

export async function effectiveTrafficModel(db: Reader, model: Model, date: string) {
  const version = await db.trafegoModeloVersao.findFirst({
    where: { modeloId: model.id, vigenteDesde: { lte: date } },
    orderBy: [{ vigenteDesde: 'desc' }, { revisao: 'desc' }],
  });
  if (version) return version;
  // Compatibilidade antes da primeira edição versionada. Nunca retroagir a última versão conhecida.
  return modelEffectiveDate(model) <= date ? model : null;
}

export async function preserveTrafficModel(db: Reader, model: Model) {
  const existing = await db.trafegoModeloVersao.findUnique({
    where: { modeloId_revisao: { modeloId: model.id, revisao: model.revisao } },
  });
  if (!existing) await db.trafegoModeloVersao.create({ data: {
    modeloId: model.id, revisao: model.revisao, nome: model.nome, conteudo: model.conteudo,
    responsavelId: model.responsavelId, vigenteDesde: modelEffectiveDate(model), createdAt: model.updatedAt,
  } });
}
