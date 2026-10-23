import { useRef } from 'react';
import { Calendar, Printer, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { operationalContext } from '@/lib/mvpTemporal';
import { cn } from '@/lib/utils';

export function ReleaseToolbar({ date, garage, dayType, period, onDate, onGarage, onDayType, onPeriod, onPrint, lineSearch = '', onLineSearch }: {
  lineSearch?: string; onLineSearch?: (value: string) => void;
  date: string; garage: 'VCG' | 'VCM'; dayType: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; period: 'MATUTINO' | 'VESPERTINO';
  onDate: (date: string) => void; onGarage?: (garage: 'VCG' | 'VCM') => void;
  onDayType: (type: 'SEG_SEX' | 'SABADO' | 'DOM_FER') => void; onPeriod: (period: 'MATUTINO' | 'VESPERTINO') => void; onPrint: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const today = operationalContext();
  const relativeDate = date === today.today ? 'Hoje' : date === today.tomorrow ? 'Amanhã' : 'Ir para hoje';
  const selected = 'bg-[#164E3A] text-white shadow-xs';
  const group = 'inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1';
  const button = 'rounded-full px-3 py-1 text-[11px] transition-colors cursor-pointer';
  return <div className="flex flex-wrap items-center gap-2 print:hidden">
    <div className="relative w-full sm:w-52 shrink-0">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" aria-label="Pesquisar uma linha" placeholder="Pesquisar uma linha..." value={lineSearch}
        onChange={event => onLineSearch?.(event.target.value)} className="h-9 rounded-full bg-card pl-9 text-xs" />
    </div>
    <div className="group inline-flex h-9 items-center overflow-hidden rounded-full border border-border bg-muted/40">
      <button type="button" className="inline-flex h-full items-center gap-2 px-3 cursor-pointer" aria-label="Escolher data da Soltura" onClick={() => { try { input.current?.showPicker(); } catch { input.current?.focus(); input.current?.click(); } }}>
        <Calendar className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600" /><span className="text-xs font-mono font-bold">{date.split('-').reverse().join('/')}</span>
      </button>
      <input ref={input} type="date" value={date} onChange={event => { if (event.target.value) onDate(event.target.value); }} tabIndex={-1} aria-label="Data da Soltura" className="absolute h-0 w-0 opacity-0 pointer-events-none" />
      <button type="button" title="Ir para hoje" className="border-l border-border px-3 text-[11px] text-emerald-700 cursor-pointer" onClick={() => onDate(operationalContext().today)}>{relativeDate}</button>
    </div>
    <div className={group}>{(['VCG', 'VCM'] as const).filter(value => onGarage || value === garage).map(value => <button type="button" key={value} aria-pressed={value === garage} onClick={() => onGarage?.(value)} className={cn(button, value === garage ? selected : 'text-muted-foreground')}>{value}</button>)}</div>
    <div className={group}>{([['SEG_SEX', 'Seg-Sex'], ['SABADO', 'Sábado'], ['DOM_FER', 'Dom/Fer']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={value === dayType} className={cn(button, value === dayType ? selected : 'text-muted-foreground')} onClick={() => onDayType(value)}>{label}</button>)}</div>
    {dayType === 'SEG_SEX' && <div className={group}>{([['MATUTINO', 'Matutino'], ['VESPERTINO', 'Vespertino']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={value === period} className={cn(button, value === period ? selected : 'text-muted-foreground')} onClick={() => onPeriod(value)}>{label}</button>)}</div>}
    <Button variant="outline" size="sm" onClick={onPrint} className="ml-auto rounded-full gap-2 text-xs"><Printer className="h-3.5 w-3.5" />Imprimir A4</Button>
  </div>;
}
