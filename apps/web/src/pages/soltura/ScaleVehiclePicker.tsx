import { useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type VehicleOption = { prefixo: string; unavailable: string; blocked: boolean };
const company = (prefixo: string) => ({ '1': 'VCM', '2': 'VSF', '3': 'JTU', '4': 'VCG' }[prefixo[0]] || '');

export function ScaleVehiclePicker({ value, onChange, onConfirm, options, garage, label, disabled, className, placeholder, renderPrefix }: {
  value: string; onChange: (value: string) => void; onConfirm?: () => void;
  options: VehicleOption[]; garage: string; label: string; disabled?: boolean; className?: string; placeholder?: string;
  renderPrefix?: (prefixo: string) => ReactNode;
}) {
  const [open, setOpen] = useState(false), [filter, setFilter] = useState('TODAS');
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const filtered = options.filter(o => (filter === 'TODAS' || company(o.prefixo) === filter) && o.prefixo.includes(search));
  return <Popover open={open && !disabled} onOpenChange={setOpen}>
    <PopoverAnchor asChild><div className="relative">
      <input ref={input} role="combobox" aria-label={label} aria-expanded={open && !disabled} aria-controls={id} aria-autocomplete="list"
        value={value} placeholder={placeholder} disabled={disabled} inputMode="numeric" maxLength={10}
        style={renderPrefix && value ? { color: 'transparent', caretColor: 'hsl(var(--foreground))' } : undefined}
        onClick={() => { setSearch(''); setOpen(true); }}
        onChange={e => { const p = e.target.value.replace(/\D/g, ''); onChange(p); setSearch(p); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
          if (e.key === 'Enter') { e.preventDefault(); setOpen(false); onConfirm?.(); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => document.getElementById(id)?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()); }
        }} className={cn('w-full rounded-full border bg-background py-2 pl-3 pr-7 text-xs font-mono disabled:opacity-50', className)} />
      {renderPrefix && value && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 right-7 flex items-center justify-center text-xs font-mono">{renderPrefix(value)}</span>}
      <button type="button" aria-label={'Abrir lista: ' + label} disabled={disabled}
        onClick={() => { setSearch(''); setOpen(v => !v); }} className="absolute inset-y-0 right-1 flex items-center px-1 text-muted-foreground"><ChevronDown className="h-3 w-3" /></button>
    </div></PopoverAnchor>
    <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0" onOpenAutoFocus={e => e.preventDefault()}
      onCloseAutoFocus={e => e.preventDefault()} onInteractOutside={e => { if (e.target === input.current) e.preventDefault(); }}>
      <div className="flex items-center justify-between gap-1 border-b bg-muted/30 p-2 font-sans text-[10px]">
        <span className="text-muted-foreground">Filtrar por Empresa:</span>
        <div className="flex gap-1">{['TODAS', 'VCG', 'JTU', 'VSF', 'VCM'].map(c => <button key={c} type="button" aria-pressed={filter === c}
          onClick={() => setFilter(c)} className={cn('rounded-full px-2 py-1 font-semibold', filter === c ? 'bg-foreground text-background' : 'text-muted-foreground')}>{c}</button>)}</div>
      </div>
      <div id={id} role="listbox" aria-label="Veiculos da garagem" className="max-h-64 overflow-y-scroll overscroll-contain touch-pan-y divide-y divide-border"
        ref={node => {
          if (!node) return;
          // Listener nativo nao passivo: Dialog pode cancelar o wheel do portal.
          node.onwheel = event => {
            if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || node.scrollHeight <= node.clientHeight) return;
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1;
            node.scrollTop += event.deltaY * unit;
            event.preventDefault();
            event.stopPropagation();
          };
        }}
        onKeyDown={e => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          e.preventDefault();
          const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[(current + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
        }}> 
        {filtered.map(o => <button key={o.prefixo} role="option" aria-selected={value === o.prefixo} type="button" disabled={Boolean(o.unavailable)} title={o.unavailable}
          onClick={() => { onChange(o.prefixo); setOpen(false); }}
          className="flex w-full items-center gap-2 px-3 py-3 text-left text-xs hover:bg-muted focus:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
          <span className="font-mono font-bold">{renderPrefix ? renderPrefix(o.prefixo) : o.prefixo}</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{company(o.prefixo)}</span>
          <span className="font-sans text-[10px] text-muted-foreground">Garagem {garage}</span>
          {o.unavailable && <span className="ml-auto rounded border border-rose-200 bg-rose-50 px-1 py-0.5 text-[9px] text-rose-600 dark:bg-rose-950">{o.blocked ? 'Ja Bloqueado' : 'Em uso'}</span>}
        </button>)}
        {!filtered.length && <p className="p-4 text-center text-xs text-muted-foreground">Nenhum veiculo encontrado.</p>}
      </div>
      <p className="border-t bg-muted/20 p-2 text-center font-sans text-[10px] text-muted-foreground">Mostrando {filtered.length} de {options.length} veiculos cadastrados</p>
    </PopoverContent>
  </Popover>;
}
