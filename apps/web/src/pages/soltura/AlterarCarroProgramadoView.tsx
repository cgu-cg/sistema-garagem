import { LineActionsMenu, type ScaleLineAction } from './LineActionsMenu';
import { VehicleAlertIcon } from './CiVehicleNotice';
import { ScaleFleetSidebar } from './ScaleFleetSidebar';
import { PreparationOverlay } from './PreparationOverlay';
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';
import { CiVehicleNotice, VehicleNoticeIcons, vehicleNoticeFlags } from './CiVehicleNotice';
import { ScaleVehiclePicker } from './ScaleVehiclePicker';
import { ScaleSubstitutionDialog } from './ScaleSubstitutionDialog';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Search, Plus, Bus, Pencil, Check, Loader2, X, ChevronDown, ChevronUp, MapPin, ShieldAlert, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FixedScaleRow } from '@/lib/dailySchedule';
import type { CardMutation, DailyEscala, ScaleCard, ScaleCardItem, ScaleWithdrawal, ScaleExchange } from '@/lib/sharedEscala';

interface Props {
  lifecycleControl?: ReactNode;
  dateControl?: ReactNode;
  readOnly?: boolean; readOnlyReason?: string;
  onEditingChange?: (key: string, dirty: boolean) => void;
  garagem: 'VCG' | 'VCM'; escalaTipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; schedules: FixedScaleRow[];
  official: DailyEscala | null;
  onSaveSubstitution: (id: string, prefixo: string, retirada?: ScaleWithdrawal) => Promise<boolean>;
  onClearLine?: (id: string, action?: ScaleLineAction) => Promise<boolean>;
  onSaveCard: (change: CardMutation) => Promise<boolean>;
  onTreatSubstitution?: (id: string, retirada: ScaleWithdrawal) => Promise<boolean>;
  treatmentReadOnly?: boolean;
  onReserveSaved?: () => Promise<void>;
  onSelectGaragem?: (garage: 'VCG' | 'VCM') => void;
  onSelectEscalaTipo?: (tipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER') => void;
}
const surface = 'rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90';
const addVehicleButton = 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-500/10 text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-500/20 cursor-pointer dark:border-emerald-500/50 dark:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40';
function blocked(state: DailyEscala, p: string) {
  return state.bloqueados.includes(p) || Boolean(state.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === p));
}
function allocationError(state: DailyEscala | null, prefixo: string, ownKey: string, allowCI = false) {
  if (!state) return 'Consulte a frota e os bloqueios oficiais antes de confirmar.';
  if (!/^\d{1,10}$/.test(prefixo)) return 'Informe um carro substituto valido.';
  if (state.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === prefixo) || !allowCI && state.bloqueados.includes(prefixo)) return 'Carro ' + prefixo + ' esta bloqueado. Informe um substituto livre.';
  if (!state.frota.includes(prefixo)) return 'Carro ' + prefixo + ' nao existe na frota desta garagem.';
  const used = state.ocupacoes.find(o => o.prefixo === prefixo && o.chave !== ownKey);
  return used ? 'Carro ' + prefixo + ' ja utilizado em ' + used.local + '.' : '';
}
export function pickerOptions(state: DailyEscala | null, ownKey: string, allowCI = false) {
  return state?.frota.filter(prefixo => !state.ocupacoes.some(o => o.prefixo === prefixo && o.chave.startsWith('linha:'))).map(prefixo => ({ prefixo, blocked: blocked(state, prefixo), unavailable: allocationError(state, prefixo, ownKey, allowCI) })) ?? [];
}

