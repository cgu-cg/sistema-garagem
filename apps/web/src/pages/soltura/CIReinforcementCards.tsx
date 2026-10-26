import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Plus, X } from 'lucide-react';
import type { BloqueioCarro } from '@/data/solturaTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CarOption } from './CiManutencaoView';
import { MAX_INSPECTION_CARS, type InspectionChoice, type ReinforcementDraft } from './ciReinforcementEditor';

type FixedSlot = { id: string; horario: string };
type CarSelectProps = { value: string; onChange: (prefixo: string) => void; allowedCars: CarOption[]; disabled?: boolean; placeholder?: string; required?: boolean };
type Props = {
  slots: readonly FixedSlot[]; cars: CarOption[]; editable: boolean; busy: boolean; refreshRequired: boolean;
  readSlot: (slot: FixedSlot) => BloqueioCarro | undefined;
  inspection: InspectionChoice[];
  CarSelect: ComponentType<CarSelectProps>;
  onStart: (key: string) => boolean; onEnd: (key: string) => void;
  onSaveFixed: (slot: FixedSlot, draft: ReinforcementDraft, done: () => void) => void;
  onRemoveFixed: (slot: FixedSlot, done: () => void) => void;
  onSaveInspection: (selected: InspectionChoice[], done: () => void) => void;
};

const situations = ['LUBRIFICAÇÃO', 'TROCA DE ÓLEO', 'INSPEÇÃO', 'REVISÃO', 'PREVENTIVA'];
const inspectionKey = 'inspection';

