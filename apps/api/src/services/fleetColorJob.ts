import path from 'node:path';
import { createColorUpdater, readColorCache, scheduledColorMonth } from './fleetColors';
import { queryFleetColors } from './sigsitFleetColors';

export const colorCachePath = () => process.env.FLEET_COLORS_CACHE_PATH || path.resolve(__dirname, '../../uploads/.fleet-colors/cache.json');

export function safeColorJobReason(error: unknown): string {
  const allowed = ['SIGSIT_CONFIG_INVALIDA', 'SIGSIT_CERTIFICADO', 'SIGSIT_LOGIN', 'SIGSIT_TIMEOUT', 'SIGSIT_REDE_PORTA',
    'SIGSIT_SEM_PERMISSAO_SELECT', 'SIGSIT_TABELA_INEXISTENTE', 'SIGSIT_BANCO_INACESSIVEL', 'SIGSIT_CONSULTA_FALHOU', 'CACHE_CORES_INVALIDO'];
  if (error instanceof Error && allowed.includes(error.message)) return error.message;
  if (error instanceof Error && error.name === 'ZodError') return 'FROTA_VAZIA_INVALIDA_OU_DUPLICADA';
  const code = (error as NodeJS.ErrnoException | null)?.code;
  if (['EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'ENOENT'].includes(code || '')) return 'CACHE_ERRO_DE_ARQUIVO';
  return 'ATUALIZACAO_FALHOU';
}

export function startFleetColorJob() {
  if (process.env.FLEET_COLORS_JOB_ENABLED?.trim().toLowerCase() !== 'true') {
    console.info('[FleetColors] Job desativado.'); return () => undefined;
  }
  console.info('[FleetColors] Job ativo: primeiro domingo, 15h America/Campo_Grande.');
  const file = colorCachePath();
  const refresh = createColorUpdater(file, queryFleetColors);
  let busy = false, stopped = false, retryAt = 0;
  const run = async () => {
    if (busy || stopped || Date.now() < retryAt) return;
    const month = scheduledColorMonth(new Date());
    if (!month) return;
    busy = true;
    try {
      const previous = await readColorCache(file);
      if (previous?.scheduledMonth === month) return;
      const result = await refresh(month);
      console.info('[FleetColors] Cache atualizado.', { month, total: result.vehicles.length });
    } catch (error) {
      retryAt = Date.now() + 15 * 60_000;
      console.warn('[FleetColors] Atualizacao falhou; cache anterior preservado. Nova tentativa em 15 minutos.', { reason: safeColorJobReason(error) });
    } finally { busy = false; }
  };
  void run();
  const timer = setInterval(() => void run(), 60_000);
  timer.unref();
  return () => { stopped = true; clearInterval(timer); };
}

// Carga inicial/atualizacao manual explicita. Nunca chamada durante imports ou builds.
if (require.main === module) {
  if (!process.argv.includes('--refresh')) {
    console.error('Informe --refresh para atualizar o cache de cores.'); process.exitCode = 1;
  } else {
    void createColorUpdater(colorCachePath(), queryFleetColors)()
      .then(cache => console.info('[FleetColors] Cache atualizado.', { total: cache.vehicles.length }))
      .catch(error => { console.error('[FleetColors] Falha na atualizacao; cache anterior preservado.', { reason: safeColorJobReason(error) }); process.exitCode = 1; });
  }
}
