import { MvpError } from './mvpTemporal';
import { assertC4Context, operationalContext } from './c4Temporal';

type Sheet = { status: string; regularizacaoIniciadaEm?: Date | null };

// Excecao explicita para regularizacao. Nao amplia a janela da manutencao
// nem permite reabrir fotografias finalizadas.
export function assertCIContentContext(date: string, user: { role: string } | null,
  folha: Sheet | null, now: Date) {
  if (folha?.regularizacaoIniciadaEm && user?.role !== 'ADMIN') throw new MvpError(403, 'Regularizacao exige administrador.');
  if (date <= operationalContext(now).today && user?.role === 'ADMIN' &&
      folha?.status === 'EM_PREPARACAO' && folha.regularizacaoIniciadaEm) return;
  assertC4Context(date, 'ci', now);
}
