// Excecao transitoria MVP legado. C4 substituira esta inferencia por folha/ciclo persistidos.
export class MvpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function operationalContext(now = new Date(), closingSeconds = 66600) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const seconds = Number(get('hour')) * 3600 + Number(get('minute')) * 60 + Number(get('second'));
  return { today, tomorrow: tomorrow.toISOString().slice(0, 10), open: seconds >= 10800 && seconds < closingSeconds };
}
export function assertContext(date: unknown, kind: 'ci' | 'manutencao', now = new Date(), closingSeconds = 66600) {
  const ctx = operationalContext(now, closingSeconds);
  if (!ctx.open) throw new MvpError(409, `Janela operacional fechada (03:00 ate ${closingSeconds === 72000 ? '20:00' : '18:30'} em America/Campo_Grande).`);
  if (date !== (kind === 'ci' ? ctx.tomorrow : ctx.today)) throw new MvpError(409, 'Data fora do contexto operacional permitido.');
  return ctx;
}
export function isVCG(prefixo: string) { return !prefixo.startsWith('1') && prefixo !== '2002'; }
export function revision(items: readonly { id?: string; updatedAt?: unknown }[]) {
  // Conteudo + timestamp: duas gravacoes no mesmo milissegundo nao compartilham versao.
  return JSON.stringify(items.map(item => {
    const i = item as Record<string, any>;
    const category = i.categoria ?? i.categoriaPlanilha ?? null;
    // Date.toString() descarta milissegundos; preserve o instante antes do transporte JSON.
    const updatedAt = i.updatedAt instanceof Date ? i.updatedAt.toISOString() : new Date(String(i.updatedAt)).toISOString();
    return [i.id, updatedAt, i.prefixo, i.consorciada,
      i.data ?? i.dataBloqueio, i.garagem ?? null, category, i.observacao ?? null,
      i.bloqueado ?? null, i.emExecucao ?? null, i.liberado ?? null,
      i.motivo || '', category === 'OFICINA' || category === 'PREVENTIVA' ? (i.subTipo ?? i.setorOficina ?? i.tipoPreventiva ?? '') : '',
      i.horarioReforco || '', i.horaBloqueio ?? i.hora ?? '', i.responsavel || '',
      i.observacoes ?? i.os ?? '', i.status || 'BLOQUEADO', i.gravidade || 'ALTA', i.dataLiberacao || '', i.motivoLiberacao || '', i.responsavelLiberacao || '',
      ...(i.chaveItem ? [i.chaveItem, i.tipoPosicao ?? null, i.ordemPosicao ?? null, i.dataBloqueio ?? null] : i.cicloId ? [i.observacaoBloqueio ?? null, i.observacaoOficina ?? null] : [])];
  }).sort((a, b) => String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0));
}
export function assertFlags(items: { prefixo: string; bloqueado: boolean; emExecucao: boolean; liberado: boolean }[]) {
  const blocked = new Set<string>();
  for (const i of items) {
    if (i.liberado && (i.bloqueado || i.emExecucao)) throw new MvpError(400, 'Liberado nao pode coexistir com bloqueio ou execucao.');
    if (i.bloqueado) {
      if (blocked.has(i.prefixo)) throw new MvpError(409, 'Bloqueado duplicado para o mesmo prefixo.');
      blocked.add(i.prefixo);
    }
    if (items.some(j => j.prefixo === i.prefixo && j.liberado) && items.some(j => j.prefixo === i.prefixo && (j.bloqueado || j.emExecucao))) {
      throw new MvpError(400, 'Estados incompatíveis em registros separados do mesmo veiculo.');
    }
  }
}
