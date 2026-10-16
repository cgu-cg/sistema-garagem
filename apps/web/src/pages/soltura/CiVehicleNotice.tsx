import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DailyEscala } from '@/lib/sharedEscala';

const sections = { PREVENTIVA: '1. Preventivas', OFICINA: '2. Setores da Oficina', REFORCO: '3. Reforço com Horário' };
const subtypes: Record<string, string> = { PREVENTIVA: 'PREVENTIVAS', LUBRIFICACAO: 'LUBRIFICAÇÃO', TROCA_OLEO: 'TROCA DE ÓLEO',
  REVISAO_GERAL: 'REVISÃO GERAL', SISEP: 'SISEP', MECANICA: 'MECÂNICA', ELEVADOR: 'ELEVADOR', ELETRICA: 'ELÉTRICA',
  BORRACHARIA: 'BORRACHARIA', FUNILARIA: 'FUNILARIA / PINTURA', TACOGRAFO: 'TACÓGRAFO', BILHETAGEM: 'BILHETAGEM', LIMPEZA: 'LIMPEZA' };

export function ciNoticesFor(state: DailyEscala | null, prefixo: string) {
  return state?.ciAvisos?.filter(i => i.prefixo === prefixo) ?? [];
}

export function CiVehicleNotice({ state, prefixo, iconOnly = false }: { state: DailyEscala | null; prefixo: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const notices = ciNoticesFor(state, prefixo);
  const blocked = state?.bloqueados.includes(prefixo) || state?.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === prefixo);
  if (!notices.length || blocked) return iconOnly ? null : <>{prefixo}</>;
  return <Popover open={open} onOpenChange={value => { pinned.current = false; setOpen(value); }}>
    <PopoverTrigger asChild><button type="button" aria-label={'Ver ocorrencias do carro ' + prefixo + ' na CI ' + state?.ciData}
      className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!pinned.current) setOpen(false); }}
      onFocus={() => setOpen(true)} onBlur={() => { if (!pinned.current) setOpen(false); }}
      onClick={event => { event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); }}>
      {!iconOnly && prefixo}<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
    </button></PopoverTrigger>
    <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] border-amber-300 bg-card text-card-foreground"
      onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
      <p className="text-xs font-bold text-amber-600">Carro {prefixo} • CI {state?.ciData}</p>
      <ul className="mt-2 space-y-2 text-xs">{notices.map((item, index) => <li key={index}>
        <p className="font-semibold">{sections[item.categoria]}</p>
        {item.subTipo && <p>{subtypes[item.subTipo] ?? item.subTipo}</p>}
        {item.horario && <p>Horário: {item.horario}</p>}
        {item.tipoPosicao === 'EXTRA' && <p>Posição extra{item.ordemPosicao ? ' ' + item.ordemPosicao : ''}</p>}
      </li>)}</ul>
      <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">Informativo: esta ocorrência não bloqueia o uso do carro.</p>
    </PopoverContent>
  </Popover>;
}
