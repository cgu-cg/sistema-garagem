import { changeTrafficDate, editDatedTraffic, editRecurringTraffic, trafficEditorPayload, type TrafficEditorDraft } from '@/lib/trafficEditor';
import { useEffect, useRef, useState } from 'react';
import { Bus, CalendarClock, Plus, Pencil, Trash2, ArrowLeft, Save, Check, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';
import { defaultScheduleSelection } from '@/lib/scheduleSelection';
import { type TrafficCommand, type TrafficModelCommand, type TrafficRow } from '@/lib/trafficSchema';
import { maintenanceOperationId } from '@/lib/maintenanceCompatibility';
import { copyTrafficBase, sameDayReleaseBases } from '@/lib/trafficBases';
import { confirmTrafficRow, moveTrafficRow, renumberTrafficRows } from '@/lib/trafficRowEditing';
import { useTrafficRowDrag } from '@/lib/useTrafficRowDrag';
import { ZodError } from 'zod';
import { trafficScaleLinkOptions } from '@/lib/trafficScaleLinks';

type Model = Omit<TrafficModelCommand, 'funcionamento'> & { chave: string };
type Catalog = { padroes: Model[]; excecoes: TrafficCommand[] };
const days = { SEG_SEX: 'Seg–Sex', SABADO: 'Sábado', DOM_FER: 'Dom/Fer' };
const card = 'min-w-0 rounded-2xl border bg-card p-5';
const select = 'h-10 w-full rounded-md border bg-background px-3 text-sm';
const fields = [
  ['ordem', 'Ordem'], ['linha', 'Linha'], ['tabela', 'Tabela'], ['carroProgramado', 'Carro fixo / programado'],
  ['saidaGaragem', 'Hr saída'], ['chegadaGaragem', 'Hr chegada'],
] as const;
function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}
function blankDate() { const date = new Date(today() + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); }

