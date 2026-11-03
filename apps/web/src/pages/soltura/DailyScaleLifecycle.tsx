import { Button } from '@/components/ui/button';
import type { DailyEscala } from '@/lib/sharedEscala';

const labels = { NAO_INICIADA: 'Não iniciada', EM_PREPARACAO: 'Em preparação', FINALIZADA: 'Finalizada', LEGADO: 'Registro anterior — somente consulta' };
export function DailyScaleLifecycle({ state, allowed, editableDate, pending, dirty, onChange, onNext }: {
  state: DailyEscala | null; allowed: boolean; editableDate: boolean; pending: boolean; dirty: boolean;
  onChange: (operation: 'iniciar' | 'finalizar' | 'reabrir') => void; onNext: () => void;
}) {
  const flow = state?.fluxo;
  if (!flow) return null;
  const disabled = pending || dirty || !flow.ciFinalizada;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-xs">
    <div className="space-y-1"><p className="font-semibold">Escala: {labels[flow.status]}</p>
      <p className="text-muted-foreground">Edição até as 06h do dia da operação (horário de Campo Grande).</p>
      <p className="text-muted-foreground">CI de {(flow.status === 'LEGADO' ? state.ciData : state.contexto.dataOperacao).split('-').reverse().join('/')}: {flow.ciFinalizada ? 'Finalizada' : 'aguardando finalização'}</p>
      {state.ciProvisoria && <p className="text-amber-700 dark:text-amber-400">Bloqueios provisórios da CI de {state.ciData.split('-').reverse().join('/')}. A CI da data ainda não foi iniciada.</p>}
      {dirty && <p className="text-amber-600">Salve os rascunhos antes de alterar o estado da escala.</p>}
      {flow.status === 'FINALIZADA' && editableDate && flow.proximaIniciada && <p className="text-muted-foreground">A próxima escala já foi iniciada; reabertura indisponível.</p>}
    </div>
    {allowed && <div className="flex flex-wrap gap-2 print:hidden">
      {editableDate && flow.status === 'NAO_INICIADA' && <Button size="sm" disabled={disabled} onClick={() => onChange('iniciar')} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]">Iniciar Escala</Button>}
      {flow.status === 'EM_PREPARACAO' && <Button size="sm" disabled={disabled} onClick={() => onChange('finalizar')} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]">Finalizar Escala</Button>}
      {editableDate && flow.status === 'FINALIZADA' && !flow.proximaIniciada && <Button size="sm" variant="outline" disabled={disabled} onClick={() => onChange('reabrir')} className="rounded-full">Reabrir Escala</Button>}
      {flow.status === 'FINALIZADA' && <Button size="sm" variant="outline" disabled={pending || dirty} onClick={onNext} className="rounded-full">Próxima Escala</Button>}
    </div>}
  </div>;
}