export function CIReinforcementCards({ slots, cars, editable, busy, refreshRequired, readSlot, inspection, CarSelect,
  onStart, onEnd, onSaveFixed, onRemoveFixed, onSaveInspection }: Props) {
  const [fixed, setFixed] = useState<{ slot: FixedSlot; initial: ReinforcementDraft; draft: ReinforcementDraft } | null>(null);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [selected, setSelected] = useState<InspectionChoice[]>([]);
  const [initialSelection, setInitialSelection] = useState<InspectionChoice[]>([]);
  const activeKey = useRef<string>();
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => () => { if (activeKey.current) end.current(activeKey.current); }, []);

  const finish = () => {
    if (activeKey.current) onEnd(activeKey.current);
    activeKey.current = undefined;
    setFixed(null); setInspectionOpen(false);
  };
  const close = () => {
    if (busy) return;
    const dirty = fixed ? JSON.stringify(fixed.draft) !== JSON.stringify(fixed.initial)
      : JSON.stringify(selected) !== JSON.stringify(initialSelection);
    if (dirty && !window.confirm('Descartar as alterações deste popup? Elas ainda não foram salvas na CI.')) return;
    finish();
  };
  const openFixed = (slot: FixedSlot) => {
    if (!editable || !onStart(slot.id)) return;
    const saved = readSlot(slot);
    const draft = { prefixo: saved?.prefixo ?? '', motivo: saved?.motivo ?? '', obs: saved?.os ?? '' };
    activeKey.current = slot.id;
    setFixed({ slot, initial: draft, draft });
  };
  const openInspection = () => {
    if (!editable || !onStart(inspectionKey)) return;
    activeKey.current = inspectionKey;
    setSelected(inspection); setInitialSelection(inspection); setInspectionOpen(true);
  };

  return <>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {[slots.slice(0, 6), slots.slice(6, 12)].map((column, index) => <div key={index} className="overflow-hidden rounded-xl border bg-background lg:col-span-5">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_4rem_minmax(0,1fr)_1.75rem] items-center gap-2 border-b bg-muted/50 px-2.5 py-2 font-mono text-[10px] font-bold uppercase text-muted-foreground">
          <span>Horário</span><span>Situação</span><span>Prefixo</span><span>Obs</span><span className="sr-only">Ações</span>
        </div>
        <div className="divide-y divide-border/60">
          {column.map(slot => {
            const saved = readSlot(slot);
            return <div key={slot.id} className="grid min-h-12 grid-cols-[5rem_minmax(0,1fr)_4rem_minmax(0,1fr)_1.75rem] items-center gap-2 p-2 text-[11px]">
              <span className="whitespace-nowrap rounded border border-emerald-500/20 bg-emerald-500/10 px-1 py-0.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">{saved?.horarioReforco || slot.horario}</span>
              <span className="break-words">{saved?.motivo || '—'}</span>
              <span className="font-mono font-bold">{saved?.prefixo || '—'}</span>
              <span className="break-words text-muted-foreground">{saved?.os || '—'}</span>
              <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300" disabled={!editable}
                onClick={() => openFixed(slot)} aria-label={`${saved ? 'Editar' : 'Adicionar'} reforço ${slot.horario}, posição ${slot.id.replace('ref-', '')}`}><Plus className="h-3.5 w-3.5" /></Button>
            </div>;
          })}
        </div>
      </div>)}
      <div className="overflow-hidden rounded-xl border bg-background lg:col-span-2">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-2.5 py-2 font-mono text-[11px] font-bold">
          <span>INSPEÇÃO</span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
            disabled={!editable} onClick={openInspection} aria-label="Adicionar ou editar carros da inspeção"><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {inspection.length ? inspection.map(car => <span key={car.key} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">{car.prefixo}</span>)
            : <p className="text-xs text-muted-foreground">Nenhum carro cadastrado.</p>}
        </div>
      </div>
    </div>

    <Dialog open={Boolean(fixed)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="max-w-md rounded-2xl print:hidden">
        <DialogHeader><DialogTitle>Reforço — {fixed?.slot.horario}</DialogTitle><DialogDescription>Selecione a situação e o carro. O registro só será cadastrado ao salvar.</DialogDescription></DialogHeader>
        {refreshRequired && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">É necessário atualizar os dados oficiais. Feche este popup e atualize a CI antes de tentar novamente.</p>}
        {fixed && <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (editable && fixed.draft.prefixo && fixed.draft.motivo.trim()) onSaveFixed(fixed.slot, fixed.draft, finish); }}>
          <label className="block space-y-1 text-xs font-semibold">Situação
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" required value={fixed.draft.motivo} disabled={!editable}
              onChange={event => setFixed({ ...fixed, draft: { ...fixed.draft, motivo: event.target.value } })}>
              <option value="">Selecione uma situação</option>
              {situations.map(value => <option key={value} value={value}>{value}</option>)}
              {fixed.draft.motivo && !situations.includes(fixed.draft.motivo) && <option value={fixed.draft.motivo}>{fixed.draft.motivo}</option>}
            </select>
          </label>
          <div className="space-y-1 text-xs font-semibold"><span>Carro</span><CarSelect value={fixed.draft.prefixo} disabled={!editable} allowedCars={cars} placeholder="Selecione um carro" required
            onChange={prefixo => setFixed({ ...fixed, draft: { ...fixed.draft, prefixo } })} /></div>
          <label className="block space-y-1 text-xs font-semibold">Observação (opcional)<Input maxLength={255} value={fixed.draft.obs} disabled={!editable}
            onChange={event => setFixed({ ...fixed, draft: { ...fixed.draft, obs: event.target.value } })} placeholder="Ex.: POSTO .M" /></label>
          <DialogFooter className="gap-2">
            {readSlot(fixed.slot) && <Button type="button" variant="ghost" className="text-rose-600" disabled={!editable} onClick={() => { if (window.confirm('Retirar o carro salvo deste horário?')) onRemoveFixed(fixed.slot, finish); }}>Retirar carro</Button>}
            <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button>
            <Button type="submit" className="bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={!editable || !fixed.draft.prefixo || !fixed.draft.motivo.trim()}>{busy ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>

    <Dialog open={inspectionOpen} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="max-w-md rounded-2xl print:hidden">
        <DialogHeader><DialogTitle>Carros da inspeção</DialogTitle><DialogDescription>Selecione até 6 carros. Confira os prefixos abaixo e salve todos de uma vez.</DialogDescription></DialogHeader>
        {refreshRequired && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">É necessário atualizar os dados oficiais. Feche este popup e atualize a CI antes de tentar novamente.</p>}
        <div className="space-y-3">
          <CarSelect key={selected.map(i => i.key).join('|')} value="" allowedCars={cars.filter(car => !selected.some(i => i.prefixo === car.prefixo))} disabled={!editable || selected.length >= MAX_INSPECTION_CARS}
            placeholder="Selecione um carro" onChange={prefixo => {
              if (!prefixo || selected.length >= MAX_INSPECTION_CARS || selected.some(i => i.prefixo === prefixo)) return;
              setSelected(previous => previous.length >= MAX_INSPECTION_CARS || previous.some(i => i.prefixo === prefixo)
                ? previous : [...previous, { key: `new-${prefixo}`, prefixo }]);
            }} />
          <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border bg-muted/20 p-3" aria-label="Carros selecionados">
            {selected.map(car => <span key={car.key} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {car.prefixo}<button type="button" disabled={!editable} className="rounded-full p-0.5 hover:bg-emerald-500/20" aria-label={`Retirar ${car.prefixo} da seleção`}
                onClick={() => setSelected(previous => previous.filter(i => i.key !== car.key))}><X className="h-3 w-3" /></button>
            </span>)}
            {!selected.length && <span className="text-xs text-muted-foreground">Nenhum carro selecionado.</span>}
          </div>
          <p className="text-xs text-muted-foreground" role="status">{selected.length}/{MAX_INSPECTION_CARS} carros selecionados{selected.length > MAX_INSPECTION_CARS ? '. Os registros anteriores foram mantidos; ajuste a seleção para salvar.' : '.'}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button>
          <Button type="button" className="bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={!editable || selected.length > MAX_INSPECTION_CARS || JSON.stringify(selected) === JSON.stringify(initialSelection)}
            onClick={() => onSaveInspection(selected, finish)}>{busy ? 'Salvando…' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
