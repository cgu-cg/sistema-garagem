import { History } from 'lucide-react';
import type { CIRegularizationAudit } from '@/lib/c4';

function instant(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Campo_Grande',
    dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function CIRegularizationNotice({ folha }: { folha: CIRegularizationAudit & { status: string } }) {
  if (!folha.regularizacaoIniciadaEm) return null;
  return <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
    <History className="h-5 w-5 shrink-0" aria-hidden="true" />
    <div className="space-y-1 text-xs">
      <p className="text-sm font-semibold">{folha.status === 'FINALIZADA' ? 'CI regularizada' : 'CI em regularização — confira os dados referentes a esta data.'}</p>
      <p>Iniciada por {folha.regularizacaoIniciadaPor?.name ?? `usuário ${folha.regularizacaoIniciadaPorId}`} em {instant(folha.regularizacaoIniciadaEm)}.</p>
      {folha.finalizadaEm && <p>Finalizada por {folha.finalizadaPor?.name ?? `usuário ${folha.finalizadaPorId}`} em {instant(folha.finalizadaEm)}.</p>}
      {folha.status !== 'FINALIZADA' && <p>Somente administradores podem revisar e finalizar. A regularização não altera a manutenção atual.</p>}
    </div>
  </div>;
}
