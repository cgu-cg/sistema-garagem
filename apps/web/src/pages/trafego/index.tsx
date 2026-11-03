import { useEffect, useRef, useState } from 'react';
import { Bus, CalendarClock, Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';
import { defaultScheduleSelection } from '@/lib/scheduleSelection';
import { trafficCommandSchema, type TrafficCommand, type TrafficRow } from '@/lib/trafficSchema';
import { maintenanceOperationId } from '@/lib/maintenanceCompatibility';
import { copyTrafficBase, sameDayReleaseBases } from '@/lib/trafficBases';

type Model = Omit<TrafficCommand, 'contexto' | 'revisao'> & { chave: string; contexto: Omit<TrafficCommand['contexto'], 'dataOperacao'> };
type Catalog = { padroes: Model[]; excecoes: TrafficCommand[] };
const days = { SEG_SEX: 'Seg–Sex', SABADO: 'Sábado', DOM_FER: 'Dom/Fer' };
const card = 'min-w-0 rounded-2xl border bg-card p-5';
const select = 'h-10 w-full rounded-md border bg-background px-3 text-sm';
const fields = [
  ['ordem', 'Ordem'], ['linha', 'Linha'], ['tabela', 'Tabela'], ['carroProgramado', 'Carro fixo / programado'],
  ['saidaGaragem', 'Saída garagem'], ['chegadaGaragem', 'Chegada garagem'], ['inicioLinha', 'Início linha'],
  ['inicioBairro', 'Início bairro'], ['ordemTerminal', 'Ordem terminal'], ['observacoes', 'Observações'],
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
  const [draft, setDraft] = useState<TrafficCommand | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const request = useRef(0);
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
    setBase(model?.chave ?? ''); setCreating(true);
  }
  const bases = catalog ? [
    ...catalog.padroes.filter(p => p.tipo === kind).map(p => ({ key: p.chave, label: p.nome, itens: p.itens })),
    ...catalog.excecoes.filter(p => p.tipo === kind).map((p, i) => ({ key: `excecao-${i}`, label: `${p.nome} · ${p.contexto.dataOperacao}`, itens: p.itens })),
    ...(kind === 'ESCALA' ? sameDayReleaseBases(catalog.excecoes, garagem, date) : []),
  ] : [];
  function begin() {
    if (!name.trim() || !date) { toast.error('Informe o nome e a data.'); return; }
    const dayType = defaultScheduleSelection(date).dayType;
    const source = bases.find(b => b.key === base);
    if (base && !source) { toast.error('Selecione novamente a base para a data escolhida.'); return; }
    setDraft({ tipo: kind, nome: name.trim(), revisao: 0,
      contexto: { garagem, escalaTipo: dayType, turno: dayType === 'SEG_SEX' ? kind === 'ESCALA' ? 'MATUTINO' : turn : 'PADRAO', dataOperacao: date },
      itens: source ? copyTrafficBase(source.itens, maintenanceOperationId).map(row => ({ ...row,
        carroProgramado: kind === 'SOLTURA' && turn === 'VESPERTINO' && dayType === 'SEG_SEX' ? '' : row.carroProgramado })) : [] });
    setDirty(true); setCreating(false);
  }
  function update(rowId: string, key: keyof TrafficRow, value: string) {
    setDraft(current => current && ({ ...current, itens: current.itens.map(row => row.id !== rowId ? row : {
      ...row, [key]: key === 'ordem' || key === 'ordemTerminal' ? value === '' ? undefined : Number(value) : value,
    }) })); setDirty(true);
  }
  async function save() {
    const parsed = trafficCommandSchema.safeParse(draft);
    if (!parsed.success) { const issue = parsed.error.issues[0]; toast.error(`${issue.path.join('.')}: ${issue.message}`); return; }
    setSaving(true);
    try { const saved = await api.post<TrafficCommand>('/trafego/programacoes', parsed.data); setDraft(saved); setDirty(false); toast.success('Programação salva para a data escolhida.'); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }
  function back() { if (dirty && !window.confirm('Descartar alterações não salvas?')) return; setDraft(null); setDirty(false); }

  const rowFields = fields.filter(([key]) => key !== 'carroProgramado' || draft?.tipo !== 'SOLTURA' || draft.contexto.turno !== 'VESPERTINO');
  if (draft) return <main className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Button variant="ghost" onClick={back} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button><h1 className="mt-2 text-2xl font-bold">Editar {draft.tipo === 'ESCALA' ? 'escala' : 'soltura'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{draft.contexto.garagem} · {draft.contexto.dataOperacao.split('-').reverse().join('/')} · {days[draft.contexto.escalaTipo]} · {draft.contexto.turno.toLowerCase()} · {draft.itens.length} viagens</p></div>
      <Button onClick={() => void save()} disabled={saving || !dirty} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]"><Save className="mr-2 h-4 w-4" />{saving ? 'Salvando…' : 'Salvar programação'}</Button>
    </header>
    <section className={card}><label className="text-sm font-medium" htmlFor="traffic-name">Nome</label><Input id="traffic-name" value={draft.nome} maxLength={150} disabled={saving} onChange={e => { setDraft({ ...draft, nome: e.target.value }); setDirty(true); }} />
      <p className="mt-3 text-sm text-muted-foreground">Válida somente para esta data. Para outra data, use este cadastro como base ao criar uma nova programação. Folhas já iniciadas são preservadas.</p>
      {draft.tipo === 'SOLTURA' && draft.contexto.turno !== 'VESPERTINO' && <p className="mt-2 text-sm text-muted-foreground">Nesta exceção, os carros programados são os informados abaixo. A operação continua exigindo CI e Escala finalizadas.</p>}</section>
    <section className={card}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Viagens</h2><Button variant="outline" disabled={saving} onClick={() => {
        try { setDraft({ ...draft, itens: [...draft.itens, { id: `trafego-${maintenanceOperationId()}`, ordem: draft.itens.length + 1, linha: '', tabela: '', carroProgramado: '', saidaGaragem: '', tipo: 'REGULAR', status: 'PENDENTE' }] }); setDirty(true); }
        catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível adicionar.'); }
      }}><Plus className="mr-2 h-4 w-4" />Adicionar linha</Button></div>
      <fieldset disabled={saving} className="min-w-0 max-w-full overflow-x-auto"><table className="w-full text-sm"><thead><tr>{rowFields.map(([, label]) => <th className="min-w-32 px-2 py-3 text-left text-xs text-muted-foreground" key={label}>{label}</th>)}<th className="min-w-36 px-2 text-left">Tipo</th><th>Ação</th></tr></thead>
        <tbody>{draft.itens.map(row => <tr key={row.id} className="border-t">{rowFields.map(([key, label]) => <td key={key} className="p-1"><Input aria-label={`${label} da viagem ${row.ordem ?? row.id}`} type={key === 'ordem' || key === 'ordemTerminal' ? 'number' : 'text'} min={0} value={row[key] ?? ''} onChange={e => update(row.id, key, e.target.value)} /></td>)}
          <td className="p-1"><select aria-label="Tipo da viagem" className={select} value={row.tipo ?? 'REGULAR'} onChange={e => update(row.id, 'tipo', e.target.value)}>{['REGULAR', 'VCM', 'FRETAMENTO', 'EXTRA'].map(type => <option key={type}>{type}</option>)}</select></td>
          <td><Button variant="ghost" size="icon" aria-label={`Excluir viagem ${row.ordem ?? row.id}`} onClick={() => { if (!window.confirm('Excluir esta viagem da programação?')) return; setDraft({ ...draft, itens: draft.itens.filter(i => i.id !== row.id) }); setDirty(true); }}><Trash2 className="h-4 w-4 text-rose-600" /></Button></td></tr>)}</tbody></table></fieldset>
      {!draft.itens.length && <p className="py-10 text-center text-muted-foreground">Adicione a primeira viagem.</p>}
    </section>
  </main>;

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Escalas e solturas</h1><p className="mt-2 text-sm text-muted-foreground">Crie e ajuste programações especiais para uma data.</p></div>
      <Button disabled={!catalog || loading} onClick={() => create()} className="rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]"><Plus className="mr-2 h-4 w-4" />Criar escala ou soltura</Button></header>
    <div className="flex items-center gap-3"><label htmlFor="traffic-garage" className="text-sm">Garagem</label><select id="traffic-garage" className={`${select} max-w-40`} value={garagem} disabled={user?.role !== 'ADMIN' || loading} onChange={e => setGaragem(e.target.value as 'VCG' | 'VCM')}><option>VCG</option><option>VCM</option></select><Button variant="outline" disabled={loading} onClick={() => void load()}>Recarregar</Button></div>
    {loading && <p role="status">Carregando programações…</p>}{error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p>}
    {catalog && <div className="grid gap-6 lg:grid-cols-2">{(['ESCALA', 'SOLTURA'] as const).map(type => <section key={type} className="space-y-3"><h2 className="flex items-center gap-2 text-xl font-semibold">{type === 'ESCALA' ? <CalendarClock className="h-5 w-5" /> : <Bus className="h-5 w-5" />}{type === 'ESCALA' ? 'Escalas' : 'Solturas'}</h2>
      {catalog.excecoes.filter(item => item.tipo === type).map(item => <article key={JSON.stringify(item.contexto)} className={card}><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{item.nome}</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">Exceção por data</span></div><p className="text-sm text-muted-foreground">{item.contexto.dataOperacao.split('-').reverse().join('/')} · {days[item.contexto.escalaTipo]} · {item.contexto.turno.toLowerCase()} · {item.itens.length} viagens</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => { setDraft(structuredClone(item)); setDirty(false); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button></article>)}
      {catalog.padroes.filter(item => item.tipo === type).map(item => <article key={item.chave} className={card}><h3 className="font-semibold">{item.nome}</h3><p className="mt-2 text-sm text-muted-foreground">Padrão · {item.itens.length} viagens</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => create(item)}><Pencil className="mr-2 h-4 w-4" />Editar para uma data</Button></article>)}
    </section>)}</div>}
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl"><DialogTitle>Criar escala ou soltura</DialogTitle><DialogDescription>Escolha a data e comece do zero ou copie uma programação.</DialogDescription>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); begin(); }}>
        <label className="block space-y-1 text-sm"><span>O que deseja criar?</span><select className={select} value={kind} onChange={e => { setKind(e.target.value as typeof kind); setBase(''); setTurn('MATUTINO'); }}><option value="ESCALA">Escala de carros</option><option value="SOLTURA">Soltura</option></select></label>
        <label className="block space-y-1 text-sm"><span>Nome da {kind === 'ESCALA' ? 'escala' : 'soltura'}</span><Input required maxLength={150} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Operação especial de segunda" /></label>
        <label className="block space-y-1 text-sm"><span>Para que dia será usada?</span><Input type="date" required min={kind === 'ESCALA' ? blankDate() : today()} value={date} onChange={e => { setDate(e.target.value); if (base.startsWith('soltura-dia:')) setBase(''); }} /></label>
        {kind === 'SOLTURA' && date && defaultScheduleSelection(date).dayType === 'SEG_SEX' && <label className="block space-y-1 text-sm"><span>Turno</span><select className={select} value={turn} onChange={e => setTurn(e.target.value as typeof turn)}><option value="MATUTINO">Matutino</option><option value="VESPERTINO">Vespertino</option></select></label>}
        <label className="block space-y-1 text-sm"><span>Como deseja começar?</span><select className={select} value={base} onChange={e => setBase(e.target.value)}><option value="">Criar do zero</option>{bases.map(item => <option key={item.key} value={item.key}>Usar como base: {item.label}</option>)}</select></label>
        {kind === 'ESCALA' && <p className="text-sm text-muted-foreground">{catalog && sameDayReleaseBases(catalog.excecoes, garagem, date).length
          ? 'Você também pode escolher a Soltura cadastrada para esta data. As linhas serão copiadas para editar a nova Escala.'
          : 'Para usar a Soltura desta data como base, cadastre e salve primeiro essa Soltura na mesma garagem.'}</p>}
        <Button type="submit" className="w-full rounded-full bg-[#164E3A] text-white hover:bg-[#113C2D]">Continuar para editar viagens</Button>
      </form>
    </DialogContent></Dialog>
  </main>;
}
