import { useState, useEffect, useRef } from 'react';
import { Search, Plus, AlertTriangle, Check, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FixedScaleRow } from '@/lib/dailySchedule';
import type { CardMutation, DailyEscala, ScaleCard, ScaleCardItem } from '@/lib/sharedEscala';

interface Props {
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
function optionsFor(state: DailyEscala | null, ownKey: string) {
  return state?.frota.filter(p => !blocked(state, p) && !state.ocupacoes.some(o => o.prefixo === p && o.chave !== ownKey)) ?? [];
}

export function AlterarCarroProgramadoView({ readOnly = true, readOnlyReason, onEditingChange, garagem, escalaTipo,
  schedules, official, onSaveSubstitution, onSaveCard, onSelectGaragem, onSelectEscalaTipo }: Props) {
  const [search, setSearch] = useState(''), [extended, setExtended] = useState(false);
  const [modal, setModal] = useState<{ card: ScaleCard; item?: ScaleCardItem } | null>(null);
  const [prefixo, setPrefixo] = useState(''), [linha, setLinha] = useState(''), [tabela, setTabela] = useState('');
  const [saving, setSaving] = useState(false); const pending = useRef(false);
  const drafts = useRef(new Map<string, string>());
  const open = (card: ScaleCard, item?: ScaleCardItem) => {
    if (readOnly) return;
    setModal({ card, item }); setPrefixo(item?.prefixo ?? ''); setLinha(''); setTabela(''); onEditingChange?.('modal-card', true);
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
    if (modal.card.modo === 'rabicho' && !modal.item && (!linha.trim() || !tabela.trim())) { toast.error('Informe linha e tabela.'); return; }
    if (await mutate({ card: modal.card.id, operacao: modal.item ? 'definir' : 'adicionar', prefixo: p,
      itemId: modal.item?.id, linha: linha.trim() || undefined, tabela: tabela.trim() || undefined })) {
      setModal(null); onEditingChange?.('modal-card', false); toast.success('Card salvo para esta data.');
    }
  };
  const filtered = schedules.filter(s => [s.linha, s.tabela, s.carroProgramado, s.carroSubstituido ?? ''].some(v => v.toLowerCase().includes(search.trim().toLowerCase())));
  const garageCards = official?.cards.filter(c => ['AZUL', 'VERMELHO', 'MICRO'].includes(c.id)) ?? [];
  const otherCards = official?.cards.filter(c => !['AZUL', 'VERMELHO', 'MICRO'].includes(c.id)) ?? [];
  const renderCard = (card: ScaleCard) => (
    <div key={card.id} className={surface}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className={cn('font-bold text-[11px] uppercase tracking-wider', card.id === 'AZUL' && 'text-sky-600', card.id === 'VERMELHO' && 'text-rose-600', card.id === 'MICRO' && 'text-amber-600')}>{card.titulo} ({card.itens.filter(i => i.prefixo).length})</span>
        <button type="button" disabled={readOnly || saving} title={'Adicionar em ' + card.titulo} aria-label={'Adicionar em ' + card.titulo}
          onClick={() => open(card, card.modo === 'unico' ? card.itens[0] : undefined)} className="h-6 w-6 rounded bg-muted inline-flex items-center justify-center disabled:opacity-40"><Plus className="h-3 w-3" /></button>
      </div>
      {card.modo === 'rabicho' ? <table className="w-full text-xs font-mono"><thead><tr className="text-muted-foreground"><th className="text-left">Linha</th><th>Tab</th><th>Carro</th></tr></thead>
        <tbody>{card.itens.map(i => <tr key={i.id}><td className="py-2">{i.linha}</td><td className="text-center">{i.tabela}</td><td className="text-right"><button disabled={readOnly || saving} type="button" onClick={() => open(card, i)} className={cn('border rounded px-3 py-1', official && i.prefixo && allocationError(official, i.prefixo, 'card:' + card.id + ':' + i.id) && 'text-rose-600 border-rose-500')}>{i.prefixo || '\u2014'}</button></td></tr>)}</tbody></table>
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
      <div className="flex gap-2 text-xs">
        {onSelectGaragem ? <div className="flex gap-1 rounded-full border p-1">{(['VCG', 'VCM'] as const).map(g => <button key={g} type="button" onClick={() => onSelectGaragem(g)} className={cn('rounded-full px-3 py-1', garagem === g && 'bg-[#164E3A] text-white')}>{g}</button>)}</div> : <span className="rounded-full bg-[#164E3A] px-3 py-2 text-white">Garagem {garagem}</span>}
        <div className="flex gap-1 rounded-full border p-1">{(['SEG_SEX', 'SABADO', 'DOM_FER'] as const).map(t => <button key={t} type="button" onClick={() => onSelectEscalaTipo?.(t)} className={cn('rounded-full px-3 py-1', escalaTipo === t && 'bg-muted font-semibold')}>{t === 'SEG_SEX' ? 'Seg-Sex' : t === 'SABADO' ? 'Sabado' : 'Dom/Fer'}</button>)}</div>
      </div>
    </div>
    {readOnly && <p role="status" className="text-sm text-muted-foreground">{readOnlyReason}</p>}
    {official && official.omitidosPadrao > 0 && <p role="status" className="text-xs text-amber-700">{official.omitidosPadrao} alocacoes padrao nao foram aplicadas por conflito com linhas, bloqueios ou frota da garagem.</p>}
    <datalist id="escala-frota-opcoes">{official?.reserva.map(p => <option key={p} value={p} />)}</datalist>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
      <div className="lg:col-span-7 rounded-3xl border border-border bg-card overflow-hidden self-start">
        <div className="border-b px-5 py-3 text-right text-xs text-muted-foreground font-mono">{filtered.length} horarios</div>
        <div className={cn('overflow-auto', !extended && 'max-h-[515px]')}><table className="w-full text-xs"><thead className="sticky top-0 bg-card z-10"><tr className="border-b bg-muted/50 text-muted-foreground"><th className="p-3 text-left">Linha</th><th className="p-3 text-left">Tabela</th><th className="p-3 text-left">Hr Saida</th><th className="p-3 text-left">Hr Chegada</th><th className="p-3 text-left">Carro fixo</th><th className="p-3 text-left">Carro substituido</th></tr></thead>
          <tbody>{filtered.map(item => <LineRow key={item.id} item={item} official={official} readOnly={readOnly} onSave={onSaveSubstitution} onEditingChange={onEditingChange} drafts={drafts.current} />)}</tbody></table></div>
        <div className="p-2"><Button type="button" variant="outline" className="w-full text-xs" onClick={() => setExtended(v => !v)}>{extended ? <ChevronUp className="h-3 w-3 mr-2" /> : <ChevronDown className="h-3 w-3 mr-2" />}{extended ? 'Recolher lista' : 'Estender toda a lista'} ({filtered.length} horarios)</Button></div>
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className={surface}><h3 className="text-center text-xs font-bold border-b pb-2">GARAGEM {garagem}</h3>{garageCards.map(renderCard)}</div>
        <div className={cn(surface, 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10')}><h3 className="text-xs font-bold text-rose-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> BLOQUEADOS CI {official?.ciData ?? ''}</h3>
          <div className="flex flex-wrap gap-1 text-xs font-mono">{official?.bloqueados.map(p => <span key={p} className="rounded-full border border-rose-300 px-2 py-0.5 text-rose-600">{p}</span>)}</div>
          <p className="text-xs text-muted-foreground">{official ? official.bloqueados.length + ' carros bloqueados nesta CI e garagem.' : 'Consulta oficial indisponivel.'}</p>
        </div>
        {otherCards.map(renderCard)}
        <div className={surface}><h3 className="font-bold text-xs border-b pb-2">RESERVA ({official?.reserva.length ?? 0})</h3>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">{official?.reserva.map(p => <span key={p} className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">{p}</span>)}</div>
          <p className="text-xs text-muted-foreground">Frota oficial da garagem sem ocupacao nas linhas ou cards e sem bloqueio.</p>
        </div>
        <div className={surface}><h3 className="font-bold text-xs text-center border-b pb-2">TOTAL DE CARROS</h3>
          <dl className="text-xs space-y-2"><div className="flex justify-between"><dt>Linhas</dt><dd>{schedules.length}</dd></div>
            <div className="flex justify-between"><dt>Alocados nos cards</dt><dd>{official?.cards.reduce((n, c) => n + c.itens.filter(i => i.prefixo).length, 0) ?? 0}</dd></div>
            <div className="flex justify-between"><dt>Reserva livre</dt><dd>{official?.reserva.length ?? 0}</dd></div></dl>
        </div>
      </div>
    </div>
    <Dialog open={Boolean(modal)} onOpenChange={open => { if (!open) close(); }}><DialogContent><DialogHeader><DialogTitle>{modal?.card.titulo}</DialogTitle></DialogHeader>
      {modal?.card.modo === 'rabicho' && !modal.item && <div className="flex gap-2"><input disabled={saving} aria-label="Linha" placeholder="Linha" value={linha} onChange={e => setLinha(e.target.value)} className="w-1/2 rounded border bg-background p-2" /><input disabled={saving} aria-label="Tabela" placeholder="Tabela" value={tabela} onChange={e => setTabela(e.target.value)} className="w-1/2 rounded border bg-background p-2" /></div>}
      <label className="text-sm">Carro<input aria-label="Carro do card" list="escala-card-frota" value={prefixo} onChange={e => setPrefixo(e.target.value)} inputMode="numeric" maxLength={10} disabled={saving} className="mt-1 w-full rounded border bg-background p-2" /></label>
      <datalist id="escala-card-frota">{optionsFor(official, modal?.item ? 'card:' + modal.card.id + ':' + modal.item.id : '').map(p => <option key={p} value={p} />)}</datalist>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={close}>Cancelar</Button><Button type="button" disabled={saving || readOnly} onClick={() => void saveModal()}>Salvar</Button></div>
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
    <td className={cn('p-3 font-bold', fixedAlert && 'text-rose-600 bg-rose-50/50 dark:bg-rose-950/20')} title={fixedAlert}><span className="inline-flex items-center gap-1">{item.carroProgramado || '\u2014'}{fixedAlert && <AlertTriangle aria-label={fixedAlert} className="h-3.5 w-3.5" />}</span></td>
    <td className="p-2"><div className="flex items-center gap-2"><input aria-label={'Carro substituido da Linha ' + item.linha + ' Tabela ' + item.tabela} value={prefixo} list="escala-frota-opcoes" disabled={readOnly || saving} inputMode="numeric" maxLength={10}
      onChange={e => { dirty.current = true; drafts.set(item.id, e.target.value); onEditingChange?.(item.id, true); setPrefixo(e.target.value); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void confirm(); } }} className={cn("h-7 w-20 rounded-full border bg-background text-center text-xs", prefixo.trim() && allocationError(official, prefixo.trim(), ownKey) && "border-rose-500 text-rose-600")} />
      <button type="button" aria-label={(confirmed ? 'Linha confirmada ' : 'Confirmar linha ') + item.linha + ' tabela ' + item.tabela} title={confirmed ? 'Linha confirmada para esta data' : 'Confirmar linha'} disabled={readOnly || saving || confirmed} onClick={() => void confirm()} className={cn('h-7 w-7 inline-flex items-center justify-center rounded-full', 'bg-[#164E3A] text-white', (readOnly || saving || confirmed) && 'opacity-40 cursor-not-allowed')}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
    </div></td>
  </tr>;
}
