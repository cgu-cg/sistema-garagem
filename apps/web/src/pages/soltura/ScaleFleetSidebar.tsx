import { useState, useEffect, type ReactNode } from 'react';
import { ReserveActionDialog } from './ReserveActionDialog';
import { AlertTriangle, BusFront, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyEscala } from '@/lib/sharedEscala';
import type { GarageDefect } from '@/lib/releaseProgramming';
import { CiVehicleNotice } from './CiVehicleNotice';

const surface = 'rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90';
export function ScaleFleetSidebar({ state, garage, reserve = state?.reserva ?? [], defeitosGaragem, hideCI = false, ciState = state, ciError, betweenCards, readOnly = true, modulo = 'ESCALA', operationContext = state?.contexto, onReserveSaved }: { readOnly?: boolean; modulo?: 'ESCALA'|'SOLTURA'; operationContext?: DailyEscala['contexto']; onReserveSaved?: () => Promise<void>; betweenCards?: ReactNode; ciState?: DailyEscala | null; ciError?: string; hideCI?: boolean; state: DailyEscala | null; garage: string; reserve?: string[]; defeitosGaragem?: GarageDefect[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { setSelected(null); }, [JSON.stringify(operationContext)]);
  const groups = state?.reservaPorCor?.grupos ?? ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'].map(id => ({ id, titulo: id, prefixos: [] as string[] }));
  const portaria = new Set(ciState?.ciPortaria?.filter(item => item.bloqueadoPortaria).map(item => item.prefixo) ?? []);
  const portariaBlocked = ciState?.bloqueados.filter(prefixo => portaria.has(prefixo)) ?? [];
  const ciBlocked = ciState?.bloqueados.filter(prefixo => !portaria.has(prefixo)) ?? [];
  const blockedCar = (prefixo: string) => <span key={prefixo} className="rounded-full border border-rose-300 px-2 py-0.5"><CiVehicleNotice state={ciState} prefixo={prefixo} hideIcon />{ciState?.ciPortaria?.find(p => p.prefixo === prefixo)?.usadoPortaria && <span className="ml-1 rounded bg-violet-100 px-1 text-[9px] text-violet-700 dark:bg-violet-950 dark:text-violet-300">Usado Portaria</span>}</span>;
  return <div className="space-y-4">
    <div className={surface}><h3 className="text-center text-xs font-bold border-b pb-2">RESERVA GARAGEM {garage}</h3>
      {state && !state.reservaPorCor?.updatedAt && <p role="status" className="text-xs text-amber-700">Cache de cores indisponível. A classificação aguarda atualização válida.</p>}
      <div className="flex flex-wrap gap-x-2 gap-y-1" aria-label="Quantidade por cor">{groups.map(group => <span key={group.id} className={cn('inline-flex items-center gap-1 text-[9px] font-bold whitespace-nowrap', group.id === 'AZUL' && 'text-sky-600', group.id === 'VERMELHO' && 'text-rose-600', group.id === 'MICRO' && 'text-amber-600', group.id === 'PRATA' && 'text-slate-500')}>
        {group.id === 'VERMELHO_AZUL' ? <span aria-hidden="true" className="relative h-3 w-3 shrink-0"><BusFront className="absolute inset-0 h-3 w-3 text-rose-600" style={{ clipPath: 'inset(0 50% 0 0)' }} /><BusFront className="absolute inset-0 h-3 w-3 text-sky-600" style={{ clipPath: 'inset(0 0 0 50%)' }} /></span> : <BusFront aria-hidden="true" className="h-3 w-3 shrink-0" />}
        <span>{group.id === 'VERMELHO_AZUL' ? <><span className="text-rose-600">VERMELHO/</span><span className="text-sky-600">AZUL ({group.prefixos.filter(p => reserve.includes(p)).length})</span></> : <>{group.titulo} ({group.prefixos.filter(p => reserve.includes(p)).length})</>}</span>
      </span>)}</div>
      <div className="flex flex-wrap gap-x-2 gap-y-3 pt-1" aria-label="Carros da reserva">{[...reserve].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(prefixo => <button key={prefixo} type="button" disabled={readOnly || !operationContext || !onReserveSaved} onClick={() => setSelected(prefixo)} aria-label={`Acoes da Reserva para carro ${prefixo}`} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-mono disabled:cursor-default"><CiVehicleNotice state={state} prefixo={prefixo} hoverOnly hoverDisabled={selected === prefixo} /></button>)}</div>
      {!reserve.length && <p className="text-[10px] italic text-muted-foreground">Sem carros</p>}
    </div>
    {betweenCards}
    {!hideCI && modulo === 'ESCALA' && <div className={cn(surface, 'border-rose-300')}>
      <h3 className="text-xs font-bold text-rose-600 flex items-center gap-2"><ShieldAlert className="h-4 w-4" />BLOQUEADOS PORTARIA CI ({portariaBlocked.length})</h3>
      <div className="flex flex-wrap gap-1 text-xs font-mono">{portariaBlocked.map(blockedCar)}</div>
      {!portariaBlocked.length && <p className="text-[10px] italic text-muted-foreground">Nenhum carro bloqueado pela portaria na CI.</p>}
    </div>}
    {selected && operationContext && onReserveSaved && <ReserveActionDialog key={`${selected}:${JSON.stringify(operationContext)}`} prefixo={selected} contexto={operationContext} modulo={modulo} onClose={() => setSelected(null)} onSaved={onReserveSaved} />}
    {!hideCI && <div className={cn(surface, 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10')}><h3 className="text-xs font-bold text-rose-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> BLOQUEADOS CI {ciState?.ciData ?? ''}</h3>
      {ciError && <p role="status" className="text-[10px] text-muted-foreground">{ciError}</p>}
      {ciState?.ciProvisoria && <p className="text-[10px] text-muted-foreground">Referência provisória até iniciar a CI da data.</p>}
      <div className="flex flex-wrap gap-1 text-xs font-mono">{ciBlocked.map(blockedCar)}</div>
    </div>}
    {defeitosGaragem && <div className={surface}>
      <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"><ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#164E3A] dark:text-emerald-400" />DEFEITO GARAGEM ({defeitosGaragem.length})</h3>
      <div className="flex flex-wrap gap-1.5 text-xs">{defeitosGaragem.map(defeito => <span key={defeito.prefixo}
        className="inline-flex cursor-help items-center gap-1 rounded-full border border-rose-500 bg-muted/30 px-2 py-0.5 font-mono text-rose-600"><CiVehicleNotice state={state} prefixo={defeito.prefixo} defectDescription={defeito.descricao} hideIcon /></span>)}</div>
      {!defeitosGaragem.length && <p className="text-[10px] italic text-muted-foreground">Nenhum veículo com defeito registrado.</p>}
    </div>}
  </div>;
}
