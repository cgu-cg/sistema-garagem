import { AlertTriangle, BusFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyEscala } from '@/lib/sharedEscala';
import { CiVehicleNotice } from './CiVehicleNotice';

const surface = 'rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90';
export function ScaleFleetSidebar({ state, garage, reserve = state?.reserva ?? [] }: { state: DailyEscala | null; garage: string; reserve?: string[] }) {
  const groups = state?.reservaPorCor?.grupos ?? ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'].map(id => ({ id, titulo: id, prefixos: [] as string[] }));
  return <div className="space-y-4">
    <div className={surface}><h3 className="text-center text-xs font-bold border-b pb-2">RESERVA GARAGEM {garage}</h3>
      {state && !state.reservaPorCor?.updatedAt && <p role="status" className="text-xs text-amber-700">Cache de cores indisponível. A classificação aguarda atualização válida.</p>}
      <div className="flex flex-wrap gap-x-2 gap-y-1" aria-label="Quantidade por cor">{groups.map(group => <span key={group.id} className={cn('inline-flex items-center gap-1 text-[9px] font-bold whitespace-nowrap', group.id === 'AZUL' && 'text-sky-600', group.id === 'VERMELHO' && 'text-rose-600', group.id === 'MICRO' && 'text-amber-600', group.id === 'PRATA' && 'text-slate-500')}>
        {group.id === 'VERMELHO_AZUL' ? <span aria-hidden="true" className="relative h-3 w-3 shrink-0"><BusFront className="absolute inset-0 h-3 w-3 text-rose-600" style={{ clipPath: 'inset(0 50% 0 0)' }} /><BusFront className="absolute inset-0 h-3 w-3 text-sky-600" style={{ clipPath: 'inset(0 0 0 50%)' }} /></span> : <BusFront aria-hidden="true" className="h-3 w-3 shrink-0" />}
        <span>{group.id === 'VERMELHO_AZUL' ? <><span className="text-rose-600">VERMELHO/</span><span className="text-sky-600">AZUL ({group.prefixos.filter(p => reserve.includes(p)).length})</span></> : <>{group.titulo} ({group.prefixos.filter(p => reserve.includes(p)).length})</>}</span>
      </span>)}</div>
      <div className="flex flex-wrap gap-x-2 gap-y-3 pt-1" aria-label="Carros da reserva">{[...reserve].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(prefixo => <span key={prefixo} title={state?.historicoTrocas?.filter(t => t.prefixo === prefixo).slice(-1)[0]?.motivo} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-mono"><CiVehicleNotice state={state} prefixo={prefixo} /></span>)}</div>
      {!reserve.length && <p className="text-[10px] italic text-muted-foreground">Sem carros</p>}
    </div>
    <div className={cn(surface, 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10')}><h3 className="text-xs font-bold text-rose-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> BLOQUEADOS CI {state?.ciData ?? ''}</h3>
      {state?.ciProvisoria && <p className="text-[10px] text-muted-foreground">Referência provisória até iniciar a CI da data.</p>}
      <div className="flex flex-wrap gap-1 text-xs font-mono">{state?.bloqueados.map(prefixo => <span key={prefixo} className="rounded-full border border-rose-300 px-2 py-0.5"><CiVehicleNotice state={state} prefixo={prefixo} hideIcon /></span>)}</div>
    </div>
  </div>;
}
