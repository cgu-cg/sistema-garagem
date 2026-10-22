import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { canWriteC4 } from './c4Authorization';
import { addDays, assertC4Context, civil, dateValue, enabledGarages } from './c4Temporal';
import { bundle, lockManualCI, MANUAL_MAINTENANCE_PENDING } from './c4Flow';
import { MvpError } from './mvpTemporal';
import { notifyC4Updated } from './c4Events';

const command = z.object({ garagem: z.enum(['VCG', 'VCM']), data: z.string(),
  operacao: z.enum(['iniciar', 'finalizar', 'reabrir']), baseC4: z.string().min(1) }).strict();

// Mesmos locks ordenados dos escritores: iniciar N e reabrir N-1 nao podem vencer juntos.
export async function changeCILifecycle(db: PrismaClient, userId: number | undefined, value: unknown,
  now = () => new Date(), garages = enabledGarages()) {
  const c = command.parse(value), day = addDays(c.data, -1);
  if (!garages.includes(c.garagem)) throw new MvpError(409, 'Fluxo manual nao habilitado nesta garagem.');
  const assertLifecycleContext = () => {
    // Finalizar uma folha pendente nao autoriza editar seu conteudo ou reabri-la.
    if (c.operacao === 'finalizar') civil(c.data);
    else assertC4Context(c.data, 'ci', now());
  };
  assertLifecycleContext();
  await db.$transaction(async tx => {
    await lockManualCI(tx, c.garagem, c.data);
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
    if (!canWriteC4(user, c.garagem)) throw new MvpError(403, 'Sem permissao para alterar a CI desta garagem.');
    assertLifecycleContext();
    const b = await bundle(tx, c.garagem, day, now());
    if (b.baseC4 !== c.baseC4) throw new MvpError(409, 'CI alterada em outro posto. Atualize antes de continuar.');
    const where = (date: string) => ({ garagem_dataFolha: { garagem: c.garagem, dataFolha: dateValue(date) } });
    if (c.operacao === 'iniciar') {
      if (b.folha) throw new MvpError(409, 'Esta CI ja foi iniciada. Atualize a consulta.');
      const source = await tx.folhaCI.findUnique({ where: where(day), include: { itens: { orderBy: { id: 'asc' } } } });
      if (source?.status !== 'FINALIZADA') throw new MvpError(409, 'Finalize a CI do dia anterior antes de iniciar esta CI.');
      const instant = now();
      const cycle = b.cycle ?? await tx.cicloOperacional.create({ data: {
        garagem: c.garagem, dataOperacional: dateValue(day), origem: 'NORMAL',
        inicializacaoPrevistaEm: instant, inicializadoEm: instant, referenciaOrigem: MANUAL_MAINTENANCE_PENDING,
      } });
      const folha = await tx.folhaCI.create({ data: { garagem: c.garagem, dataFolha: dateValue(c.data),
        status: 'EM_PREPARACAO', origem: 'NORMAL', cicloPreparacaoId: cycle.id, folhaOrigemId: source.id,
        tituloColunaAdicional: source.tituloColunaAdicional, inicializacaoPrevistaEm: instant,
        // Campo legado obrigatorio pelo CHECK; nao representa mais prazo automatico.
        inicializadaEm: instant, finalizacaoPrevistaEm: instant, responsavelRegistroId: userId,
      } });
      for (const item of source.itens) {
        const { id: _id, folhaId: _folha, createdAt: _created, updatedAt: _updated, ...copy } = item;
        await tx.itemFolhaCI.create({ data: { ...copy, folhaId: folha.id, responsavelRegistroId: userId } });
      }
    } else {
      if (!b.folha || !b.cycle || b.folha.cicloPreparacaoId !== b.cycle.id) throw new MvpError(409, 'CI ainda nao iniciada.');
      if (c.operacao === 'reabrir') {
        if (b.folha.status !== 'FINALIZADA') throw new MvpError(409, 'Somente uma CI finalizada pode ser reaberta.');
        const next = await tx.folhaCI.findUnique({ where: where(addDays(c.data, 1)) });
        if (next) throw new MvpError(409, 'A proxima CI ja foi iniciada; esta CI nao pode mais ser reaberta.');
      } else if (b.folha.status !== 'EM_PREPARACAO') throw new MvpError(409, 'CI nao esta em preparacao.');
      await tx.folhaCI.update({ where: { id: b.folha.id }, data: {
        status: c.operacao === 'finalizar' ? 'FINALIZADA' : 'EM_PREPARACAO',
        finalizadaEm: c.operacao === 'finalizar' ? now() : null, responsavelRegistroId: userId,
      } });
    }
    assertLifecycleContext();
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(c.garagem, day);
  return { operacao: c.operacao, garagem: c.garagem, data: c.data };
}
