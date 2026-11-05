import { useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { ReleaseWithdrawal } from '@/lib/releaseProgramming';
import type { DailyEscala, ScaleWithdrawal } from '@/lib/sharedEscala';
import { ScaleSubstitutionDialog } from './ScaleSubstitutionDialog';
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';
import { CiVehicleNotice } from './CiVehicleNotice';

export function ReleaseTreatmentCards({ state, blocked = [], context, readOnly, onTreat }: {
  state: DailyEscala | null; pending?: ReleaseWithdrawal[]; blocked?: ReleaseWithdrawal[];
  context: DailyEscala['contexto']; readOnly: boolean;
  onTreat: (item: ReleaseWithdrawal, destino: 'RESERVA' | 'BLOQUEAR', motivo: string) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<ReleaseWithdrawal | null>(null), [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const editable = (item: ReleaseWithdrawal) => !readOnly && item.turno === context.turno && item.escalaTipo === context.escalaTipo && Boolean(item.base && item.scheduleId);
  const save = async (item: ReleaseWithdrawal, destino: 'RESERVA' | 'BLOQUEAR', motivo: string) => {
    if (busy.current || !editable(item)) return;
    busy.current = true; setSaving(true);
    try { if (await onTreat(item, destino, motivo)) setSelected(null); }
    finally { busy.current = false; setSaving(false); }
  };
  const surface = 'rounded-2xl border border-border bg-card p-3.5 space-y-2.5';
  const ciBlocked = [...new Set(state?.bloqueados.filter(prefixo => state.ciPortaria?.some(item => item.prefixo === prefixo && item.bloqueadoPortaria)) ?? [])];
  const legacyBlocked = blocked.filter(item => !ciBlocked.includes(item.prefixo));
  const count = new Set([...ciBlocked, ...legacyBlocked.map(item => item.prefixo)]).size;
  return <>
    <div className={`${surface} border-rose-300`}>
      <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-rose-600"><ShieldAlert className="h-3.5 w-3.5" />Bloqueados Portaria CI ({count})</h3>
      <div className="flex flex-wrap gap-1.5">{ciBlocked.map(prefixo => <span key={`ci:${prefixo}`} className="rounded-full border border-rose-300 px-2 py-0.5 text-xs font-mono text-rose-600"><CiVehicleNotice state={state} prefixo={prefixo} hideIcon />{state?.ciPortaria?.some(item => item.prefixo === prefixo && item.usadoPortaria) && <span className="ml-1 rounded bg-violet-100 px-1 text-[9px] text-violet-700 dark:bg-violet-950 dark:text-violet-300">Usado Portaria</span>}</span>)}{legacyBlocked.map(item => <button key={`${item.registroId}:${item.trocaId}`} type="button"
        disabled={saving || !editable(item)} title={`${item.motivo || 'Defeito registrado sem descrição'}${item.legado ? ' · Registro anterior' : ''} · ${item.turno ?? ''}`}
        aria-label={`Desbloquear carro ${item.prefixo}`} className="rounded-full border border-rose-300 px-2 py-0.5 text-xs font-mono text-rose-600 disabled:cursor-default"
        onClick={() => { if (window.confirm(`Devolver o carro ${item.prefixo} para a Reserva? Bloqueios da CI e outros impedimentos serao preservados.`)) void save(item, 'RESERVA', 'Desbloqueado pela Portaria'); }}>
        <ScaleVehiclePrefix state={state} prefixo={item.prefixo} />{item.legado && <span className="ml-1 text-[9px]">Anterior</span>}
      </button>)}</div>
      {!count && <p className="text-[10px] italic text-muted-foreground">Nenhum carro bloqueado pela portaria.</p>}
    </div>
    {selected && <ScaleSubstitutionDialog key={`${selected.registroId}:${selected.trocaId}`} prefixo={selected.prefixo} substituto={selected.substituto}
      reserveUnavailable={state?.bloqueados.includes(selected.prefixo) ? 'Carro bloqueado na CI.' : undefined}
      saving={saving} onCancel={() => { if (!busy.current) setSelected(null); }}
      onSave={(value: ScaleWithdrawal) => void save(selected, value.destino, value.motivo)} />}
  </>;
}
