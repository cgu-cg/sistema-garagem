import { z } from 'zod';
import { MvpError } from './mvpTemporal';

export const ciUseSchema = z.object({ linhaId: z.string().min(1).max(100), prefixo: z.string().regex(/^\d{1,10}$/),
  ciData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), usuarioId: z.number().int().positive(), registradoEm: z.string().datetime() }).strict();
export type CiUse = z.infer<typeof ciUseSchema>;
export const ciUseCommandSchema = z.string().regex(/^\d{1,10}$/).optional();

export function authorizeCiUse(args: { linhaId: string; prefixo: string; ciData: string; bloqueados: string[];
  confirmar?: string; anterior?: CiUse; usuarioId: number; agora: Date }): CiUse | undefined {
  if (args.confirmar && args.confirmar !== args.prefixo) throw new MvpError(409, 'Confirmacao da CI pertence a outro carro. Confirme novamente.');
  if (!args.bloqueados.includes(args.prefixo)) return undefined;
  if (args.confirmar === args.prefixo) return ciUseSchema.parse({ linhaId: args.linhaId, prefixo: args.prefixo,
    ciData: args.ciData, usuarioId: args.usuarioId, registradoEm: args.agora.toISOString() });
  const previous = args.anterior;
  if (previous?.linhaId === args.linhaId && previous.prefixo === args.prefixo && previous.ciData === args.ciData) return previous;
  throw Object.assign(new MvpError(409, `Carro ${args.prefixo} bloqueado na CI de manutencao. Confirme explicitamente que deseja usa-lo.`), { code: 'VEICULO_BLOQUEADO_NA_CI' });
}
