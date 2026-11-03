import { LineActionsMenu, type LineAction } from './LineActionsMenu';
import { type ComponentProps } from 'react';
import { Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CarroTrocaPopover } from './CarroTrocaPopover';
import { MotoristaTrocaPopover } from './MotoristaTrocaPopover';

export function ReleaseRowEditMenu({ car, driver, onClear }: {
  car: ComponentProps<typeof CarroTrocaPopover>;
  driver: ComponentProps<typeof MotoristaTrocaPopover>;
  onClear?: (action?: LineAction) => Promise<boolean>;
}) {
  if (car.isReadOnly) return null;
  return <><Popover>
    <PopoverTrigger asChild><button type="button" aria-label={`Editar linha ${car.item.linha} tabela ${car.item.tabela}`} title="Editar carro ou motorista"
      className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button></PopoverTrigger>
    <PopoverContent className="w-72 rounded-2xl space-y-3" align="end">
      <p className="text-sm font-semibold">Editar linha {car.item.linha} · {car.item.tabela}</p>
      <div className="flex items-center justify-between gap-2 text-sm"><span>Carro realizado</span><CarroTrocaPopover {...car} /></div>
      <div className="flex items-center justify-between gap-2 text-sm"><span>Motorista (MOTO)</span><MotoristaTrocaPopover {...driver} /></div>
      <p className="text-xs text-muted-foreground">A saída permanece liberada. As correções são salvas pelos controles acima.</p>
    </PopoverContent>
  </Popover>{onClear && <LineActionsMenu label={`${car.item.linha} tabela ${car.item.tabela}`} onAction={onClear} />}</>;
}