export function TrafegoPage() {
  const user = useAuth(s => s.user);
  const [garagem, setGaragem] = useState<'VCG' | 'VCM'>(user?.garagem === 'VCM' ? 'VCM' : 'VCG');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<'ESCALA' | 'SOLTURA'>('ESCALA');
  const [name, setName] = useState('');
  const [date, setDate] = useState(blankDate);
  const [turn, setTurn] = useState<'MATUTINO' | 'VESPERTINO'>('MATUTINO');
  const [base, setBase] = useState('');
  const [createMode, setCreateMode] = useState<'DATA' | 'RECORRENTE'>('DATA');
  const [createDays, setCreateDays] = useState<TrafficCommand['contexto']['escalaTipo']>('SEG_SEX');
  const [draft, setDraft] = useState<TrafficEditorDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingRows, setPendingRows] = useState<Set<string>>(new Set());
  const [rowNotice, setRowNotice] = useState('');
  const request = useRef(0);
  const addedRow = useRef<string | null>(null);
  function beginEdit(next: TrafficEditorDraft, changed = false) {
    setDraft(next); setDirty(changed); setPendingRows(new Set()); setRowNotice('');
  }
  function moveRowTo(id: string, position: number) {
    if (!draft || saving) return;
    const next = moveTrafficRow(draft.itens, id, position);
    if (next === draft.itens) return;
    setDraft({ ...draft, itens: next }); setDirty(true);
    setRowNotice(`Linha movida para a posição ${next.findIndex(row => row.id === id) + 1}. Salve a programação para gravar.`);
  }
  const rowDrag = useTrafficRowDrag(Boolean(draft && !saving), (id, target) => {
    if (draft) moveRowTo(id, draft.itens.findIndex(row => row.id === target));
  }, (id, step) => { if (draft) moveRowTo(id, draft.itens.findIndex(row => row.id === id) + step); });
  async function load() {
    const id = ++request.current; setLoading(true); setError('');
    try { const data = await api.get<Catalog>('/trafego/programacoes', { params: { garagem } }); if (request.current === id) setCatalog(data); }
    catch (e) { if (request.current === id) { setCatalog(null); setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); } }
    finally { if (request.current === id) setLoading(false); }
  }
  useEffect(() => { void load(); return () => { request.current++; }; }, [garagem]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function create(model?: Model) {
    setKind(model?.tipo ?? 'ESCALA'); setName(''); setDate(blankDate()); setTurn(model?.contexto.turno === 'VESPERTINO' ? 'VESPERTINO' : 'MATUTINO');
    setBase(model?.chave ?? ''); setCreateMode('DATA'); setCreating(true);
  }
  function openModel(item: Model) {
    try { beginEdit(editRecurringTraffic(item, maintenanceOperationId)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o modelo.'); }
  }
  function scaleLinkDescription(item: Model | TrafficCommand) {
    if (item.origemCarros !== 'ESCALA' || item.contexto.turno === 'VESPERTINO') return 'Sem vínculo';
    const dataOperacao = 'dataOperacao' in item.contexto ? item.contexto.dataOperacao : '';
    const options = trafficScaleLinkOptions(catalog, { ...item,
      funcionamento: dataOperacao ? 'DATA' : 'RECORRENTE',
      contexto: { ...item.contexto, dataOperacao },
    });
    return options[0]?.label ?? 'Indisponível no catálogo';
  }
  const bases = catalog ? [
    ...catalog.padroes.filter(p => p.contexto.garagem === garagem && (p.tipo === kind || kind === 'SOLTURA' && p.tipo === 'ESCALA')).map(p => ({ key: p.chave, label: `${p.tipo === 'ESCALA' ? 'Escala de Carros' : 'Soltura'}: ${p.nome}`, itens: p.itens })),
    ...catalog.excecoes.filter(p => p.contexto.garagem === garagem && (p.tipo === kind || kind === 'SOLTURA' && p.tipo === 'ESCALA')).map((p, i) => ({ key: `excecao-${i}`, label: `${p.tipo === 'ESCALA' ? 'Escala de Carros' : 'Soltura'}: ${p.nome} · ${p.contexto.dataOperacao}`, itens: p.itens })),
    ...(kind === 'ESCALA' && createMode === 'DATA' ? sameDayReleaseBases(catalog.excecoes, garagem, date) : []),
  ] : [];
  function begin() {
    if (!name.trim() || createMode === 'DATA' && !date) { toast.error('Informe o nome e a data.'); return; }
    const dayType = createMode === 'DATA' ? defaultScheduleSelection(date).dayType : createDays;
    const source = bases.find(b => b.key === base);
    if (base && !source) { toast.error('Selecione novamente a base para a data escolhida.'); return; }
    beginEdit({ tipo: kind, nome: name.trim(), revisao: 0, funcionamento: createMode,
      contexto: { garagem, escalaTipo: dayType, turno: dayType === 'SEG_SEX' ? kind === 'ESCALA' ? 'MATUTINO' : turn : 'PADRAO', dataOperacao: createMode === 'DATA' ? date : '' },
      itens: source ? copyTrafficBase(source.itens, maintenanceOperationId).map(row => ({ ...row,
        carroProgramado: kind === 'SOLTURA' && turn === 'VESPERTINO' && dayType === 'SEG_SEX' ? '' : row.carroProgramado })) : [] }, true);
    setDirty(true); setCreating(false);
  }
  function update(rowId: string, key: keyof TrafficRow, value: string) {
    setDraft(current => current && ({ ...current, itens: current.itens.map(row => row.id !== rowId ? row : {
      ...row, [key]: key === 'ordem' ? value === '' ? undefined : Number(value) : value,
    }) })); setPendingRows(current => new Set(current).add(rowId)); setDirty(true);
  }
  function confirmRow(id: string) {
    if (!draft || saving) return;
    try {
      setDraft({ ...draft, itens: confirmTrafficRow(draft.itens, id) });
      setPendingRows(current => { const next = new Set(current); next.delete(id); return next; });
      setRowNotice('Linha confirmada. Clique em Salvar programação para gravar no banco.');
    } catch (e) { toast.error(e instanceof ZodError ? e.issues[0].message : e instanceof Error ? e.message : 'Revise os campos da linha.'); }
  }
  function removeRow(id: string) {
    if (!draft || saving || !window.confirm('Excluir esta viagem da programação?')) return;
    setDraft({ ...draft, itens: renumberTrafficRows(draft.itens.filter(row => row.id !== id)) });
    setPendingRows(current => { const next = new Set(current); next.delete(id); return next; }); setDirty(true);
  }
  async function save() {
    if (!draft) return;
    if (draft.itens.some(row => pendingRows.has(row.id))) { toast.error('Confirme as linhas alteradas no botão de confirmação antes de salvar.'); return; }
    let payload;
    try { payload = trafficEditorPayload(draft); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Dados invalidos.'); return; }
    setSaving(true);
    try {
      if ('funcionamento' in payload) {
        const saved = await api.post<TrafficModelCommand>('/trafego/programacoes', payload);
        setDraft(editRecurringTraffic(saved));
      } else {
        const saved = await api.post<TrafficCommand>('/trafego/programacoes', payload);
        setDraft(editDatedTraffic(saved));
      }
      setDirty(false); setPendingRows(new Set()); setRowNotice(''); toast.success('Programa\u00e7\u00e3o salva.'); await load();
    }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }
  function back() { if (dirty && !window.confirm('Descartar alterações não salvas?')) return; setDraft(null); setDirty(false); setPendingRows(new Set()); setRowNotice(''); }
  function changeFunction(mode: 'RECORRENTE' | 'DATA') {
    if (!draft || draft.funcionamento === mode) return;
    try {
      const copy = { ...draft, funcionamento: mode, revisao: 0, origem: undefined,
        itens: copyTrafficBase(draft.itens, maintenanceOperationId) };
      setDraft(mode === 'DATA' ? changeTrafficDate(copy, blankDate()) : { ...copy, contexto: { ...copy.contexto, dataOperacao: '' } });
      setPendingRows(current => new Set(copy.itens.filter((_, index) => current.has(draft.itens[index].id)).map(row => row.id)));
      setDirty(true);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível copiar.'); }
  }

  const rowFields = fields.filter(([key]) => key !== 'carroProgramado' || draft?.tipo !== 'SOLTURA' || draft.contexto.turno !== 'VESPERTINO' && draft.origemCarros !== 'ESCALA');
  const scaleLinks = trafficScaleLinkOptions(catalog, draft);
  if (draft) return <main className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Button variant="ghost" onClick={back} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button><h1 className="mt-2 text-2xl font-bold">Editar {draft.tipo === 'ESCALA' ? 'escala' : 'soltura'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{draft.contexto.garagem} · {draft.funcionamento === 'RECORRENTE' ? 'Recorrente' : draft.contexto.dataOperacao.split('-').reverse().join('/')} · {days[draft.contexto.escalaTipo]} · {draft.contexto.turno.toLowerCase()} · {draft.itens.length} viagens</p></div>
      <Button onClick={() => void save()} disabled={saving || !dirty || draft.itens.some(row => pendingRows.has(row.id))} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]"><Save className="mr-2 h-4 w-4" />{saving ? 'Salvando…' : 'Salvar programação'}</Button>
    </header>
    <section className={card}><label className="text-sm font-medium" htmlFor="traffic-name">Nome</label><Input id="traffic-name" value={draft.nome} maxLength={150} disabled={saving} onChange={e => { setDraft({ ...draft, nome: e.target.value }); setDirty(true); }} />
      <fieldset disabled={saving} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm"><span>Funcionamento</span><select className={select} value={draft.funcionamento} onChange={e => changeFunction(e.target.value as 'RECORRENTE' | 'DATA')}><option value="RECORRENTE">Recorrente</option><option value="DATA">Uma data específica</option></select></label>
        {draft.funcionamento === 'DATA' ? <label className="space-y-1 text-sm"><span>Data de funcionamento</span><Input type="date" required min={draft.tipo === 'ESCALA' ? blankDate() : today()} value={draft.contexto.dataOperacao} onChange={e => { setDraft(changeTrafficDate(draft, e.target.value)); setDirty(true); }} /></label>
          : <label className="space-y-1 text-sm"><span>Dias de funcionamento</span><select className={select} value={draft.contexto.escalaTipo} onChange={e => {
            const escalaTipo = e.target.value as TrafficCommand['contexto']['escalaTipo'];
            setDraft({ ...draft, revisao: 0, contexto: { ...draft.contexto, escalaTipo, turno: escalaTipo === 'SEG_SEX' ? 'MATUTINO' : 'PADRAO' } }); setDirty(true);
          }}><option value="SEG_SEX">Segunda a sexta-feira</option><option value="SABADO">Sábado</option><option value="DOM_FER">Domingo / feriado</option></select></label>}
        {draft.tipo === 'SOLTURA' && draft.contexto.escalaTipo === 'SEG_SEX' && <label className="space-y-1 text-sm"><span>Turno</span><select className={select} value={draft.contexto.turno} onChange={e => {
          const turno = e.target.value as 'MATUTINO' | 'VESPERTINO';
            setDraft({ ...draft, origemCarros: turno === 'VESPERTINO' ? undefined : draft.origemCarros, revisao: draft.funcionamento === 'RECORRENTE' ? 0 : draft.revisao, contexto: { ...draft.contexto, turno },
            itens: turno === 'VESPERTINO' ? draft.itens.map(row => ({ ...row, carroProgramado: '' })) : draft.itens }); setDirty(true);
        }}><option value="MATUTINO">Matutino</option><option value="VESPERTINO">Vespertino</option></select></label>}
      </fieldset>
      <p className="mt-3 text-sm text-muted-foreground">A programação de uma data específica tem prioridade sobre o recorrente. Alterações recorrentes valem a partir do dia em que forem salvas. Datas anteriores e folhas já iniciadas são preservadas. Alterar o tipo de funcionamento cria uma cópia e mantém o cadastro de origem.</p>
      {draft.tipo === 'SOLTURA' && draft.contexto.turno !== 'VESPERTINO' && <>
        <label className="mt-4 block max-w-xl space-y-1 text-sm" htmlFor="traffic-scale-link"><span>Escala de vinculação</span>
          <select id="traffic-scale-link" className={select} disabled={saving} value={draft.origemCarros === 'ESCALA' ? scaleLinks[0]?.key ?? 'indisponivel' : ''} onChange={e => { setDraft({ ...draft, origemCarros: e.target.value ? 'ESCALA' : undefined }); setDirty(true); }}>
            <option value="">Sem vínculo — usar carros programados da Soltura</option>
            {scaleLinks.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
            {!scaleLinks.length && draft.origemCarros === 'ESCALA' && <option value="indisponivel" disabled>Escala vinculada indisponível no catálogo</option>}
          </select>
        </label>
        <p className="mt-2 text-sm text-muted-foreground">São exibidas somente Escalas da mesma garagem e tipo de dia. Para vincular uma Escala especial, selecione “Uma data específica” e informe o mesmo dia. Se houver Escala especial para essa data, ela tem prioridade sobre a recorrente. No recorrente, o vínculo acompanha a Escala utilizada em cada data.</p>
        <p className="mt-2 text-sm text-muted-foreground">{draft.origemCarros === 'ESCALA' ? 'Mantém estas linhas e horários. Todos os carros vêm da Escala finalizada da mesma data, garagem e tipo de dia, pela linha e tabela, incluindo substitutos. Sem correspondência única, a viagem fica sem carro programado. Os carros cadastrados neste modelo ficam guardados, mas não são usados enquanto o vínculo estiver ativo.' : draft.funcionamento === 'DATA' ? 'Nesta exceção, os carros programados são os informados abaixo.' : 'No recorrente, carros programados em branco seguem a Escala finalizada.'} A operação continua exigindo CI e Escala finalizadas.</p>
      </>}</section>
    <section className={card}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Viagens</h2><Button variant="outline" disabled={saving} onClick={() => {
        try { const id = `trafego-${maintenanceOperationId()}`; addedRow.current = id; setDraft({ ...draft, itens: [...draft.itens, { id, ordem: draft.itens.length + 1, linha: '', tabela: '', carroProgramado: '', saidaGaragem: '', tipo: 'REGULAR', status: 'PENDENTE' }] }); setPendingRows(current => new Set(current).add(id)); setDirty(true); }
        catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível adicionar.'); }
      }}><Plus className="mr-2 h-4 w-4" />Adicionar linha</Button></div>
      <p id="traffic-row-help" className="mb-3 text-xs text-muted-foreground">Arraste pela alça para mudar a ordem, ou use as setas do teclado com a alça selecionada. Confirme as linhas alteradas no ✓ e clique em Salvar programação para gravar.</p>
      <p role="status" aria-live="polite" className="mb-3 text-xs text-emerald-800 dark:text-emerald-300">{rowNotice}{pendingRows.size > 0 ? ` ${pendingRows.size} linha(s) aguardando confirmação.` : ''}</p>
      <fieldset disabled={saving} className="min-w-0 max-w-full overflow-x-auto"><table className="w-full min-w-[880px] table-fixed text-sm">
        <colgroup><col className="w-8" />{rowFields.map(([key]) => <col key={key} className={key === 'ordem' ? 'w-16' : key === 'linha' ? 'w-28' : key === 'tabela' ? 'w-20' : key === 'carroProgramado' ? 'w-24' : undefined} />)}<col className="w-32" /><col className="w-20" /></colgroup>
        <thead><tr><th><span className="sr-only">Mover linha</span></th>{rowFields.map(([, label]) => <th className="px-1 py-3 text-left text-xs text-muted-foreground" key={label}>{label}</th>)}<th className="px-1 text-left text-xs text-muted-foreground">Tipo</th><th className="text-xs text-muted-foreground">Ações</th></tr></thead>
        <tbody>{draft.itens.map(row => <tr key={row.id} ref={element => {
          if (!element || addedRow.current !== row.id) return;
          addedRow.current = null;
          element.querySelector<HTMLInputElement>('input[data-traffic-field="linha"]')?.focus({ preventScroll: true });
          element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
        }} data-traffic-row-id={row.id} className={`border-t ${rowDrag.dragging === row.id ? 'opacity-50' : ''} ${rowDrag.over === row.id && rowDrag.dragging !== row.id ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950' : ''}`}>
          <td><Button variant="ghost" size="icon" className="h-8 w-7 touch-none cursor-grab text-muted-foreground active:cursor-grabbing" data-traffic-row-handle {...rowDrag.handleProps(row.id)} aria-label={`Mover viagem ${row.ordem ?? row.id}`} aria-describedby="traffic-row-help" title="Arrastar para mudar a ordem; use as setas para mover pelo teclado"><GripVertical className="h-4 w-4" /></Button></td>
          {rowFields.map(([key, label]) => <td key={key} className="p-1"><Input data-traffic-field={key} className="h-9 min-w-0 px-2 text-xs tabular-nums" aria-label={`${label} da viagem ${row.ordem ?? row.id}`} type={key === 'ordem' ? 'number' : 'text'} min={0} value={row[key] ?? ''} onChange={e => update(row.id, key, e.target.value)} /></td>)}
          <td className="p-1"><select aria-label="Tipo da viagem" className="h-9 w-full min-w-0 rounded-md border bg-background px-2 text-xs" value={row.tipo ?? 'REGULAR'} onChange={e => update(row.id, 'tipo', e.target.value)}>{['REGULAR', 'VCM', 'FRETAMENTO', 'EXTRA'].map(type => <option key={type}>{type}</option>)}</select></td>
          <td><div className="flex items-center justify-center gap-1"><Button size="icon" className="h-7 w-7 rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D] disabled:bg-[#9EB7AE] disabled:opacity-100" aria-label={`Confirmar edição da viagem ${row.ordem ?? row.id}`} aria-pressed={!pendingRows.has(row.id)} title={pendingRows.has(row.id) ? 'Confirmar edição da linha' : 'Linha confirmada'} disabled={saving || !pendingRows.has(row.id)} onClick={() => confirmRow(row.id)}><Check className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Excluir viagem ${row.ordem ?? row.id}`} onClick={() => removeRow(row.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></td></tr>)}</tbody></table></fieldset>
      {!draft.itens.length && <p className="py-10 text-center text-muted-foreground">Adicione a primeira viagem.</p>}
    </section>
  </main>;

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Escalas e solturas</h1><p className="mt-2 text-sm text-muted-foreground">Edite os modelos recorrentes e as exceções por data.</p></div>
      <Button disabled={!catalog || loading} onClick={() => create()} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]"><Plus className="mr-2 h-4 w-4" />Criar escala ou soltura</Button></header>
    <div className="flex items-center gap-3"><label htmlFor="traffic-garage" className="text-sm">Garagem</label><select id="traffic-garage" className={`${select} max-w-40`} value={garagem} disabled={user?.role !== 'ADMIN' || loading} onChange={e => setGaragem(e.target.value as 'VCG' | 'VCM')}><option>VCG</option><option>VCM</option></select><Button variant="outline" disabled={loading} onClick={() => void load()}>Recarregar</Button></div>
    {loading && <p role="status">Carregando programações…</p>}{error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p>}
    {catalog && <div className="grid gap-6 lg:grid-cols-2">{(['ESCALA', 'SOLTURA'] as const).map(type => <section key={type} className="space-y-3"><h2 className="flex items-center gap-2 text-xl font-semibold">{type === 'ESCALA' ? <CalendarClock className="h-5 w-5" /> : <Bus className="h-5 w-5" />}{type === 'ESCALA' ? 'Escalas' : 'Solturas'}</h2>
      {catalog.excecoes.filter(item => item.tipo === type).map(item => <article key={JSON.stringify(item.contexto)} className={card}><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{item.nome}</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">Exceção por data</span></div><p className="text-sm text-muted-foreground">{item.contexto.dataOperacao.split('-').reverse().join('/')} · {days[item.contexto.escalaTipo]} · {item.contexto.turno.toLowerCase()} · {item.itens.length} viagens</p>{item.tipo === 'SOLTURA' && <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Escala vinculada:</span> {scaleLinkDescription(item)}</p>}<Button variant="outline" className="mt-4 rounded-full" onClick={() => beginEdit(editDatedTraffic(item))}><Pencil className="mr-2 h-4 w-4" />Editar</Button></article>)}
      {catalog.padroes.filter(item => item.tipo === type).map(item => <article key={item.chave} className={card}><h3 className="font-semibold">{item.nome}</h3><p className="mt-2 text-sm text-muted-foreground">Recorrente · {days[item.contexto.escalaTipo]} · {item.contexto.turno.toLowerCase()} · {item.itens.length} viagens</p>{item.tipo === 'SOLTURA' && <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Escala vinculada:</span> {scaleLinkDescription(item)}</p>}<Button variant="outline" className="mt-4 rounded-full" onClick={() => openModel(item)}><Pencil className="mr-2 h-4 w-4" />Editar</Button></article>)}
    </section>)}</div>}
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl"><DialogTitle>Criar escala ou soltura</DialogTitle><DialogDescription>Escolha a data e comece do zero ou copie uma programação.</DialogDescription>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); begin(); }}>
        <label className="block space-y-1 text-sm"><span>O que deseja criar?</span><select className={select} value={kind} onChange={e => { setKind(e.target.value as typeof kind); setBase(''); setTurn('MATUTINO'); }}><option value="ESCALA">Escala de carros</option><option value="SOLTURA">Soltura</option></select></label>
        <label className="block space-y-1 text-sm"><span>Funcionamento</span><select className={select} value={createMode} onChange={e => { setCreateMode(e.target.value as 'DATA' | 'RECORRENTE'); setBase(''); }}><option value="DATA">Uma data específica</option><option value="RECORRENTE">Recorrente</option></select></label>
        {createMode === 'RECORRENTE' && <label className="block space-y-1 text-sm"><span>Dias de funcionamento</span><select className={select} value={createDays} onChange={e => setCreateDays(e.target.value as typeof createDays)}><option value="SEG_SEX">Segunda a sexta-feira</option><option value="SABADO">Sábado</option><option value="DOM_FER">Domingo / feriado</option></select></label>}
        <label className="block space-y-1 text-sm"><span>Nome da {kind === 'ESCALA' ? 'escala' : 'soltura'}</span><Input required maxLength={150} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Operação especial de segunda" /></label>
        {createMode === 'DATA' && <label className="block space-y-1 text-sm"><span>Para que dia será usada?</span><Input type="date" required min={kind === 'ESCALA' ? blankDate() : today()} value={date} onChange={e => { setDate(e.target.value); if (base.startsWith('soltura-dia:')) setBase(''); }} /></label>}
        {kind === 'SOLTURA' && (createMode === 'RECORRENTE' ? createDays === 'SEG_SEX' : date && defaultScheduleSelection(date).dayType === 'SEG_SEX') && <label className="block space-y-1 text-sm"><span>Turno</span><select className={select} value={turn} onChange={e => setTurn(e.target.value as typeof turn)}><option value="MATUTINO">Matutino</option><option value="VESPERTINO">Vespertino</option></select></label>}
        <label className="block space-y-1 text-sm"><span>Como deseja começar?</span><select className={select} value={base} onChange={e => setBase(e.target.value)}><option value="">Criar do zero</option>{bases.map(item => <option key={item.key} value={item.key}>Usar como base: {item.label}</option>)}</select></label>
          {kind === 'SOLTURA' && <p className="text-sm text-muted-foreground">Você pode copiar outra Soltura ou uma Escala de Carros da mesma garagem. A cópia mantém linhas, carros e horários para edição, sem alterar a origem. No vespertino, os carros programados ficam vazios. O vínculo com a Escala é configurado separadamente no editor.</p>}
        {kind === 'ESCALA' && createMode === 'DATA' && <p className="text-sm text-muted-foreground">{catalog && sameDayReleaseBases(catalog.excecoes, garagem, date).length
          ? 'Você também pode escolher a Soltura cadastrada para esta data. As linhas serão copiadas para editar a nova Escala.'
          : 'Para usar a Soltura desta data como base, cadastre e salve primeiro essa Soltura na mesma garagem.'}</p>}
        <Button type="submit" className="w-full rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]">Continuar para editar viagens</Button>
      </form>
    </DialogContent></Dialog>
  </main>;
}
