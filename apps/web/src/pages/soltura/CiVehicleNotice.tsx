import { useRef, useState, type ReactNode } from 'react';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DailyEscala } from '@/lib/sharedEscala';
import type { SVGProps } from 'react';

export function VehicleAlertIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M10.3 3.9a2 2 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3Z" fill="currentColor" /><path d="M12 9v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>;
}
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';

const sections = { PREVENTIVA: '1. Preventivas', OFICINA: '2. Setores da Oficina', REFORCO: '3. Reforço com Horário' };
const subtypes: Record<string, string> = { PREVENTIVA: 'PREVENTIVAS', LUBRIFICACAO: 'LUBRIFICAÇÃO', TROCA_OLEO: 'TROCA DE ÓLEO',
  REVISAO_GERAL: 'REVISÃO GERAL', SISEP: 'SISEP', MECANICA: 'MECÂNICA', ELEVADOR: 'ELEVADOR', ELETRICA: 'ELÉTRICA',
  BORRACHARIA: 'BORRACHARIA', FUNILARIA: 'FUNILARIA / PINTURA', TACOGRAFO: 'TACÓGRAFO', BILHETAGEM: 'BILHETAGEM', LIMPEZA: 'LIMPEZA' };

export function ciNoticesFor(state: DailyEscala | null, prefixo: string) {
  return state?.ciAvisos?.filter(i => i.prefixo === prefixo) ?? [];
}
export function vehicleNoticeFlags(state: DailyEscala | null, prefixo: string, _warning?: string, substitution?: unknown) {
  return { blocked: Boolean(state?.bloqueados.includes(prefixo)),
    requested: ciNoticesFor(state, prefixo).length > 0,
    defect: Boolean(substitution || state?.defeitosGaragem?.some(d => d.prefixo === prefixo)) };
}
export function VehicleNoticeIcons({ blocked, requested, defect }: ReturnType<typeof vehicleNoticeFlags>) {
  return <span className="pointer-events-none absolute -right-2 -top-2 inline-flex items-center -space-x-1">
    {blocked && <VehicleAlertIcon aria-hidden="true" data-ci-alert="bloqueado" className="h-3 w-3 text-rose-600 dark:text-rose-400" />}
    {requested && <VehicleAlertIcon aria-hidden="true" data-ci-alert="pedido" className="h-3 w-3 text-amber-500 dark:text-amber-400" />}
    {defect && <VehicleAlertIcon aria-hidden="true" data-ci-alert="defeito-garagem" className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
  </span>;
}

export function CiVehicleNotice({ state, prefixo, warning, children, hideIcon = false, substitution, defectDescription, hoverOnly = false, hoverDisabled = false, description }: { state: DailyEscala | null; prefixo: string; warning?: string; children?: ReactNode; hideIcon?: boolean;
  substitution?: { carroAnterior: string; descricaoDefeito?: string }; defectDescription?: string; hoverOnly?: boolean; hoverDisabled?: boolean; description?: string }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const notices = ciNoticesFor(state, prefixo);
  const troca = state?.historicoTrocas?.filter(t => t.prefixo === prefixo).slice(-1)[0];
  const defeito = state?.defeitosGaragem?.find(d => d.prefixo === prefixo) ?? (defectDescription ? { descricao: defectDescription } : undefined);
  const blue = Boolean(defeito || substitution);
  const blockedCI = Boolean(state?.bloqueados.includes(prefixo));
  const blockedPortaria = Boolean(state?.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === prefixo));
  const blocked = blockedCI || blockedPortaria;
  const red = Boolean(blocked || warning);
  const origins = [
    (blockedCI || notices.length > 0) && `CI ${state?.ciData ?? ''}`,
    blockedPortaria && 'Portaria',
    blue && 'Soltura',
    troca && 'Escala',
    description && 'Soltura',
  ].filter((value): value is string => typeof value === 'string');
  const source = [...new Set(origins)].join(' • ') || 'Escala';
  const text = children ?? <ScaleVehiclePrefix state={state} prefixo={prefixo} />;
  const Anchor = hoverOnly ? PopoverAnchor : PopoverTrigger;
  const hasNotice = /^\d{1,10}$/.test(prefixo) && Boolean(notices.length || red || troca || blue || description);
  // Um campo filho deve continuar na mesma arvore ao ganhar/perder avisos.
  // Trocar Fragment por Popover desmonta o input e perde foco/posicao do cursor.
  if (!children && !hasNotice) return <>{text}</>;
  return <Popover open={open && hasNotice && !hoverDisabled} onOpenChange={value => { pinned.current = false; setOpen(value && hasNotice); }}>
    <Anchor asChild><span tabIndex={hoverOnly || !hasNotice ? undefined : 0} role={children ? undefined : 'button'} aria-label={hasNotice ? 'Ver ocorrencias do carro ' + prefixo + ' na ' + source : undefined}
      className="relative inline-flex items-center font-bold"
      onMouseEnter={() => setOpen(hasNotice)} onMouseLeave={() => { if (!pinned.current) setOpen(false); }}
      onFocus={() => setOpen(hasNotice)} onBlur={() => { if (!pinned.current) setOpen(false); }}
      onKeyDown={event => { if (!hoverOnly && !children && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); } }}
      onClick={event => { if (hoverOnly || children) return; event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); }}>
      {text}
      {hasNotice && !hideIcon && <VehicleNoticeIcons blocked={blockedCI} requested={notices.length > 0} defect={blue} />}
    </span></Anchor>
    {open && hasNotice && !hoverDisabled && <PopoverContent align="start" className={'w-80 max-w-[calc(100vw-2rem)] bg-card text-card-foreground ' + (red ? 'border-rose-300' : blue ? 'border-blue-300' : 'border-amber-300')}
      onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
      <p className={'text-xs font-bold ' + (red ? 'text-rose-600' : blue ? 'text-blue-600' : 'text-amber-600')}>Carro {prefixo} • {source}</p>
      {description && <p className="mt-2 text-xs">{description}</p>}
      {red && <p className="mt-2 text-xs font-semibold">{warning || (state?.bloqueados.includes(prefixo) ? 'Bloqueado na CI.' : 'Bloqueado na Portaria.')}</p>}
      {defeito && <p className="mt-2 text-xs"><strong>Defeito Garagem:</strong> {defeito.descricao}</p>}
      {substitution && <div className="mt-2 space-y-1 text-xs">
        <p className="font-semibold">Substituição por Defeito Garagem: {substitution.carroAnterior} → {prefixo}</p>
        {substitution.descricaoDefeito && <p>{substitution.descricaoDefeito}</p>}
      </div>}
      {troca && <div className="mt-2 space-y-1 border-t pt-2 text-xs">
        {troca.motivo && <p className="font-semibold">Motivo da substituição: {troca.motivo}</p>}
        <p>Substituído pelo carro {troca.substituto}. Destino: {troca.destino === 'PENDENTE' ? 'Aguardando tratamento da portaria' : troca.destino === 'RESERVA' ? 'Reserva' : 'Bloqueados Portaria'}.</p>
      </div>}
      <ul className="mt-2 space-y-2 text-xs">{notices.map((item, index) => <li key={index}>
        <p className="font-semibold">{sections[item.categoria]}</p>
        {item.subTipo && <p>{subtypes[item.subTipo] ?? item.subTipo}</p>}
        {item.horario && <p>Horário: {item.horario}</p>}
        {item.tipoPosicao === 'EXTRA' && <p>Posição extra{item.ordemPosicao ? ' ' + item.ordemPosicao : ''}</p>}
      </li>)}</ul>
      <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">{red || defeito ? 'Este carro não pode ser utilizado. Informe um substituto livre.' : 'Informativo: esta ocorrência não bloqueia o uso do carro.'}</p>
    </PopoverContent>}
  </Popover>;
}
