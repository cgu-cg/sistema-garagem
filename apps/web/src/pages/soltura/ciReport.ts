import type { BloqueioCarro } from '@/data/solturaTypes';

export function normalizeIsoDate(d?: string): string {
  if (!d) return '';
  const clean = String(d).trim().split(/[\sT]/)[0];
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) return parts[0].length === 4
      ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return clean;
}

// FolhaCI e unica por garagem/dataFolha; a API projeta esses campos do pai.
// Consorciada e garagem fisica do veiculo nao identificam a folha.
export function selectCIReportItems(items: BloqueioCarro[], date: string, garage: string) {
  const day = normalizeIsoDate(date);
  if (!day || (garage !== 'VCG' && garage !== 'VCM')) return [];
  return items.filter(i => normalizeIsoDate(i.data) === day && i.garagem === garage && i.status !== 'LIBERADO');
}

// Data da folha seleciona a fotografia; dataBloqueio identifica o inicio do bloqueio.
export function ciBlockDate(item: BloqueioCarro | undefined, c4: boolean): string {
  return normalizeIsoDate(item?.dataBloqueio || (c4 ? '' : item?.data));
}

function legacySlot(item: BloqueioCarro) {
  return item.reforcoSlotId || item.id?.match(/(?:^|[-_])(ref(?:-extra)?-\d+)(?:[-_]|$)/)?.[1];
}

export function ciReportExtraSlots(items: BloqueioCarro[]) {
  const orders = new Set([1, 2, 3, 4, 5, 6]);
  for (const i of items.filter(i => i.categoriaPlanilha === 'REFORCO')) {
    const order = i.tipoPosicao === 'EXTRA' ? i.ordemPosicao : Number(legacySlot(i)?.match(/^ref-extra-(\d+)$/)?.[1]);
    if (order && order > 0) orders.add(order);
  }
  return [...orders].sort((a, b) => a - b).map(n => ({ id: `ref-extra-${n}` }));
}

// Usa somente itens salvos da folha selecionada, nunca drafts/localStorage.
export function ciReportSlot(items: BloqueioCarro[], slotId: string, c4: boolean,
  horario = '', fixedSlots: readonly { id: string; horario: string }[] = []) {
  const position = slotId.match(/^ref(-extra)?-(\d+)$/);
  const reforco = items.filter(i => i.categoriaPlanilha === 'REFORCO');
  let item = position ? reforco.find(i => c4
    ? i.tipoPosicao === (position[1] ? 'EXTRA' : 'FIXO') && i.ordemPosicao === Number(position[2])
    : legacySlot(i) === slotId) : undefined;
  // Compatibilidade legada: horarios repetidos ocupam slots distintos, sem heranca.
  if (!item && !c4 && position && !position[1] && horario) {
    const candidates = reforco.filter(i => !legacySlot(i) && i.horarioReforco === horario);
    const index = fixedSlots.filter(s => s.horario === horario).findIndex(s => s.id === slotId);
    if (index >= 0) item = candidates[index];
  }
  return { prefixo: item?.prefixo ?? '', motivo: item?.motivo ?? '', obs: item?.os ?? '', savedItem: item };
}


const preventivaAliases = {
  PREVENTIVA: ['PREVENTIVA', 'PREVENTIVAS'],
  LUBRIFICACAO: ['LUBRIFICACAO'],
  TROCA_OLEO: ['TROCA OLEO', 'TROCA DE OLEO'],
  REVISAO_GERAL: ['REVISAO GERAL'],
  SISEP: ['SISEP'],
} as const;
const oficinaAliases = {
  MECANICA: ['MECANICA'], ELEVADOR: ['ELEVADOR'], ELETRICA: ['ELETRICA'],
  BORRACHARIA: ['BORRACHARIA'], FUNILARIA: ['FUNILARIA', 'FUNILARIA PINTURA'],
  TACOGRAFO: ['TACOGRAFO'], BILHETAGEM: ['BILHETAGEM'], LIMPEZA: ['LIMPEZA'],
} as const;

export function normalizeCIReportSubtype(value?: string | null): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[_\s/\-]+/g, ' ').trim();
}

function resolveSubtype<T extends string>(value: string | null | undefined, aliases: Record<T, readonly string[]>): T | undefined {
  const normalized = normalizeCIReportSubtype(value);
  return (Object.keys(aliases) as T[]).find(key =>
    aliases[key].some(alias => normalizeCIReportSubtype(alias) === normalized));
}

export function matchesCISubtype(category: 'PREVENTIVA' | 'OFICINA', value: string | null | undefined, target: string): boolean {
  if (category === 'PREVENTIVA') {
    const key = resolveSubtype(value, preventivaAliases);
    return key !== undefined && key === resolveSubtype(target, preventivaAliases);
  }
  const key = resolveSubtype(value, oficinaAliases);
  return key !== undefined && key === resolveSubtype(target, oficinaAliases);
}

function groupSubtypes<T extends string>(items: BloqueioCarro[], category: string,
  field: 'tipoPreventiva' | 'setorOficina', aliases: Record<T, readonly string[]>) {
  const groups = Object.fromEntries(Object.keys(aliases).map(key => [key, [] as BloqueioCarro[]])) as Record<T, BloqueioCarro[]>;
  const unknown: BloqueioCarro[] = [];
  for (const item of items.filter(i => i.categoriaPlanilha === category)) {
    const key = resolveSubtype(item[field], aliases);
    if (key) groups[key].push(item);
    else unknown.push(item);
  }
  const sort = (a: BloqueioCarro, b: BloqueioCarro) =>
    (a.prefixo || '').localeCompare(b.prefixo || '', undefined, { numeric: true });
  if (category !== 'PREVENTIVA') Object.values<BloqueioCarro[]>(groups).forEach(group => group.sort(sort));
  return { groups, unknown: unknown.sort(sort) };
}

// Agrupamento de apresentacao: preserva os objetos e valores persistidos.
export function groupCIReportSubtypes(items: BloqueioCarro[]) {
  const preventiva = groupSubtypes(items, 'PREVENTIVA', 'tipoPreventiva', preventivaAliases);
  const oficina = groupSubtypes(items, 'OFICINA', 'setorOficina', oficinaAliases);
  return {
    preventivas: preventiva.groups,
    oficina: oficina.groups,
    unknown: [...preventiva.unknown, ...oficina.unknown],
    numLinhasPreventivas: Math.max(0, ...Object.values(preventiva.groups).map(group => group.length)),
    numLinhasOficina: Math.max(9, ...Object.values(oficina.groups).map(group => group.length)),
  };
}
