import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { fetchC4Context, type C4Context } from '@/lib/c4';
import { c4Realtime } from '@/lib/c4RealtimeClient';
import { operationalContext } from '@/lib/mvpTemporal';
import { canReadOperation, explicitGarage } from '@/lib/operationalAccess';
import { useAuth } from '@/stores/auth';

export function summarizeCI(context: C4Context, date: string, garage: 'VCG' | 'VCM') {
  if (context.mode !== 'C4' || context.garagem !== garage || !Array.isArray(context.folhas) || !Array.isArray(context.ci))
    throw new Error('Consulta da CI indisponível.');
  const sheets = context.folhas.filter(sheet => sheet.dataFolha === date);
  if (sheets.length > 1) throw new Error('Consulta da CI inconsistente.');
  const source = sheets[0] ?? context.folhas.filter(sheet => sheet.status === 'FINALIZADA' && sheet.dataFolha < date)
    .sort((a, b) => b.dataFolha.localeCompare(a.dataFolha))[0];
  if (!source) return { status: 'Não iniciada', blocked: null, sourceDate: date, provisional: false };
  if (context.folhas.filter(sheet => sheet.dataFolha === source.dataFolha).length > 1) throw new Error('Consulta da CI inconsistente.');
  const status = source.status;
  if (!['FINALIZADA', 'EM_PREPARACAO'].includes(status)) throw new Error('Estado da CI indisponível.');
  const items = context.ci.filter(item => item.data === source.dataFolha && item.garagem === garage
    && item.categoriaPlanilha === 'BLOQUEADO' && item.status !== 'LIBERADO');
  if (items.some(item => !/^\d{1,10}$/.test(item.prefixo))) throw new Error('Bloqueados da CI inconsistentes.');
  const blocked = new Set(items.map(item => item.prefixo));
  return { status: status === 'FINALIZADA' ? 'Finalizada' : 'Em preparação', blocked: blocked.size,
    sourceDate: source.dataFolha, provisional: !sheets.length };
}

export function CiSummaryCard() {
  const { user } = useAuth();
  const garage = explicitGarage(user) ?? (user?.role === 'ADMIN' ? 'VCG' : undefined);
  const allowed = canReadOperation(user) && Boolean(garage);
  const [summary, setSummary] = useState<ReturnType<typeof summarizeCI> | null>(null);
  const [date, setDate] = useState(operationalContext().tomorrow);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true, sequence = 0;
    setSummary(null); setError('');
    if (!allowed || !garage) { setLoading(false); return; }
    const refresh = async () => {
      const request = ++sequence, day = operationalContext();
      setLoading(true); setDate(day.tomorrow);
      try {
        const result = summarizeCI(await fetchC4Context(garage, day.today), day.tomorrow, garage);
        if (active && request === sequence) { setSummary(result); setError(''); }
      } catch {
        if (active && request === sequence) { setSummary(null); setError('Consulta da CI indisponível.'); }
      } finally { if (active && request === sequence) setLoading(false); }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    const unsubscribe = c4Realtime.subscribe(event => { if (!event || event.garagem === garage) void refresh(); });
    return () => { active = false; unsubscribe(); window.removeEventListener('focus', refresh); };
  }, [allowed, garage, user?.id]);
  const status = !allowed ? 'Sem acesso à CI' : loading ? 'Consultando CI...' : error || (summary?.provisional ? 'Última CI finalizada' : summary?.status);
  const sourceDate = !loading && !error && allowed ? summary?.sourceDate ?? date : date;
  return <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800/80 dark:bg-[#0E1420] flex min-h-[148px] flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">CI MANUTENÇÃO</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[#164E3A] dark:bg-slate-800 dark:text-emerald-400"><ClipboardCheck className="h-4 w-4" /></div>
    </div>
    <div className="my-2">
      <div className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{loading || error || !allowed ? '—' : summary?.blocked ?? '—'} <span className="text-base font-semibold text-slate-500">bloqueados</span></div>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">CI de {sourceDate.split('-').reverse().join('/')}{garage ? ' • ' + garage : ''}</p>
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1 text-[11px] dark:border-slate-800/60">
      <span role="status" className={error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>{status}</span>
      {allowed && <Link to="/manutencao/ci-manutencao" className="shrink-0 font-medium text-[#164E3A] dark:text-emerald-400">Abrir CI →</Link>}
    </div>
  </div>;
}