export function AlterarCarroProgramadoView({ dateControl, lifecycleControl, readOnly = true, readOnlyReason, onEditingChange, garagem, escalaTipo,
  schedules, official, onSaveSubstitution, onClearLine, onSaveCard, onTreatSubstitution, onReserveSaved, treatmentReadOnly = readOnly, onSelectGaragem, onSelectEscalaTipo }: Props) {
  const [search, setSearch] = useState(''), [extended, setExtended] = useState(false);
  const [modal, setModal] = useState<{ card: ScaleCard; item?: ScaleCardItem } | null>(null);
  const [prefixo, setPrefixo] = useState('');
  const [treatment, setTreatment] = useState<ScaleExchange | null>(null);
  const [saving, setSaving] = useState(false); const pending = useRef(false);
  const drafts = useRef(new Map<string, string>());
  const open = (card: ScaleCard, item?: ScaleCardItem) => {
    if (readOnly) return;
    setModal({ card, item }); setPrefixo(item?.prefixo ?? ''); onEditingChange?.('modal-card', true);
  };
  const close = () => { if (pending.current) return; setModal(null); onEditingChange?.('modal-card', false); };
  const mutate = async (mutation: CardMutation) => {
    if (readOnly || pending.current) return false;
    pending.current = true; setSaving(true);
    try { return await onSaveCard(mutation); } finally { pending.current = false; setSaving(false); }
  };
  const saveModal = async () => {
    if (!modal) return;
    const p = prefixo.trim(), ownKey = modal.item ? 'card:' + modal.card.id + ':' + modal.item.id : '';
    if (p) { const error = allocationError(official, p, ownKey); if (error) { toast.error(error); return; } }
    if (!p && modal.card.modo === 'lista') { toast.error('Informe o carro.'); return; }
    if (await mutate({ card: modal.card.id, operacao: modal.item ? 'definir' : 'adicionar', prefixo: p,
      itemId: modal.item?.id })) {
      setModal(null); onEditingChange?.('modal-card', false); toast.success('Card salvo para esta data.');
    }
  };
  const filtered = schedules.filter(s => [s.linha, s.tabela, s.carroProgramado, s.carroSubstituido ?? ''].some(v => v.toLowerCase().includes(search.trim().toLowerCase())));
  const completed = schedules.filter(item => item.confirmada).length;
  const suspended = schedules.filter(item => item.suspensa).length;
  const remaining = schedules.length - completed - suspended;
  const colorIds = ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'];
  const otherCards = official?.cards.filter(c => !colorIds.includes(c.id) && c.id !== 'SUBSTITUIDOS' && !c.id.startsWith('TERMINAL_')) ?? [];
  const terminalCards = official?.cards.filter(c => c.id.startsWith('TERMINAL_')) ?? [];
  const ciPending = Boolean(official?.fluxo && official.fluxo.status !== 'LEGADO' && !official.fluxo.ciFinalizada);
  const renderCard = (card: ScaleCard) => {
    const CardIcon = card.id === 'PORTARIA' ? ShieldAlert : card.modo === 'rabicho' ? Route : Bus;
    return (
    <div key={card.id} className={cn(surface, 'min-w-0', ['AZUL', 'VERMELHO', 'MICRO'].includes(card.id) && 'p-2')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"><CardIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#164E3A] dark:text-emerald-400" />{card.titulo} ({card.itens.filter(i => i.prefixo).length})</h3>
        {card.modo !== 'rabicho' && <button type="button" disabled={readOnly || saving} title={'Adicionar em ' + card.titulo} aria-label={'Adicionar em ' + card.titulo}
          onClick={() => open(card, card.modo === 'unico' ? card.itens[0] : undefined)} className={addVehicleButton}><Plus className="h-3 w-3" /></button>}
      </div>
      {card.modo === 'rabicho' ? <table className="w-full text-xs font-mono"><thead><tr className="text-muted-foreground"><th className="text-left">Linha</th><th>Tab</th><th>Carro</th></tr></thead>
        <tbody>{card.itens.map(i => <tr key={i.id}><td className="py-2">{i.linha}</td><td className="text-center">{i.tabela}</td><td className="text-right"><button disabled={readOnly || saving} type="button" aria-label={'Definir carro da linha ' + i.linha + ' tabela ' + i.tabela} onClick={() => open(card, i)} className={cn(i.prefixo ? 'inline-flex items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-400 disabled:opacity-40' : addVehicleButton, official && i.prefixo && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600 border-rose-500')}>{i.prefixo ? <CiVehicleNotice state={official} prefixo={i.prefixo} /> : <Plus className="h-3 w-3" />}</button></td></tr>)}</tbody></table>
        : <div className="flex flex-wrap gap-1.5 text-xs font-mono">{card.itens.filter(i => i.prefixo).map(i => <span key={i.id} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-muted/30', official && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600 border-rose-500')}>
          <CiVehicleNotice state={official} prefixo={i.prefixo} hideIcon={card.id === 'PORTARIA'} />{i.horario && <span className="text-muted-foreground"> {i.horario}</span>}
          <button type="button" disabled={readOnly || saving} aria-label={'Retirar ' + i.prefixo + ' de ' + card.titulo} onClick={() => void mutate({ card: card.id, operacao: 'remover', prefixo: '', itemId: i.id })}><X className="h-3 w-3" /></button>
        </span>)}</div>}
      {card.itens.every(i => !i.prefixo) && card.modo !== 'rabicho' && <p className="text-xs italic text-muted-foreground">Nenhum veiculo alocado.</p>}
    </div>
  );
  };
  return <div className="space-y-4 pb-12 text-foreground">
    {!ciPending && lifecycleControl}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar uma linha..." className="h-10 rounded-2xl border border-border bg-card pl-9 pr-3 text-sm" /></div>
      <div className="flex max-w-full flex-wrap items-center justify-end gap-3 text-xs">
        {dateControl}
        {onSelectGaragem ? <div className="flex gap-1 rounded-full border p-1">{(['VCG', 'VCM'] as const).map(g => <button key={g} type="button" onClick={() => onSelectGaragem(g)} className={cn('rounded-full px-3 py-1', garagem === g && 'bg-[#164E3A] text-white')}>{g}</button>)}</div> : null}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 p-1">{(['SEG_SEX', 'SABADO', 'DOM_FER'] as const).map(t => <button key={t} type="button" onClick={() => onSelectEscalaTipo?.(t)} aria-pressed={escalaTipo === t} className={cn('shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] leading-none transition-colors', escalaTipo === t ? 'bg-[#164E3A] font-semibold text-white shadow-xs' : 'text-muted-foreground hover:text-foreground')}>{t === 'SEG_SEX' ? 'Seg-Sex' : t === 'SABADO' ? 'Sabado' : 'Dom/Fer'}</button>)}</div>
      </div>
    </div>
    {readOnly && !ciPending && <p role="status" className="text-sm text-muted-foreground">{treatmentReadOnly ? readOnlyReason : 'As linhas estão em consulta. As ações da Reserva continuam disponíveis para a portaria.'}</p>}
    {Boolean(official?.foraMolde?.length) && <details className="rounded-2xl border border-amber-300 bg-amber-50/40 p-3 text-xs dark:bg-amber-950/20">
      <summary className="cursor-pointer font-semibold">Substituicoes anteriores em linhas que nao fazem parte do molde atual ({official?.foraMolde?.length})</summary>
      <p className="mt-2">Estes registros foram preservados e nao sao aplicados a outras linhas.</p>
      <ul className="mt-2 space-y-1">{official?.foraMolde?.map(item => <li key={item.id}>Linha {item.linha} · Tabela {item.tabela || '—'} · Saida {item.saidaGaragem || '—'} · Carro {item.carroSubstituido}</li>)}</ul>
    </details>}
    {official && official.omitidosPadrao > 0 && <p role="status" className="text-xs text-amber-700">{official.omitidosPadrao} alocacoes padrao nao foram aplicadas por conflito com linhas, bloqueios ou frota da garagem.</p>}
    <PreparationOverlay title="Escala aguardando a CI" message={ciPending && <>
      <p>A CI de {official?.contexto.dataOperacao.split('-').reverse().join('/')} ainda não foi finalizada. Finalize a CI desta data para iniciar ou editar a Escala de Carros.</p>
      {official?.ciProvisoria && <p className="mt-2 text-xs">Bloqueios provisórios da CI de {official.ciData.split('-').reverse().join('/')}. A CI da data ainda não foi iniciada.</p>}
    </>}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
      <div className="min-w-0 rounded-3xl border border-border bg-card overflow-hidden self-start">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5"><VehicleAlertIcon aria-hidden="true" className="h-3 w-3 text-rose-600" />Bloqueados CI</span>
            <span className="inline-flex items-center gap-1.5"><VehicleAlertIcon aria-hidden="true" className="h-3 w-3 text-amber-500" />Reforço</span>
            <span className="inline-flex items-center gap-1.5"><VehicleAlertIcon aria-hidden="true" className="h-3 w-3 text-blue-600" />Justificativas</span>
          </div>
          <div role="status" className="ml-auto flex items-center gap-3 whitespace-nowrap font-mono">
            <span>Feito: <strong className="text-[#164E3A] dark:text-emerald-400">{String(completed).padStart(2, '0')}</strong></span>
            <span>Falta: <strong className="text-foreground">{String(remaining).padStart(2, '0')}</strong></span>{suspended > 0 && <span className="text-rose-700">Suspensas: <strong>{suspended}</strong></span>}
          </div>
        </div>
        <div className={cn('overflow-auto', !extended && 'max-h-[515px]')}><table className="w-full text-xs"><thead className="sticky top-0 bg-card z-10"><tr className="border-b bg-muted/50 text-muted-foreground"><th className="p-3 text-left">Linha</th><th className="p-3 text-left">Tabela</th><th className="p-3 text-left">Hr Saida</th><th className="p-3 text-left">Hr Chegada</th><th className="p-3 text-left">Carro fixo</th><th className="p-3 text-left">Carro substituido</th></tr></thead>
          <tbody>{filtered.map(item => <LineRow key={item.id} item={item} official={official} readOnly={readOnly} onSave={onSaveSubstitution} onClear={onClearLine} onEditingChange={onEditingChange} drafts={drafts.current} />)}</tbody></table></div>
        <div className="p-2"><Button type="button" variant="outline" className="w-full text-xs" onClick={() => setExtended(v => !v)}>{extended ? <ChevronUp className="h-3 w-3 mr-2" /> : <ChevronDown className="h-3 w-3 mr-2" />}{extended ? 'Recolher lista' : 'Estender toda a lista'} ({filtered.length} horarios)</Button></div>
      </div>
      <div className="min-w-0 space-y-4">
        <ScaleFleetSidebar state={official} garage={garagem} readOnly={treatmentReadOnly} onReserveSaved={onReserveSaved} />
        {otherCards.filter(card => card.id === 'PORTARIA').map(renderCard)}
        {terminalCards.length > 0 && <div className={surface}>
          <div className="flex items-center justify-between gap-2"><h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"><MapPin aria-hidden="true" className="h-3.5 w-3.5 text-[#164E3A] dark:text-emerald-400" />RESERVA TERMINAL</h3><span className="text-[9px] font-mono text-muted-foreground">Garagem {garagem}</span></div>
          <div className="grid grid-cols-2 gap-2">{terminalCards.map(card => <div key={card.id} className="min-w-0 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-2.5 shadow-2xs transition-colors hover:bg-muted/50 dark:border-border/60 dark:bg-card/90">
            <div className="flex items-start justify-between gap-1"><h4 className="text-[11px] font-bold tracking-tight">{card.titulo.replace(/^TERMINAL /, '')}</h4><button type="button" aria-label={'Definir carro em ' + card.titulo} disabled={readOnly || saving} onClick={() => open(card, card.itens[0])} className={addVehicleButton}><Plus className="h-3 w-3" /></button></div>
            {card.itens.filter(i => i.prefixo).map(i => <div key={i.id} className={cn('flex flex-wrap items-center gap-1 text-[10px] font-mono', official && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600')}><span><CiVehicleNotice state={official} prefixo={i.prefixo} /></span><button type="button" disabled={readOnly || saving} aria-label={'Retirar ' + i.prefixo + ' de ' + card.titulo} onClick={() => void mutate({ card: card.id, operacao: 'remover', prefixo: '', itemId: i.id })}><X className="h-3 w-3" /></button></div>)}
            {card.itens.every(i => !i.prefixo) && <p className="text-[10px] italic text-muted-foreground">Sem carros</p>}
          </div>)}</div>
        </div>}
        {otherCards.filter(card => !['PORTARIA', 'LIMPEZA', 'BORRACHARIA', 'PEDIDOS_GARAGEM'].includes(card.id)).map(renderCard)}
      </div>
    </div>
    </PreparationOverlay>
    {treatment && <ScaleSubstitutionDialog key={treatment.id} prefixo={treatment.prefixo} substituto={treatment.substituto} saving={saving}
      reserveUnavailable={official && blocked(official, treatment.prefixo) ? 'Este carro esta bloqueado e nao pode ir para a reserva.' : undefined}
      onCancel={() => { if (!pending.current) { setTreatment(null); onEditingChange?.('modal-tratamento', false); } }}
      onSave={async retirada => {
        if (treatmentReadOnly || pending.current || !onTreatSubstitution) return;
        pending.current = true; setSaving(true);
        try { if (await onTreatSubstitution(treatment.id, retirada)) { setTreatment(null); onEditingChange?.('modal-tratamento', false); } }
        finally { pending.current = false; setSaving(false); }
      }} />}
    <Dialog open={Boolean(modal)} onOpenChange={open => { if (!open) close(); }}><DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-5 shadow-2xl"><DialogHeader className="space-y-1.5 text-left"><DialogTitle className="flex items-center gap-2 pr-6 text-base font-bold"><Plus className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />{modal?.card.titulo}</DialogTitle><DialogDescription className="text-xs">Selecione o veiculo da garagem ativa para esta data da escala.</DialogDescription></DialogHeader>
      <div className="space-y-2"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground"><Bus className="h-3 w-3" />Prefixo do carro {modal?.card.modo !== 'unico' && <span className="text-rose-500">*</span>}</span><span className="text-[10px] text-muted-foreground">{official?.frota.length ?? 0} veiculos da Garagem {garagem}</span></div><ScaleVehiclePicker placeholder="Carro..." className="h-10 rounded-xl border-border text-left focus:outline-none focus:ring-2 focus:ring-emerald-700/30" label="Carro do card" value={prefixo} onChange={setPrefixo} garage={garagem} disabled={saving}
        renderPrefix={p => <ScaleVehiclePrefix state={official} prefixo={p} />} options={pickerOptions(official, modal?.item ? 'card:' + modal.card.id + ':' + modal.item.id : '')} onConfirm={() => void saveModal()} /></div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3"><Button type="button" variant="ghost" className="rounded-xl text-xs" disabled={saving} onClick={close}>Cancelar</Button><Button type="button" className="rounded-xl bg-[#164E3A] text-xs text-white hover:bg-[#113C2D]" disabled={saving || readOnly} onClick={() => void saveModal()}>{saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Salvar</Button></div>
    </DialogContent></Dialog>
  </div>;
}
function LineRow({ item, official, readOnly, onSave, onClear, onEditingChange, drafts }: { item: FixedScaleRow; official: DailyEscala | null; readOnly: boolean;
  onClear?: (id: string, action?: ScaleLineAction) => Promise<boolean>;
  onSave: (id: string, prefixo: string, retirada?: ScaleWithdrawal) => Promise<boolean>; onEditingChange?: (key: string, dirty: boolean) => void; drafts: Map<string, string> }) {
  const [prefixo, setPrefixo] = useState(drafts.get(item.id) ?? item.carroSubstituido ?? ''), [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const dirty = useRef(drafts.has(item.id)), pending = useRef(false);
  useEffect(() => { if (!dirty.current) setPrefixo(item.carroSubstituido ?? ''); }, [item.carroSubstituido]);
  const ownKey = 'linha:' + item.id;
  const fixedAlert = official && item.carroProgramado ? allocationError(official, item.carroProgramado, ownKey, true) : '';
  const confirmed = Boolean(item.confirmada && !dirty.current && prefixo.trim() === (item.carroSubstituido ?? '')
    && (!official?.bloqueados.includes(prefixo.trim() || item.carroProgramado) || official.usosBloqueadosCI?.some(c => c.linhaId === item.id && c.prefixo === (prefixo.trim() || item.carroProgramado)))
    && !allocationError(official, prefixo.trim() || item.carroProgramado, ownKey, true));
  const confirm = async () => {
    if (readOnly || pending.current) return;
    const p = prefixo.trim(), error = allocationError(official, p || item.carroProgramado, ownKey, true);
    if (error) { toast.error(error); return; }
    pending.current = true; setSaving(true);
    try { if (await onSave(item.id, p)) { dirty.current = false; setEditing(false); drafts.delete(item.id); onEditingChange?.(item.id, false); setPrefixo(p === item.carroProgramado ? '' : p); toast.success('Linha validada e escala salva.'); } }
    finally { pending.current = false; setSaving(false); }
  };
  return <><tr data-confirmada={confirmed ? 'true' : 'false'} className={cn('border-b border-border/60 font-mono', item.suspensa ? 'bg-rose-100 hover:bg-rose-200/70 dark:bg-rose-950/50' : confirmed ? 'bg-emerald-100 hover:bg-emerald-200/70 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/50' : 'hover:bg-muted/30')}><td className="p-3 font-bold">{item.linha}{item.suspensa && <span className="ml-2 font-sans text-xs text-rose-700">Suspensa</span>}</td><td className="p-3">{item.tabela}</td><td className="p-3">{item.saidaGaragem}</td><td className="p-3">{item.chegadaGaragem || '\u2014'}</td>
    <td className="p-3 font-bold"><CiVehicleNotice state={official} prefixo={item.carroProgramado || '\u2014'} warning={fixedAlert || undefined}><ScaleVehiclePrefix state={official} prefixo={item.carroProgramado || '\u2014'} struck={Boolean(item.carroProgramado && item.carroSubstituido && item.carroSubstituido !== item.carroProgramado)} /></CiVehicleNotice></td>
    <td className="p-2"><div className="flex items-center gap-2"><CiVehicleNotice hideIcon state={official} prefixo={prefixo.trim()} warning={prefixo.trim() ? allocationError(official, prefixo.trim(), ownKey, true) || undefined : undefined}><ScaleVehiclePicker label={'Carro substituido da Linha ' + item.linha + ' Tabela ' + item.tabela} value={prefixo} placeholder={item.carroSubstituido === '' ? 'Sem carro' : undefined} disabled={readOnly || saving || item.suspensa}
      garage={official?.contexto.garagem ?? ''} allowCiConfirmation options={pickerOptions(official, ownKey, true)}
      onChange={value => { dirty.current = true; drafts.set(item.id, value); onEditingChange?.(item.id, true); setPrefixo(value); }} onConfirm={() => void confirm()}
      renderPrefix={p => <span className="relative inline-flex"><ScaleVehiclePrefix state={official} prefixo={p} />{p === prefixo.trim() && <VehicleNoticeIcons {...vehicleNoticeFlags(official, p)} />}</span>} className="h-7 w-24 py-0 text-center" /></CiVehicleNotice>
      <button type="button" aria-label={(confirmed ? 'Linha confirmada ' : 'Confirmar linha ') + item.linha + ' tabela ' + item.tabela} title={confirmed ? 'Linha confirmada para esta data' : 'Confirmar linha'} disabled={readOnly || saving || confirmed || item.suspensa} onClick={() => void confirm()} className={cn('h-7 w-7 inline-flex items-center justify-center rounded-full', 'bg-[#164E3A] text-white', (readOnly || saving || confirmed) && 'opacity-40 cursor-not-allowed')}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
      {onClear && !readOnly && <LineActionsMenu label={`${item.linha} tabela ${item.tabela}`} suspended={item.suspensa} disabled={saving} canClear={Boolean(item.carroProgramado) || item.carroSubstituido !== ''}
        onAction={async action => {
          const message = action === 'suspender-linha' ? 'Suspender esta linha? O carro ser\u00e1 retirado e ela contar\u00e1 como resolvida para finalizar.' : action === 'reativar-linha' ? 'Reativar esta linha? Ela ficar\u00e1 pendente, sem carro e sem confirma\u00e7\u00e3o.' : 'Limpar esta linha? O substituto sera retirado e o fixo voltara a linha, sem confirmacao. Destinos gerados pela troca serao desfeitos; bloqueios independentes serao mantidos.';
          if (pending.current || !window.confirm(message)) return;
          pending.current = true; setSaving(true);
          try { if (await onClear(item.id, action)) { dirty.current = false; drafts.delete(item.id); onEditingChange?.(item.id, false); setEditing(false); setPrefixo(''); toast.success('Linha atualizada.'); } }
          finally { pending.current = false; setSaving(false); }
        }} />}
      {confirmed && !readOnly && <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-border hover:bg-muted" aria-label={'Editar linha ' + item.linha + ' tabela ' + item.tabela} title="Editar carro desta linha" disabled={saving} onClick={event => {
        dirty.current = true; drafts.set(item.id, prefixo); onEditingChange?.(item.id, true); setEditing(true);
        const input = event.currentTarget.closest('tr')?.querySelector<HTMLInputElement>('input[role="combobox"]'); input?.focus(); input?.click();
      }}><Pencil className="h-3.5 w-3.5" /></button>}
      {editing && !readOnly && <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-border hover:bg-muted" aria-label={'Cancelar edição da linha ' + item.linha} disabled={saving} onClick={() => {
        dirty.current = false; drafts.delete(item.id); onEditingChange?.(item.id, false); setPrefixo(item.carroSubstituido ?? ''); setEditing(false);
      }}><X className="h-3.5 w-3.5" /></button>}
    </div></td>
  </tr></>;
}
