import type { PrismaClient } from '@prisma/client';
import { enabledGarages, nextEvent, eventInstant, C4_CLOSE_HOUR, operationalContext } from './c4Temporal';
import { MvpError } from './mvpTemporal';
import { startCycle, finalizeCycle } from './c4Flow';

export async function recoverCurrentDay(db: PrismaClient, now = () => new Date(), log: (value: object) => void = value => console.info('[C4]', value), trigger = 'BOOTSTRAP') {
  let failed = false;
  for (const garagem of enabledGarages()) {
    const day = operationalContext(now()).today;
    log({ event: 'START', garagem, day, recovery: trigger !== 'SCHEDULED', trigger });
    try {
      log(await startCycle(db, garagem, now));
      if (now() >= eventInstant(day, C4_CLOSE_HOUR)) log(await finalizeCycle(db, garagem, now));
    } catch (error) {
      failed = true;
      log({ event: 'ERROR', garagem, day, name: error instanceof Error ? error.name : 'UnknownError', reason: error instanceof MvpError ? error.message : 'Falha tecnica/estrutura invalida; verificar preflight e disponibilidade.' });
    }
  }
  if (failed) throw new Error('C4_JOB_FAILED');
}
// Timeout de evento civil + recuperacao no bootstrap. Retries nao repetem dias passados.
// Idempotencia persistida/locks permitem mais de um processo sem duplicar ciclos.
export function startC4Scheduler(db: PrismaClient) {
  if (!enabledGarages().length) return () => undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let trigger = 'BOOTSTRAP';
  const run = async () => {
    let failed = false;
    try { await recoverCurrentDay(db, undefined, undefined, trigger); }
    catch (error) {
      failed = true;
      // Nao registrar SQL/connection string nem o objeto Prisma de erro.
      console.error('[C4] Evento falhou; retry em 60s', { day: operationalContext().today, message: error instanceof Error ? error.name : 'UnknownError' });
    }
    if (!stopped) {
      trigger = failed ? 'RETRY' : 'SCHEDULED';
      const delay = failed ? 60000 : Math.max(100, nextEvent().getTime() - Date.now());
      timer = setTimeout(run, delay); timer.unref();
    }
  };
  void run();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}
