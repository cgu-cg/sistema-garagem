import { z } from 'zod';
import { MvpError } from './mvpTemporal';
import { canEditScaleDate } from './dailyScaleWindow';

export const scaleCiSourceSchema = z.object({
  ciData: z.string(), bloqueados: z.array(z.string()),
  ciAvisos: z.array(z.object({ prefixo: z.string(), categoria: z.enum(['PREVENTIVA', 'OFICINA', 'REFORCO']),
    subTipo: z.string().nullable(), horario: z.string().nullable(), tipoPosicao: z.string().nullable(), ordemPosicao: z.number().nullable() })),
}).strict();
export const scaleLifecycleSchema = z.object({
  status: z.enum(['EM_PREPARACAO', 'FINALIZADA']), iniciadaEm: z.string().datetime(),
  finalizadaEm: z.string().datetime().nullable(), fonteCI: scaleCiSourceSchema,
}).strict();
export type ScaleLifecycle = z.infer<typeof scaleLifecycleSchema>;
export type ScaleOperation = 'iniciar' | 'finalizar' | 'reabrir';

export function assertScaleDate(date: string, operation: ScaleOperation | 'editar', now: Date) {
  if (operation !== 'finalizar' && !canEditScaleDate(date, now))
    throw new MvpError(409, 'Escala permite alterações até as 06h do dia da operação (America/Campo_Grande). Depois, somente consulta e finalização pendente.');
}

export function assertScaleOperation(operation: ScaleOperation | 'editar', lifecycle: ScaleLifecycle | null,
  exists: boolean, ciFinalized: boolean, nextStarted: boolean) {
  if (!ciFinalized) throw new MvpError(409, 'Finalize a CI da mesma data antes de iniciar ou alterar esta escala.');
  if (operation === 'iniciar') {
    if (exists) throw new MvpError(409, 'Escala ja iniciada ou registro anterior existente; recarregue sem descartar seus dados.');
    return;
  }
  if (!lifecycle) throw new MvpError(409, 'Inicie a escala antes de alterar. Registros anteriores permanecem somente para consulta.');
  if (operation === 'reabrir') {
    if (lifecycle.status !== 'FINALIZADA') throw new MvpError(409, 'Somente escala finalizada pode ser reaberta.');
    if (nextStarted) throw new MvpError(409, 'A proxima escala ja foi iniciada; esta escala nao pode ser reaberta.');
  } else if (lifecycle.status !== 'EM_PREPARACAO') throw new MvpError(409, 'Reabra a escala finalizada antes de alterar.');
}
