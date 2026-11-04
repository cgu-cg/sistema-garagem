import type { ReleaseLifecycle } from '@/lib/releaseLifecycle';
import { Button } from '@/components/ui/button';

export function ReleaseLifecycleBar({ state, error, pending, allowed, admin, today, ready, remaining, dirty, onChange, onReload, withdrawalsPending = 0, historicalEditable = false, editingHistorical = false, onEditHistorical }: {
  state: ReleaseLifecycle | null; error: string; pending: boolean; allowed: boolean; admin: boolean; today: boolean;
  ready: boolean; remaining: number; dirty: boolean; onChange: (value: 'iniciar' | 'finalizar' | 'reabrir') => void; onReload: () => void;
  withdrawalsPending?: number; historicalEditable?: boolean; editingHistorical?: boolean; onEditHistorical?: () => void;
}) {
  const labels = { NAO_INICIADA: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada' };
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-xs print:hidden">
    <div><p className="font-semibold">Soltura: {state ? labels[state.status] : error ? 'Indisponível' : 'Consultando estado oficial...'}</p>
      {error && <p role="alert" className="mt-1 text-rose-600">{error}</p>}
      {state?.status === 'EM_ANDAMENTO' && <p className="mt-1 text-muted-foreground">{remaining} viagem(ns) pendente(s). Finalização exige todas liberadas ou suspensas.</p>}
      {state?.status === 'EM_ANDAMENTO' && withdrawalsPending > 0 && <p className="mt-1 text-amber-700">{withdrawalsPending} carro(s) em Substituidos aguardando tratativa antes de finalizar.</p>}
      {dirty && <p className="mt-1 text-amber-700">Confirme os rascunhos antes de finalizar.</p>}
      {!today && <p className="mt-1 text-muted-foreground">{historicalEditable ? editingHistorical ? 'Edição administrativa de Soltura anterior. As correções ficam registradas.' : 'Consulta histórica. Administrador pode editar esta Soltura em andamento.' : 'Consulta histórica. Esta folha não permite edição.'}</p>}
    </div>
    <div className="flex gap-2">
      {error && <Button variant="outline" size="sm" disabled={pending} onClick={onReload}>Recarregar</Button>}
      {allowed && today && state?.status === 'NAO_INICIADA' && <Button size="sm" className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={pending || !ready} onClick={() => onChange('iniciar')}>Iniciar Soltura</Button>}
      {allowed && admin && historicalEditable && state?.status === 'EM_ANDAMENTO' && onEditHistorical && <Button variant="outline" size="sm" disabled={pending || dirty} onClick={onEditHistorical}>{editingHistorical ? 'Encerrar edição' : 'Editar Soltura'}</Button>}
      {allowed && (today || admin && historicalEditable && editingHistorical) && state?.status === 'EM_ANDAMENTO' && <Button size="sm" className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={pending || remaining > 0 || withdrawalsPending > 0 || dirty} onClick={() => onChange('finalizar')}>Finalizar Soltura</Button>}
      {allowed && admin && today && state?.status === 'FINALIZADA' && <Button variant="outline" size="sm" disabled={pending} onClick={() => onChange('reabrir')}>Reabrir Soltura</Button>}
    </div>
  </div>;
}
