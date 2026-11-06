import type { PrismaClient } from '@prisma/client';
import { MvpError } from './mvpTemporal';

export function canWriteC4(user: { role: string; garagem?: string | null } | null | undefined, scope: string) {
  return user?.role === 'ADMIN' || (user?.role === 'manutencao' && ['VCG', 'VCM'].includes(scope) && user.garagem === scope);
}
export async function assertC4Read(db: Pick<PrismaClient, 'user'>, userId: number | undefined, scope: string) {
  const user = userId ? await db.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
  if (!user || (user.role !== 'ADMIN' && user.garagem !== scope)) throw new MvpError(403, 'Consulta C4 exige vinculo com a garagem solicitada.');
}
