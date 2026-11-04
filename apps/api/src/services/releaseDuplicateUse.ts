import { createHash } from 'node:crypto';
import { z } from 'zod';
import { MvpError } from './mvpTemporal';

export const duplicateUseCommandSchema = z.string().regex(/^[a-f0-9]{64}$/).optional();
export type ReleaseAssignment = { scheduleId: string; linha: string; tabela: string;
  carroRealizado: string | null; driverCode: string | null };

export class ReleaseDuplicateUseError extends MvpError {
  readonly code = 'CONFIRMAR_REPETICAO_NA_SOLTURA';
  constructor(public details: ReturnType<typeof duplicateUseNotice>) {
    super(409, 'Carro ou motorista ja utilizado em outra linha desta Soltura. Confirme para continuar.');
  }
}

export function duplicateUseNotice(context: object, assignments: ReleaseAssignment[], changed: string[]) {
  const normalize = (value: string | null) => (value ?? '').trim().toLowerCase();
  const conflitos = assignments.filter(row => changed.includes(row.scheduleId)).flatMap(row =>
    (['carroRealizado', 'driverCode'] as const).flatMap(field => {
      const value = normalize(row[field]);
      const outras = assignments.filter(other => other.scheduleId !== row.scheduleId && value && normalize(other[field]) === value)
        .map(other => ({ scheduleId: other.scheduleId, linha: other.linha, tabela: other.tabela }))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));
      return outras.length ? [{ tipo: field === 'carroRealizado' ? 'CARRO' : 'MOTO', valor: row[field]!,
        scheduleId: row.scheduleId, linha: row.linha, tabela: row.tabela, outras }] : [];
    })).sort((a, b) => `${a.scheduleId}:${a.tipo}`.localeCompare(`${b.scheduleId}:${b.tipo}`));
  const token = createHash('sha256').update(JSON.stringify({ context, conflitos })).digest('hex');
  return { token, conflitos };
}
