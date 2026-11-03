import { useRef, useState } from 'react';
import { MoreVertical, Eraser, Ban, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export type LineAction = 'limpar-linha' | 'suspender-linha' | 'reativar-linha';
export function LineActionsMenu({ label, suspended, disabled, canClear = true, onAction }: {
  label: string; suspended?: boolean; disabled?: boolean; canClear?: boolean;
  onAction: (action: LineAction) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false), pending = useRef(false);
  const run = async (action: LineAction) => {
    if (pending.current || disabled) return;
    pending.current = true; setBusy(true);
    try { await onAction(action); } finally { pending.current = false; setBusy(false); }
  };
  return <DropdownMenu><DropdownMenuTrigger asChild>
    <button type="button" aria-label={`Ações da linha ${label}`} title="Ações da linha" disabled={disabled || busy}
      className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:bg-muted disabled:opacity-40">
      <MoreVertical className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger><DropdownMenuContent align="end">
    {suspended ? <DropdownMenuItem onSelect={() => void run('reativar-linha')}><RotateCcw className="h-4 w-4" />Reativar linha</DropdownMenuItem> : <>
      <DropdownMenuItem disabled={!canClear} onSelect={() => void run('limpar-linha')}><Eraser className="h-4 w-4" />Limpar dados</DropdownMenuItem>
      <DropdownMenuItem className="text-rose-600" onSelect={() => void run('suspender-linha')}><Ban className="h-4 w-4" />Suspender linha</DropdownMenuItem>
    </>}
  </DropdownMenuContent></DropdownMenu>;
}
