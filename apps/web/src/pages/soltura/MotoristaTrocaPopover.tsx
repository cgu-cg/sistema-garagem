import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MotoristaTrocaPopover({ codigo, readOnly, onSave }: {
  codigo: string; readOnly: boolean; onSave: (codigo: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false), [value, setValue] = useState(codigo), [saving, setSaving] = useState(false);
  const pending = useRef(false);
  if (readOnly) return <span className="font-mono text-xs font-bold">{codigo || '—'}</span>;
  return <Popover open={open} onOpenChange={next => {
    if (pending.current) return;
    if (next) setValue(codigo);
    setOpen(next);
  }}>
    <PopoverTrigger asChild>
      <button type="button" aria-label={`Alterar MOTO ${codigo}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 font-mono text-xs font-bold hover:bg-muted">
        {codigo || '—'}<Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-72 rounded-2xl" onClick={event => event.stopPropagation()}>
      <form onSubmit={async event => {
        event.preventDefault();
        if (pending.current || !value.trim() || value.trim() === codigo) return;
        pending.current = true; setSaving(true);
        try { if (await onSave(value.trim())) setOpen(false); }
        finally { pending.current = false; setSaving(false); }
      }}>
        <label className="text-sm font-semibold">Alterar motorista (MOTO)
          <Input autoFocus value={value} maxLength={100} disabled={saving} onChange={event => setValue(event.target.value)} className="mt-3 font-mono" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" size="sm" className="bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={saving || !value.trim() || value.trim() === codigo}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </PopoverContent>
  </Popover>;
}
