import { useRef, useState, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DailyEscala } from '@/lib/sharedEscala';
import { AlertTriangle } from 'lucide-react';
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';

const sections = { PREVENTIVA: '1. Preventivas', OFICINA: '2. Setores da Oficina', REFORCO: '3. Reforço com Horário' };
const subtypes: Record<string, string> = { PREVENTIVA: 'PREVENTIVAS', LUBRIFICACAO: 'LUBRIFICAÇÃO', TROCA_OLEO: 'TROCA DE ÓLEO',
  REVISAO_GERAL: 'REVISÃO GERAL', SISEP: 'SISEP', MECANICA: 'MECÂNICA', ELEVADOR: 'ELEVADOR', ELETRICA: 'ELÉTRICA',
  BORRACHARIA: 'BORRACHARIA', FUNILARIA: 'FUNILARIA / PINTURA', TACOGRAFO: 'TACÓGRAFO', BILHETAGEM: 'BILHETAGEM', LIMPEZA: 'LIMPEZA' };

export function ciNoticesFor(state: DailyEscala | null, prefixo: string) {
  return state?.ciAvisos?.filter(i => i.prefixo === prefixo) ?? [];
}

export function CiVehicleNotice({ state, prefixo, warning, children }: { state: DailyEscala | null; prefixo: string; warning?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const notices = ciNoticesFor(state, prefixo);
  const blocked = state?.bloqueados.includes(prefixo) || state?.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === prefixo);
  const red = Boolean(blocked || warning);
  const text = children ?? <ScaleVehiclePrefix state={state} prefixo={prefixo} />;
  if (!notices.length && !red) return <>{text}</>;
  return <Popover open={open} onOpenChange={value => { pinned.current = false; setOpen(value); }}>
    <PopoverTrigger asChild><span tabIndex={0} role={children ? undefined : 'button'} aria-label={'Ver ocorrencias do carro ' + prefixo + ' na CI ' + state?.ciData}
      className="relative inline-flex items-center font-bold"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!pinned.current) setOpen(false); }}
      onFocus={() => setOpen(true)} onBlur={() => { if (!pinned.current) setOpen(false); }}
      onKeyDown={event => { if (!children && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); } }}
      onClick={event => { if (children) return; event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); }}>
      {text}
      <AlertTriangle aria-hidden="true" data-ci-alert={red ? 'bloqueado' : 'pedido'} className={'pointer-events-none absolute -right-2 -top-2 h-3 w-3 ' + (red ? 'text-rose-600 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400')} />
    </span></PopoverTrigger>
    <PopoverContent align="start" className={'w-80 max-w-[calc(100vw-2rem)] bg-card text-card-foreground ' + (red ? 'border-rose-300' : 'border-amber-300')}
      onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
      <p className={'text-xs font-bold ' + (red ? 'text-rose-600' : 'text-amber-600')}>Carro {prefixo} • CI {state?.ciData}</p>
      {red && <p className="mt-2 text-xs font-semibold">{warning || (state?.bloqueados.includes(prefixo) ? 'Bloqueado na CI.' : 'Bloqueado na Portaria.')}</p>}
      <ul className="mt-2 space-y-2 text-xs">{notices.map((item, index) => <li key={index}>
        <p className="font-semibold">{sections[item.categoria]}</p>
        {item.subTipo && <p>{subtypes[item.subTipo] ?? item.subTipo}</p>}
        {item.horario && <p>Horário: {item.horario}</p>}
        {item.tipoPosicao === 'EXTRA' && <p>Posição extra{item.ordemPosicao ? ' ' + item.ordemPosicao : ''}</p>}
      </li>)}</ul>
      <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">{red ? 'Este carro não pode ser utilizado. Informe um substituto livre.' : 'Informativo: esta ocorrência não bloqueia o uso do carro.'}</p>
    </PopoverContent>
  </Popover>;
}
