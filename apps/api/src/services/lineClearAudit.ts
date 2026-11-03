import { createHash } from 'node:crypto';
import { z } from 'zod';

export const lineClearAuditSchema = z.object({ id: z.string().uuid(), linhaId: z.string().min(1).max(100),
  usuarioId: z.number().int().positive(), registradoEm: z.string().datetime(), anterior: z.string() }).strict();

export function releaseLineToken(record: { id: number; scheduleId: string | null; carroRealizado: string | null;
  carroProgramado: string | null; driverCode: string | null; driverName: string | null; horaLiberacao: string | null;
  historicoTrocas: string | null; status: string | null }) {
  return createHash('sha256').update(JSON.stringify([record.id, record.scheduleId, record.carroRealizado,
    record.carroProgramado, record.driverCode, record.driverName, record.horaLiberacao, record.historicoTrocas, record.status])).digest('hex');
}
