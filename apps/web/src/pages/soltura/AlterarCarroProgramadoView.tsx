import { CiVehicleNotice, ciNoticesFor } from './CiVehicleNotice';
import { ScaleVehiclePicker } from './ScaleVehiclePicker';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Search, Plus, Bus, AlertTriangle, Check, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FixedScaleRow } from '@/lib/dailySchedule';
import type { CardMutation, DailyEscala, ScaleCard, ScaleCardItem } from '@/lib/sharedEscala';

interface Props {
  dateControl?: ReactNode;
  readOnly?: boolean; readOnlyReason?: string;
  onEditingChange?: (key: string, dirty: boolean) => void;
  garagem: 'VCG' | 'VCM'; escalaTipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; schedules: FixedScaleRow[];
  official: DailyEscala | null;
  onSaveSubstitution: (id: string, prefixo: string) => Promise<boolean>;
  onSaveCard: (change: CardMutation) => Promise<boolean>;
  onSelectGaragem?: (garage: 'VCG' | 'VCM') => void;
  onSelectEscalaTipo?: (tipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER') => void;
}
const surface = 'rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90';
function blocked(state: DailyEscala, p: string) {
  return state.bloqueados.includes(p) || Boolean(state.cards.find(c => c.id === 'PORTARIA')?.itens.some(i => i.prefixo === p));
}
function allocationError(state: DailyEscala | null, prefixo: string, ownKey: string) {
  if (!state) return 'Consulte a frota e os bloqueios oficiais antes de confirmar.';
  if (!/^\d{1,10}$/.test(prefixo)) return 'Informe um carro substituto valido.';
  if (blocked(state, prefixo)) return 'Carro ' + prefixo + ' esta bloqueado. Informe um substituto livre.';
  if (!state.frota.includes(prefixo)) return 'Carro ' + prefixo + ' nao existe na frota desta garagem.';
  const used = state.ocupacoes.find(o => o.prefixo === prefixo && o.chave !== ownKey);
  return used ? 'Carro ' + prefixo + ' ja utilizado em ' + used.local + '.' : '';
}
export function pickerOptions(state: DailyEscala | null, ownKey: string) {
  return state?.frota.filter(prefixo => !state.ocupacoes.some(o => o.prefixo === prefixo && o.chave.startsWith('linha:'))).map(prefixo => ({ prefixo, blocked: blocked(state, prefixo), unavailable: allocationError(state, prefixo, ownKey) })) ?? [];
}

export function AlterarCarroProgramadoView({ dateControl, readOnly = true, readOnlyReason, onEditingChange, garagem, escalaTipo,
  schedules, official, onSaveSubstitution, onSaveCard, onSelectGaragem, onSelectEscalaTipo }: Props) {
  const [search, setSearch] = useState(''), [extended, setExtended] = useState(false);
  const [modal, setModal] = useState<{ card: ScaleCard; item?: ScaleCardItem } | null>(null);
  const [prefixo, setPrefixo] = useState('');
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
  const colorIds = ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'];
  const garageGroups = official?.reservaPorCor?.grupos ?? colorIds.map(id => ({ id, titulo: id === 'VERMELHO_AZUL' ? 'VERMELHO/AZUL' : id, prefixos: [] as string[] }));
  const otherCards = official?.cards.filter(c => !colorIds.includes(c.id) && !c.id.startsWith('TERMINAL_')) ?? [];
  const terminalCards = official?.cards.filter(c => c.id.startsWith('TERMINAL_')) ?? [];
  const renderCard = (card: ScaleCard) => (
    <div key={card.id} className={cn(surface, 'min-w-0', ['AZUL', 'VERMELHO', 'MICRO'].includes(card.id) && 'p-2')}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className={cn('font-bold text-[11px] uppercase tracking-wider', card.id === 'AZUL' && 'text-sky-600', card.id === 'VERMELHO' && 'text-rose-600', card.id === 'MICRO' && 'text-amber-600')}>{card.titulo} ({card.itens.filter(i => i.prefixo).length})</span>
        {card.modo !== 'rabicho' && <button type="button" disabled={readOnly || saving} title={'Adicionar em ' + card.titulo} aria-label={'Adicionar em ' + card.titulo}
          onClick={() => open(card, card.modo === 'unico' ? card.itens[0] : undefined)} className="h-6 w-6 rounded bg-muted inline-flex items-center justify-center disabled:opacity-40"><Plus className="h-3 w-3" /></button>}
      </div>
      {card.modo === 'rabicho' ? <table className="w-full text-xs font-mono"><thead><tr className="text-muted-foreground"><th className="text-left">Linha</th><th>Tab</th><th>Carro</th></tr></thead>
        <tbody>{card.itens.map(i => <tr key={i.id}><td className="py-2">{i.linha}</td><td className="text-center">{i.tabela}</td><td className="text-right"><button disabled={readOnly || saving} type="button" aria-label={'Definir carro da linha ' + i.linha + ' tabela ' + i.tabela} onClick={() => open(card, i)} className={cn('border rounded px-3 py-1', official && i.prefixo && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600 border-rose-500')}>{i.prefixo || <Plus className="h-3 w-3" />}</button></td></tr>)}</tbody></table>
        : <div className="flex flex-wrap gap-1.5 text-xs font-mono">{card.itens.filter(i => i.prefixo).map(i => <span key={i.id} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-muted/30', official && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600 border-rose-500')}>
          {i.prefixo}{i.horario && <span className="text-muted-foreground"> {i.horario}</span>}
          <button type="button" disabled={readOnly || saving} aria-label={'Retirar ' + i.prefixo + ' de ' + card.titulo} onClick={() => void mutate({ card: card.id, operacao: 'remover', prefixo: '', itemId: i.id })}><X className="h-3 w-3" /></button>
        </span>)}</div>}
      {card.itens.every(i => !i.prefixo) && card.modo !== 'rabicho' && <p className="text-xs italic text-muted-foreground">Nenhum veiculo alocado.</p>}
    </div>
  );
  return <div className="space-y-4 pb-12 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar uma linha..." className="h-10 rounded-2xl border border-border bg-card pl-9 pr-3 text-sm" /></div>
      <div className="flex max-w-full flex-wrap items-center justify-end gap-3 text-xs">
        {dateControl}
        {onSelectGaragem ? <div className="flex gap-1 rounded-full border p-1">{(['VCG', 'VCM'] as const).map(g => <button key={g} type="button" onClick={() => onSelectGaragem(g)} className={cn('rounded-full px-3 py-1', garagem === g && 'bg-[#164E3A] text-white')}>{g}</button>)}</div> : null}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 p-1">{(['SEG_SEX', 'SABADO', 'DOM_FER'] as const).map(t => <button key={t} type="button" onClick={() => onSelectEscalaTipo?.(t)} aria-pressed={escalaTipo === t} className={cn('shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] leading-none transition-colors', escalaTipo === t ? 'bg-card font-semibold text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>{t === 'SEG_SEX' ? 'Seg-Sex' : t === 'SABADO' ? 'Sabado' : 'Dom/Fer'}</button>)}</div>
      </div>
    </div>
    {readOnly && <p role="status" className="text-sm text-muted-foreground">{readOnlyReason}</p>}
    {official && official.omitidosPadrao > 0 && <p role="status" className="text-xs text-amber-700">{official.omitidosPadrao} alocacoes padrao nao foram aplicadas por conflito com linhas, bloqueios ou frota da garagem.</p>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
      <div className="lg:col-span-7 rounded-3xl border border-border bg-card overflow-hidden self-start">
        <div className="border-b px-5 py-3 text-right text-xs text-muted-foreground font-mono">{filtered.length} horarios</div>
        <div className={cn('overflow-auto', !extended && 'max-h-[515px]')}><table className="w-full text-xs"><thead className="sticky top-0 bg-card z-10"><tr className="border-b bg-muted/50 text-muted-foreground"><th className="p-3 text-left">Linha</th><th className="p-3 text-left">Tabela</th><th className="p-3 text-left">Hr Saida</th><th className="p-3 text-left">Hr Chegada</th><th className="p-3 text-left">Carro fixo</th><th className="p-3 text-left">Carro substituido</th></tr></thead>
          <tbody>{filtered.map(item => <LineRow key={item.id} item={item} official={official} readOnly={readOnly} onSave={onSaveSubstitution} onEditingChange={onEditingChange} drafts={drafts.current} />)}</tbody></table></div>
        <div className="p-2"><Button type="button" variant="outline" className="w-full text-xs" onClick={() => setExtended(v => !v)}>{extended ? <ChevronUp className="h-3 w-3 mr-2" /> : <ChevronDown className="h-3 w-3 mr-2" />}{extended ? 'Recolher lista' : 'Estender toda a lista'} ({filtered.length} horarios)</Button></div>
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className={surface}><h3 className="text-center text-xs font-bold border-b pb-2">RESERVA GARAGEM {garagem}</h3>
          {official && !official.reservaPorCor?.updatedAt && <p role="status" className="text-xs text-amber-700">Cache de cores indisponivel. A classificacao da reserva aguarda uma atualizacao valida.</p>}
          <div className="grid grid-cols-3 gap-2">{garageGroups.map(group => <div key={group.id} className="min-w-0 rounded-xl border border-border bg-muted/10 p-2 space-y-2">
            <h4 className={cn('border-b border-border pb-2 text-[10px] font-bold break-words', group.id === 'AZUL' && 'text-sky-600', group.id === 'VERMELHO' && 'text-rose-600', group.id === 'MICRO' && 'text-amber-600', group.id === 'PRATA' && 'text-slate-500')}>{group.id === 'VERMELHO_AZUL' ? <><span className="text-rose-600">VERMELHO/</span><span className="text-sky-600">AZUL ({group.prefixos.length})</span></> : <>{group.titulo} ({group.prefixos.length})</>}</h4>
            <div className="flex flex-wrap gap-1">{group.prefixos.map(prefixo => <span key={prefixo} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-mono"><CiVehicleNotice state={official} prefixo={prefixo} /></span>)}</div>
            {!group.prefixos.length && <p className="text-[10px] italic text-muted-foreground">Sem carros</p>}
          </div>)}</div>
        </div>
        <div className={cn(surface, 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10')}><h3 className="text-xs font-bold text-rose-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> BLOQUEADOS CI {official?.ciData ?? ''}</h3>
          <div className="flex flex-wrap gap-1 text-xs font-mono">{official?.bloqueados.map(p => <span key={p} className="rounded-full border border-rose-300 px-2 py-0.5 text-rose-600">{p}</span>)}</div>
        </div>
        {otherCards.filter(card => card.id === 'PORTARIA').map(renderCard)}
        {terminalCards.length > 0 && <div className={surface}>
          <h3 className="text-xs font-bold">RESERVA TERMINAL</h3>
          <div className="grid grid-cols-2 gap-2">{terminalCards.map(card => <div key={card.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-muted/20 p-2.5">
            <div className="flex items-start justify-between gap-1"><h4 className="text-[11px] font-semibold">{card.titulo.replace(/^TERMINAL /, '')}</h4><button type="button" aria-label={'Definir carro em ' + card.titulo} disabled={readOnly || saving} onClick={() => open(card, card.itens[0])} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground disabled:opacity-40"><Plus className="h-3 w-3" /></button></div>
            {card.itens.filter(i => i.prefixo).map(i => <div key={i.id} className={cn('flex flex-wrap items-center gap-1 text-[10px] font-mono', official && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600')}><span><CiVehicleNotice state={official} prefixo={i.prefixo} /></span><button type="button" disabled={readOnly || saving} aria-label={'Retirar ' + i.prefixo + ' de ' + card.titulo} onClick={() => void mutate({ card: card.id, operacao: 'remover', prefixo: '', itemId: i.id })}><X className="h-3 w-3" /></button></div>)}
            {card.itens.every(i => !i.prefixo) && <p className="text-[10px] italic text-muted-foreground">Sem carros</p>}
          </div>)}</div>
        </div>}
        {otherCards.filter(card => !['PORTARIA', 'LIMPEZA', 'BORRACHARIA', 'PEDIDOS_GARAGEM'].includes(card.id)).map(renderCard)}
      </div>
    </div>
    <Dialog open={Boolean(modal)} onOpenChange={open => { if (!open) close(); }}><DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-5 shadow-2xl"><DialogHeader className="space-y-1.5 text-left"><DialogTitle className="flex items-center gap-2 pr-6 text-base font-bold"><Plus className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />{modal?.card.titulo}</DialogTitle><DialogDescription className="text-xs">Selecione o veiculo da garagem ativa para esta data da escala.</DialogDescription></DialogHeader>
      <div className="space-y-2"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground"><Bus className="h-3 w-3" />Prefixo do carro {modal?.card.modo !== 'unico' && <span className="text-rose-500">*</span>}</span><span className="text-[10px] text-muted-foreground">{official?.frota.length ?? 0} veiculos da Garagem {garagem}</span></div><ScaleVehiclePicker placeholder="Carro..." className="h-10 rounded-xl border-border text-left focus:outline-none focus:ring-2 focus:ring-emerald-700/30" label="Carro do card" value={prefixo} onChange={setPrefixo} garage={garagem} disabled={saving}
        options={pickerOptions(official, modal?.item ? 'card:' + modal.card.id + ':' + modal.item.id : '')} onConfirm={() => void saveModal()} /></div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3"><Button type="button" variant="ghost" className="rounded-xl text-xs" disabled={saving} onClick={close}>Cancelar</Button><Button type="button" className="rounded-xl bg-[#164E3A] text-xs text-white hover:bg-[#113C2D]" disabled={saving || readOnly} onClick={() => void saveModal()}>{saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Salvar</Button></div>
    </DialogContent></Dialog>
  </div>;
}
function LineRow({ item, official, readOnly, onSave, onEditingChange, drafts }: { item: FixedScaleRow; official: DailyEscala | null; readOnly: boolean;
  onSave: (id: string, prefixo: string) => Promise<boolean>; onEditingChange?: (key: string, dirty: boolean) => void; drafts: Map<string, string> }) {
  const [prefixo, setPrefixo] = useState(drafts.get(item.id) ?? item.carroSubstituido ?? ''), [saving, setSaving] = useState(false);
  const dirty = useRef(drafts.has(item.id)), pending = useRef(false);
  useEffect(() => { if (!dirty.current) setPrefixo(item.carroSubstituido ?? ''); }, [item.carroSubstituido]);
  const ownKey = 'linha:' + item.id;
  const fixedAlert = official ? allocationError(official, item.carroProgramado, ownKey) : '';
  const substituteNotice = prefixo.trim() && !allocationError(official, prefixo.trim(), ownKey) && ciNoticesFor(official, prefixo.trim()).length > 0;
  const confirmed = Boolean(item.confirmada && !dirty.current && prefixo.trim() === (item.carroSubstituido ?? '')
    && !allocationError(official, prefixo.trim() || item.carroProgramado, ownKey));
  const confirm = async () => {
    if (readOnly || pending.current) return;
    const p = prefixo.trim(), error = allocationError(official, p || item.carroProgramado, ownKey);
    if (error) { toast.error(error); return; }
    pending.current = true; setSaving(true);
    try { if (await onSave(item.id, p)) { dirty.current = false; drafts.delete(item.id); onEditingChange?.(item.id, false); setPrefixo(p === item.carroProgramado ? '' : p); toast.success('Linha validada e escala salva.'); } }
    finally { pending.current = false; setSaving(false); }
  };
  return <tr data-confirmada={confirmed ? 'true' : 'false'} className={cn('border-b border-border/60 font-mono', confirmed ? 'bg-emerald-100 hover:bg-emerald-200/70 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/50' : 'hover:bg-muted/30')}><td className="p-3 font-bold">{item.linha}</td><td className="p-3">{item.tabela}</td><td className="p-3">{item.saidaGaragem}</td><td className="p-3">{item.chegadaGaragem || '\u2014'}</td>
    <td className={cn('p-3 font-bold', fixedAlert && 'text-rose-600 bg-rose-50/50 dark:bg-rose-950/20')} title={fixedAlert}><span className="inline-flex items-center gap-1">{fixedAlert ? item.carroProgramado || '\u2014' : <CiVehicleNotice state={official} prefixo={item.carroProgramado || '\u2014'} />}{fixedAlert && <AlertTriangle aria-label={fixedAlert} className="h-3.5 w-3.5" />}</span></td>
    <td className="p-2"><div className="flex items-center gap-2"><ScaleVehiclePicker label={'Carro substituido da Linha ' + item.linha + ' Tabela ' + item.tabela} value={prefixo} disabled={readOnly || saving}
      garage={official?.contexto.garagem ?? ''} options={pickerOptions(official, ownKey)}
      onChange={value => { dirty.current = true; drafts.set(item.id, value); onEditingChange?.(item.id, true); setPrefixo(value); }} onConfirm={() => void confirm()}
      className={cn('h-7 w-24 py-0 text-center', prefixo.trim() && allocationError(official, prefixo.trim(), ownKey) && 'border-rose-500 text-rose-600', substituteNotice && 'border-amber-400 text-amber-500')} />
      {substituteNotice && <CiVehicleNotice state={official} prefixo={prefixo.trim()} iconOnly />}
      <button type="button" aria-label={(confirmed ? 'Linha confirmada ' : 'Confirmar linha ') + item.linha + ' tabela ' + item.tabela} title={confirmed ? 'Linha confirmada para esta data' : 'Confirmar linha'} disabled={readOnly || saving || confirmed} onClick={() => void confirm()} className={cn('h-7 w-7 inline-flex items-center justify-center rounded-full', 'bg-[#164E3A] text-white', (readOnly || saving || confirmed) && 'opacity-40 cursor-not-allowed')}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
    </div></td>
  </tr>;
}
