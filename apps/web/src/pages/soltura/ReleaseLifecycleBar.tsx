import type { ReleaseLifecycle } from '@/lib/releaseLifecycle';
import { Button } from '@/components/ui/button';

export function ReleaseLifecycleBar({ state, error, pending, allowed, admin, today, ready, remaining, dirty, onChange, onReload }: {
  state: ReleaseLifecycle | null; error: string; pending: boolean; allowed: boolean; admin: boolean; today: boolean;
  ready: boolean; remaining: number; dirty: boolean; onChange: (value: 'iniciar' | 'finalizar' | 'reabrir') => void; onReload: () => void;
}) {
  const labels = { NAO_INICIADA: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada' };
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-xs print:hidden">
    <div><p className="font-semibold">Soltura: {state ? labels[state.status] : error ? 'Indisponível' : 'Consultando estado oficial...'}</p>
      {error && <p role="alert" className="mt-1 text-rose-600">{error}</p>}
      {state?.status === 'EM_ANDAMENTO' && <p className="mt-1 text-muted-foreground">{remaining} viagem(ns) pendente(s). Finalização exige todas liberadas ou suspensas.</p>}
      {dirty && <p className="mt-1 text-amber-700">Confirme os rascunhos antes de finalizar.</p>}
      {!today && <p className="mt-1 text-muted-foreground">Consulta histórica. Alterações disponíveis somente no dia da operação.</p>}
    </div>
    <div className="flex gap-2">
      {error && <Button variant="outline" size="sm" disabled={pending} onClick={onReload}>Recarregar</Button>}
      {allowed && today && state?.status === 'NAO_INICIADA' && <Button size="sm" className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={pending || !ready} onClick={() => onChange('iniciar')}>Iniciar Soltura</Button>}
      {allowed && today && state?.status === 'EM_ANDAMENTO' && <Button size="sm" className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={pending || remaining > 0 || dirty} onClick={() => onChange('finalizar')}>Finalizar Soltura</Button>}
      {allowed && admin && today && state?.status === 'FINALIZADA' && <Button variant="outline" size="sm" disabled={pending} onClick={() => onChange('reabrir')}>Reabrir Soltura</Button>}
    </div>
  </div>;
}
